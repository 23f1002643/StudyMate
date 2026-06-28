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
    throw new Error(`No API key set for ${provider}. Open Settings to add one.`);
  }

  const msgs = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    ...messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  if (provider === 'openai') return callOpenAI(msgs, apiKey, model, temperature, streamResponses, onChunk);
  if (provider === 'anthropic') return callAnthropic(msgs, apiKey, model, temperature, streamResponses, onChunk);
  if (provider === 'gemini') return callGemini(msgs, apiKey, model, temperature, streamResponses, onChunk);
  if (provider === 'local') return callOllama(msgs, model, temperature, streamResponses, onChunk);

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
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
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
  return {
    content: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0,
  };
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
      model, temperature,
      max_tokens: 4096,
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
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data?.delta?.text;
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
  _stream: boolean, onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const system = messages.find(m => m.role === 'system')?.content;
  const convMsgs = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const body: any = {
    contents: convMsgs,
    generationConfig: { temperature, maxOutputTokens: 4096 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (onChunk) onChunk(content);
  return { content, tokens: data.usageMetadata?.totalTokenCount || Math.ceil(content.length / 4) };
}

// ─── Local / Ollama ──────────────────────────────────────────────────────────

async function callOllama(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string, temperature: number,
  stream: boolean, onChunk?: (t: string) => void,
): Promise<{ content: string; tokens: number }> {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream, options: { temperature } }),
  });

  if (!res.ok) throw new Error('Ollama not running. Start with: ollama serve');

  if (stream && onChunk) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
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

// ─── Specialized Prompts ─────────────────────────────────────────────────────

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

Return ONLY valid JSON in this exact format:
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
- All options should be plausible
- Explanations should be educational
- Vary difficulty: mix easy, medium, hard
- No markdown, ONLY JSON`,

  flashcardGenerator: (text: string) => `Create flashcards from this content:

"${text}"

Return ONLY valid JSON:
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
- difficulty: "easy", "medium", or "hard"
- front should be a clear question or key term
- back should be a concise, accurate answer
- Extract the most important concepts
- No markdown, ONLY JSON`,

  studyAgent: (topic: string, lang: string) => `You are a Study Agent helping a student master: "${topic}"

Follow this structured approach:
1. First, assess what they already know by asking 2-3 targeted questions
2. Create a personalized study plan based on their response
3. Teach concepts one at a time, starting from their knowledge level
4. After each concept, ask a quick comprehension check
5. Track weak areas and revisit them
6. After covering all material, run a mini quiz

Always be encouraging. Use the Socratic method — guide them to discover answers.
Use markdown and LaTeX where appropriate.
Respond in ${lang}.`,
};

// ─── RAG: Simple context injection ───────────────────────────────────────────

export function buildRAGContext(query: string, chunks: string[]): string {
  if (!chunks.length) return '';
  
  // Simple keyword scoring (no embeddings needed)
  const queryWords = query.toLowerCase().split(/\s+/);
  const scored = chunks.map(chunk => {
    const score = queryWords.reduce((acc, word) => 
      acc + (chunk.toLowerCase().includes(word) ? 1 : 0), 0);
    return { chunk, score };
  });
  
  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(c => c.score > 0)
    .map(c => c.chunk);

  if (!topChunks.length) return '';
  
  return `\n\nRelevant context from uploaded documents:\n---\n${topChunks.join('\n\n')}\n---\n`;
}

// ─── PDF/Text to chunks ───────────────────────────────────────────────────────

export function chunkText(text: string, chunkSize = 500): string[] {
  const sentences = text.split(/[.!?]+\s+/);
  const chunks: string[] = [];
  let current = '';
  
  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? '. ' : '') + sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.filter(c => c.length > 50);
}

export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      reject(new Error('Only .txt and .md files supported for context. PDF support coming soon.'));
    }
  });
}
