import { useState } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Sliders, Globe, DollarSign, Server, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Provider, MODELS } from '@/types/chat';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDERS: { id: Provider; name: string; color: string; hint: string }[] = [
  { id: 'openai',    name: 'OpenAI',        color: 'text-emerald-600', hint: 'platform.openai.com/api-keys' },
  { id: 'anthropic', name: 'Anthropic',      color: 'text-violet-600',  hint: 'console.anthropic.com/keys' },
  { id: 'gemini',    name: 'Google Gemini',  color: 'text-blue-600',    hint: 'aistudio.google.com/apikey' },
  { id: 'local',     name: 'Local (Ollama)', color: 'text-amber-600',   hint: 'Run: OLLAMA_ORIGINS="*" ollama serve' },
];

const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];

interface SettingsDialogProps {
  settings: Settings;
  onUpdate: (updates: Partial<Settings>) => void;
}

export function SettingsDialog({ settings, onUpdate }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  // local state — only committed on Save
  const [local, setLocal] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const usage = storage.getTokenUsage();

  // Sync local state when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setLocal({ ...settings }); // fresh copy from saved settings
      setShowKey(false);
    }
    setOpen(o);
  };

  const handleProviderChange = (p: Provider) => {
    // Keep existing apiKey if same provider, clear if switching
    setLocal(prev => ({
      ...prev,
      provider: p,
      model: MODELS[p][0],
      // Don't clear apiKey — user may switch back
    }));
  };

  const handleSave = () => {
    if (local.provider !== 'local' && !local.apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }
    onUpdate({ ...local });
    toast.success('Settings saved!');
    setOpen(false);
  };

  const selectedProvider = PROVIDERS.find(p => p.id === local.provider)!;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-xl">Settings</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            API keys stored locally in your browser only
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">

          {/* Provider selection */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
              <Cpu className="h-4 w-4 text-primary" /> AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-sm font-medium transition-all text-left',
                    local.provider === p.id
                      ? 'border-primary gradient-brand-soft'
                      : 'border-border hover:border-primary/30 hover:bg-muted'
                  )}
                >
                  <span className={p.color}>{p.name}</span>
                  {local.provider === p.id && (
                    <span className="ml-1.5 text-[10px] text-primary font-bold">✓ Active</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">
              💡 {selectedProvider.hint}
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
              <Sliders className="h-4 w-4 text-primary" /> Model
            </label>
            <select
              value={local.model}
              onChange={e => setLocal(l => ({ ...l, model: e.target.value }))}
              className="w-full rounded-xl border-2 border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              {MODELS[local.provider].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* API Key — shown for all cloud providers */}
          {local.provider !== 'local' && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                <Key className="h-4 w-4 text-primary" /> API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={local.apiKey}
                  onChange={e => setLocal(l => ({ ...l, apiKey: e.target.value }))}
                  placeholder={`Paste your ${selectedProvider.name} API key…`}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border-2 border-input bg-card px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors pr-20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {local.apiKey && (
                <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1">
                  ✓ Key entered ({local.apiKey.slice(0, 6)}…{local.apiKey.slice(-4)})
                </p>
              )}
              {!local.apiKey && (
                <p className="text-[10px] text-amber-600 mt-1.5">
                  ⚠️ No key set — AI calls will fail
                </p>
              )}
            </div>
          )}

          {/* Ollama URL — shown for local provider */}
          {local.provider === 'local' && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                <Server className="h-4 w-4 text-primary" /> Ollama Server URL
              </label>
              <input
                type="text"
                value={local.ollamaUrl || 'http://localhost:11434'}
                onChange={e => setLocal(l => ({ ...l, ollamaUrl: e.target.value }))}
                placeholder="http://localhost:11434"
                className="w-full rounded-xl border-2 border-input bg-card px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
              />
              <div className="mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-[11px] space-y-1">
                <p className="font-semibold text-amber-800 dark:text-amber-400">Setup for browser access:</p>
                <code className="block bg-black/10 dark:bg-white/10 rounded px-2 py-1 font-mono">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
                <p className="text-amber-700 dark:text-amber-500">
                  Then pull a model: <code className="font-mono">ollama pull llama3.2</code>
                </p>
              </div>
            </div>
          )}

          {/* Temperature */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center justify-between mb-2">
              <span>Creativity / Temperature</span>
              <span className="text-primary font-bold font-mono">{local.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={local.temperature}
              onChange={e => setLocal(l => ({ ...l, temperature: +e.target.value }))}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>0.0 — Precise & focused</span>
              <span>1.0 — Creative & varied</span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
              <Globe className="h-4 w-4 text-primary" /> Response Language
            </label>
            <select
              value={local.language}
              onChange={e => setLocal(l => ({ ...l, language: e.target.value }))}
              className="w-full rounded-xl border-2 border-input bg-card px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            >
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          {/* Streaming toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Stream Responses</p>
              <p className="text-[11px] text-muted-foreground">Show text as it generates (real-time)</p>
            </div>
            <button
              onClick={() => setLocal(l => ({ ...l, streamResponses: !l.streamResponses }))}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors flex-shrink-0',
                local.streamResponses ? 'gradient-brand' : 'bg-muted border border-border'
              )}
            >
              <span className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
                local.streamResponses ? 'left-[22px]' : 'left-[2px]'
              )} />
            </button>
          </div>

          {/* Token usage */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" /> Usage Tracker
              </p>
              <button
                onClick={() => { storage.resetTokenUsage(); toast.success('Usage reset'); }}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tokens used</p>
                <p className="font-bold font-display text-lg mt-0.5">{usage.total.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. cost</p>
                <p className="font-bold font-display text-lg text-emerald-600 mt-0.5">
                  ${usage.estimatedCostUSD.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 bg-muted/20">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 gradient-brand text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
