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
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      // Auto-select first model when provider changes
      if (updates.provider && updates.provider !== prev.provider) {
        next.model = MODELS[updates.provider][0];
        next.apiKey = '';
      }
      storage.saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
