import { useState, useCallback } from 'react';
import { Settings, MODELS } from '@/types/chat';
import { storage } from '@/lib/storage';

const defaultSettings: Settings = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  streamResponses: true,
  language: 'English',
  ollamaUrl: 'http://localhost:11434',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    ...storage.getSettings(),
  }));

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
