import { Message, Settings, MCQQuestion, Flashcard } from '@/types/chat';

// ─── Core LLM Call with streaming ────────────────────────────────────────────

export async function callLLM(
  messages: Message[],
  settings: Settings,
  systemPrompt?: string,
  onChunk?: (text: string) => void,
): Promise<{ content: string; tokens: number }> {
  const { provider, apiKey, model, temperature, streamResponses } = settings;

  if (!apiKey && provider !== 'local') {
    throw new Error(`No API key set for ${provider}. Open Settings ⚙️ to add one.`);
  }

  const msgs = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  if (provider === 'openai')    return callOpenAI(msgs, apiKey, model, temperature, streamResponses, onChunk);
  if (provider === 'anthropic') return callAnthropic(msgs, apiKey, model, temperature, streamResponses, onChunk);
  if (provider === 'gemini')    return callGemini(msgs, apiKey, model, temperature, onChunk);
  if (provider === 'local')     return callOllama(msgs, model, temperature, streamResponses, onChunk, settings.ollamaUrl);

  throw new Error('Unknown provider');
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
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
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
// Uses v1beta which supports all current models including gemini-2.0-*

async function callGemini(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string, model: string, temperature: number,
  onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const system = messages.find(m => m.role === 'system')?.content;

  // Gemini requires alternating user/model turns — merge consecutive same-role messages
  const rawMsgs = messages.filter(m => m.role !== 'system');
  const convMsgs: { role: string; parts: { text: string }[] }[] = [];
  for (const m of rawMsgs) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (convMsgs.length > 0 && convMsgs[convMsgs.length - 1].role === role) {
      // Merge with previous same-role message
      convMsgs[convMsgs.length - 1].parts[0].text += '\n' + m.content;
    } else {
      convMsgs.push({ role, parts: [{ text: m.content }] });
    }
  }

  // Must start with user turn
  if (convMsgs.length === 0 || convMsgs[0].role !== 'user') {
    convMsgs.unshift({ role: 'user', parts: [{ text: '.' }] });
  }

  const body: Record<string, unknown> = {
    contents: convMsgs,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  // Use streaming endpoint for gemini
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  // Parse SSE stream
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            full += text;
            if (onChunk) onChunk(text);
          }
          totalTokens = data?.usageMetadata?.totalTokenCount || totalTokens;
        } catch {}
      }
    }
  }

  return { content: full, tokens: totalTokens || Math.ceil(full.length / 4) };
}

// ─── Local / Ollama ──────────────────────────────────────────────────────────

async function callOllama(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string, temperature: number,
  stream: boolean, onChunk?: (t: string) => void,
  ollamaUrl = 'http://localhost:11434',
): Promise<{ content: string; tokens: number }> {
  const baseUrl = ollamaUrl.replace(/\/$/, '');

  // First check if Ollama is reachable
  try {
    await fetch(`${baseUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(3000) });
  } catch {
    throw new Error(
      `Cannot reach Ollama at ${baseUrl}.\n\n` +
      `Make sure:\n` +
      `1. Ollama is installed and running: ollama serve\n` +
      `2. CORS is enabled: OLLAMA_ORIGINS="*" ollama serve\n` +
      `3. URL is correct in Settings (default: http://localhost:11434)`
    );
  }

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream, options: { temperature } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (text.includes('model') && text.includes('not found')) {
      throw new Error(`Model "${model}" not found in Ollama. Run: ollama pull ${model}`);
    }
    throw new Error(`Ollama error ${res.status}: ${text}`);
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

// ─── Specialized Study Prompts ────────────────────────────────────────────────

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
Explain the "why" behind code, not just the "how".
Respond in ${lang}.`,

  language: (lang: string) => `You are StudyMate, a language learning expert.
Help students learn new languages with vocabulary, grammar, and practice.
Provide pronunciation tips, example sentences, and cultural context.
Use tables for vocabulary when helpful. Respond in ${lang}.`,

  general: (lang: string) => `You are StudyMate, a knowledgeable AI assistant for students.
Be helpful, accurate, and educational. Use markdown for formatting.
Respond in ${lang}.`,

  mcqGenerator: (topic: string, count: number) => `Generate ${count} multiple choice questions about: "${topic}"

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Rules:
- correct is the index (0-3) of the right answer
- All options should be plausible but only one correct
- Explanations should be educational
- Vary difficulty across questions`,

  flashcardGenerator: (text: string) => `Create flashcards from this content:

"${text.slice(0, 3000)}"

Return ONLY valid JSON, no markdown, no explanation:
{
  "cards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "difficulty": "easy"
    }
  ]
}

Rules:
- difficulty must be exactly "easy", "medium", or "hard"
- front: clear question or key term
- back: concise, accurate answer
- Extract 5-15 most important concepts`,

  studyAgent: (topic: string, lang: string) => `You are a Study Agent helping a student master: "${topic}"

Structured approach:
1. First assess what they know (ask 2-3 targeted questions)
2. Create a personalized study plan based on their response
3. Teach concepts one at a time, from their level
4. After each concept, ask a comprehension check
5. Track weak areas and revisit them
6. End with a mini quiz

Use the Socratic method. Use markdown and LaTeX where appropriate.
Respond in ${lang}.`,
};

// ─── RAG Utilities ────────────────────────────────────────────────────────────

export function buildRAGContext(query: string, chunks: string[]): string {
  if (!chunks.length) return '';
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const scored = chunks.map(chunk => ({
    chunk,
    score: queryWords.reduce((acc, word) =>
      acc + (chunk.toLowerCase().includes(word) ? 1 : 0), 0),
  }));
  const top = scored.sort((a, b) => b.score - a.score).slice(0, 3).filter(c => c.score > 0);
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
      reject(new Error('Only .txt and .md files are supported for context upload.'));
    }
  });
}
