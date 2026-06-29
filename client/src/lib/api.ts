import { Message, Settings } from '@/types/chat';

// ─── Core LLM Call ────────────────────────────────────────────────────────────

export async function callLLM(
  messages: Message[],
  settings: Settings,
  systemPrompt?: string,
  onChunk?: (text: string) => void,
): Promise<{ content: string; tokens: number }> {
  const { provider, apiKey, model, temperature, streamResponses } = settings;

  if (!apiKey && provider !== 'local') {
    throw new Error(`No API key set for ${provider}. Open ⚙️ Settings to add one.`);
  }

  const msgs = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  switch (provider) {
    case 'openai':    return callOpenAI(msgs, apiKey, model, temperature, streamResponses, onChunk);
    case 'anthropic': return callAnthropic(msgs, apiKey, model, temperature, streamResponses, onChunk);
    case 'gemini':    return callGemini(msgs, apiKey, model, temperature, onChunk);
    case 'local':     return callOllama(msgs, model, temperature, streamResponses, onChunk, settings.ollamaUrl);
    default:          throw new Error('Unknown provider');
  }
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

async function callOpenAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string, model: string, temperature: number,
  stream: boolean, onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, stream }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `OpenAI error ${res.status}`;
    if (res.status === 401) throw new Error('Invalid OpenAI API key. Check Settings ⚙️');
    if (res.status === 429) throw new Error('OpenAI rate limit hit. Wait a moment and retry.');
    if (res.status === 402) throw new Error('OpenAI billing issue. Check your plan at platform.openai.com');
    throw new Error(msg);
  }

  if (stream && onChunk) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const delta = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content;
            if (delta) { full += delta; onChunk(delta); }
          } catch {}
        }
      }
    }
    return { content: full, tokens: Math.ceil(full.length / 4) };
  }

  const data = await res.json();
  return { content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 };
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

async function callAnthropic(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string, model: string, temperature: number,
  stream: boolean, onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const system = messages.find(m => m.role === 'system')?.content;
  const convMsgs = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model, temperature, max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: convMsgs,
      stream,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid Anthropic API key. Check Settings ⚙️');
    if (res.status === 429) throw new Error('Anthropic rate limit. Wait a moment and retry.');
    throw new Error(err?.error?.message || `Anthropic error ${res.status}`);
  }

  if (stream && onChunk) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const delta = JSON.parse(line.slice(6))?.delta?.text;
            if (delta) { full += delta; onChunk(delta); }
          } catch {}
        }
      }
    }
    return { content: full, tokens: Math.ceil(full.length / 4) };
  }

  const data = await res.json();
  return {
    content: data.content?.[0]?.text || '',
    tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function callGemini(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string, model: string, temperature: number,
  onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const system = messages.find(m => m.role === 'system')?.content;

  // Gemini requires strictly alternating user/model turns — merge consecutive same-role
  const rawMsgs = messages.filter(m => m.role !== 'system');
  const convMsgs: { role: string; parts: { text: string }[] }[] = [];
  for (const m of rawMsgs) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (convMsgs.length > 0 && convMsgs[convMsgs.length - 1].role === role) {
      convMsgs[convMsgs.length - 1].parts[0].text += '\n' + m.content;
    } else {
      convMsgs.push({ role, parts: [{ text: m.content }] });
    }
  }
  if (convMsgs.length === 0 || convMsgs[0].role !== 'user') {
    convMsgs.unshift({ role: 'user', parts: [{ text: '.' }] });
  }

  const body: Record<string, unknown> = {
    contents: convMsgs,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg: string = err?.error?.message || `Gemini error ${res.status}`;

    // Friendly quota/billing errors
    if (msg.includes('free_tier') || msg.includes('Quota exceeded') || res.status === 429) {
      throw new Error(
        '🚫 Gemini free tier quota exhausted.\n\n' +
        'Fix: Go to aistudio.google.com → Get API key → Enable billing in Google Cloud Console.\n' +
        'Free tier allows 15 RPM for gemini-1.5-flash. Paid removes this limit.'
      );
    }
    if (res.status === 400 && msg.includes('not found')) {
      throw new Error(`Gemini model "${model}" not available. Try switching to gemini-1.5-flash in Settings ⚙️`);
    }
    if (res.status === 403) {
      throw new Error('Gemini API key invalid or API not enabled. Check aistudio.google.com/apikey');
    }
    throw new Error(msg);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) { full += text; if (onChunk) onChunk(text); }
          totalTokens = data?.usageMetadata?.totalTokenCount || totalTokens;
        } catch {}
      }
    }
  }

  return { content: full, tokens: totalTokens || Math.ceil(full.length / 4) };
}

// ─── Ollama (local) ───────────────────────────────────────────────────────────
// On HTTPS deployments (Netlify), browser can't call HTTP localhost directly.
// We detect and route through /api/ollama proxy (Netlify Function).

