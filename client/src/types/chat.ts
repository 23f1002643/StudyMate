export type Category = 'study' | 'essay' | 'code' | 'language' | 'general';
export type Provider = 'openai' | 'anthropic' | 'gemini' | 'local';
export type Mode = 'chat' | 'mcq' | 'flashcard' | 'agent';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  tokens?: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  category: Category;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  mode: Mode;
  contextDocs?: ContextDoc[];
  totalTokens?: number;
}

export interface ContextDoc {
  id: string;
  name: string;
  content: string;
  chunks: string[];
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface MCQSession {
  questions: MCQQuestion[];
  answers: (number | null)[];
  currentIndex: number;
  completed: boolean;
  score?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReview?: Date;
  reviewCount: number;
}

export interface FlashcardSession {
  cards: Flashcard[];
  currentIndex: number;
  flipped: boolean;
  completed: boolean;
  results: ('easy' | 'medium' | 'hard')[];
}

export interface Settings {
  provider: Provider;
  apiKey: string;
  model: string;
  temperature: number;
  streamResponses: boolean;
  language: string;
  ollamaUrl: string;
}

export interface TokenUsage {
  total: number;
  estimatedCostUSD: number;
}

export const categoryLabels: Record<Category, string> = {
  study: 'Study',
  essay: 'Essay',
  code: 'Code',
  language: 'Language',
  general: 'General',
};

export const categoryColors: Record<Category, string> = {
  study: 'bg-emerald-500',
  essay: 'bg-violet-500',
  code: 'bg-blue-500',
  language: 'bg-amber-500',
  general: 'bg-slate-400',
};

export const categoryEmoji: Record<Category, string> = {
  study: '📚',
  essay: '✍️',
  code: '💻',
  language: '🌐',
  general: '💬',
};

// Updated 2025 - latest available models
export const MODELS: Record<Provider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307',
  ],
  // Gemini 2.x models - current as of 2025
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
  ],
  // User can type custom model name too
  local: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'phi3', 'qwen2.5'],
};

export const COST_PER_1K_TOKENS: Record<string, number> = {
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  'gpt-4-turbo': 0.01,
  'gpt-3.5-turbo': 0.0005,
  'claude-opus-4-5': 0.015,
  'claude-sonnet-4-5': 0.003,
  'claude-haiku-4-5': 0.00025,
  'claude-3-5-sonnet-20241022': 0.003,
  'claude-3-haiku-20240307': 0.00025,
  'gemini-2.0-flash': 0.0001,
  'gemini-2.0-flash-lite': 0.000075,
  'gemini-1.5-flash': 0.000075,
  'gemini-1.5-flash-8b': 0.0000375,
  'gemini-1.5-pro': 0.00125,
};
