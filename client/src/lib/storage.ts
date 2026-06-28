import { Conversation, Settings, TokenUsage, COST_PER_1K_TOKENS } from '@/types/chat';

const KEYS = {
  conversations: 'studymate_v2_conversations',
  settings: 'studymate_v2_settings',
  tokenUsage: 'studymate_v2_tokens',
};

const defaultSettings: Settings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  streamResponses: true,
  language: 'English',
};

export const storage = {
  getConversations(): Conversation[] {
    try {
      const raw = localStorage.getItem(KEYS.conversations);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    } catch { return []; }
  },

  saveConversations(conversations: Conversation[]) {
    try {
      localStorage.setItem(KEYS.conversations, JSON.stringify(conversations));
    } catch (e) {
      console.error('Storage full:', e);
    }
  },

  getSettings(): Settings {
    try {
      const raw = localStorage.getItem(KEYS.settings);
      if (!raw) return defaultSettings;
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch { return defaultSettings; }
  },

  saveSettings(settings: Settings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  },

  getTokenUsage(): TokenUsage {
    try {
      const raw = localStorage.getItem(KEYS.tokenUsage);
      if (!raw) return { total: 0, estimatedCostUSD: 0 };
      return JSON.parse(raw);
    } catch { return { total: 0, estimatedCostUSD: 0 }; }
  },

  addTokens(tokens: number, model: string): TokenUsage {
    const usage = this.getTokenUsage();
    const costPer1k = COST_PER_1K_TOKENS[model] || 0;
    const newUsage: TokenUsage = {
      total: usage.total + tokens,
      estimatedCostUSD: usage.estimatedCostUSD + (tokens / 1000) * costPer1k,
    };
    localStorage.setItem(KEYS.tokenUsage, JSON.stringify(newUsage));
    return newUsage;
  },

  resetTokenUsage() {
    localStorage.setItem(KEYS.tokenUsage, JSON.stringify({ total: 0, estimatedCostUSD: 0 }));
  },
};