function isHttpsContext(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

async function callOllama(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string, temperature: number,
  stream: boolean, onChunk?: (t: string) => void,
  ollamaUrl = 'http://localhost:11434',
): Promise<{ content: string; tokens: number }> {
  const baseUrl = ollamaUrl.replace(/\/$/, '');
  const useProxy = isHttpsContext();

  // ── Proxy path (HTTPS deployment → Netlify Function) ──────────────────────
  if (useProxy) {
    const res = await fetch('/api/ollama/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ollamaUrl: baseUrl,
        endpoint: '/api/chat',
        model,
        messages,
        stream: false, // Netlify Functions don't support streaming response easily
        options: { temperature },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg: string = data?.error || `Proxy error ${res.status}`;
      if (errMsg.includes('Cannot reach') || errMsg.includes('ECONNREFUSED')) {
        throw new Error(
          `Cannot reach Ollama at ${baseUrl}.\n\n` +
          `Since you're on the web app, Ollama must be running on the same machine as your browser with CORS enabled:\n\n` +
          `OLLAMA_ORIGINS="*" ollama serve\n\n` +
          `Note: This proxy only works in local dev (http://localhost:5000). On Netlify, Ollama must be publicly accessible.`
        );
      }
      if (errMsg.includes('not found')) {
        throw new Error(`Model "${model}" not pulled yet. Run: ollama pull ${model}`);
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const content = data.message?.content || '';
    if (onChunk) onChunk(content);
    return { content, tokens: data.eval_count || Math.ceil(content.length / 4) };
  }

  // ── Direct path (local dev http://localhost:5000) ─────────────────────────
  try {
    await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    throw new Error(
      `Cannot reach Ollama at ${baseUrl}.\n\n` +
      `Start Ollama with CORS enabled:\n` +
      `  OLLAMA_ORIGINS="*" ollama serve\n\n` +
      `Then pull a model:\n` +
      `  ollama pull llama3.2`
    );
  }

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream, options: { temperature } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (text.includes('not found')) {
      throw new Error(`Model "${model}" not found. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error ${res.status}`);
  }

  if (stream && onChunk) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n').filter(Boolean)) {
        try {
          const data = JSON.parse(line);
          const delta = data?.message?.content;
          if (delta) { full += delta; onChunk(delta); }
        } catch {}
      }
    }
    return { content: full, tokens: Math.ceil(full.length / 4) };
  }

  const data = await res.json();
  return { content: data.message?.content || '', tokens: data.eval_count || 0 };
}

// ─── Study Prompts ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPTS = {
  study: (lang: string) => `You are StudyMate, an expert academic tutor.
Help students understand concepts deeply, not just memorize.
Use analogies, examples, and step-by-step breakdowns.
When explaining formulas, use LaTeX: $formula$ for inline, $$formula$$ for block.
Use markdown for structure. Keep responses clear and educational.
Respond in ${lang}.`,

  essay: (lang: string) => `You are StudyMate, an expert writing coach.
Help students craft compelling, well-structured essays.
Provide feedback on structure, argument quality, clarity, and style.
Give specific, actionable suggestions. Respond in ${lang}.`,

  code: (lang: string) => `You are StudyMate, an expert coding mentor.
Explain code concepts clearly with working examples.
Always use markdown code blocks with language specified.
Explain the "why" behind code, not just the "how". Respond in ${lang}.`,

  language: (lang: string) => `You are StudyMate, a language learning expert.
Help students learn new languages with vocabulary, grammar, and practice.
Provide pronunciation tips, example sentences, and cultural context.
Use tables for vocabulary when helpful. Respond in ${lang}.`,

  general: (lang: string) => `You are StudyMate, a knowledgeable AI assistant for students.
Be helpful, accurate, and educational. Use markdown for formatting.
Respond in ${lang}.`,

  mcqGenerator: (topic: string, count: number) => `Generate ${count} multiple choice questions about: "${topic}"
Return ONLY valid JSON, no markdown, no preamble:
{"questions":[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}
Rules: correct = index 0-3, all options plausible, vary difficulty.`,

  flashcardGenerator: (text: string) => `Create flashcards from this content:
"${text.slice(0, 3000)}"
Return ONLY valid JSON:
{"cards":[{"front":"term/question","back":"answer","difficulty":"easy"}]}
difficulty must be exactly "easy","medium","hard". Extract 5-15 key concepts.`,

  studyAgent: (topic: string, lang: string) => `You are a Study Agent helping master: "${topic}"
1. Assess knowledge (2-3 questions)
2. Create personalized study plan
3. Teach concepts one at a time using Socratic method
4. Comprehension check after each concept
5. Mini quiz at the end
Use markdown and LaTeX. Respond in ${lang}.`,
};

// ─── RAG Utilities ────────────────────────────────────────────────────────────

export function buildRAGContext(query: string, chunks: string[]): string {
  if (!chunks.length) return '';
  const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const top = chunks
    .map(chunk => ({ chunk, score: qWords.reduce((a, w) => a + (chunk.toLowerCase().includes(w) ? 1 : 0), 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(c => c.score > 0);
  if (!top.length) return '';
  return `\n\n---\nRelevant context from your notes:\n${top.map(c => c.chunk).join('\n\n')}\n---\n`;
}

export function chunkText(text: string, chunkSize = 600): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > chunkSize && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? ' ' : '') + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } else {
      reject(new Error('Only .txt and .md files supported for context upload.'));
    }
  });
}
