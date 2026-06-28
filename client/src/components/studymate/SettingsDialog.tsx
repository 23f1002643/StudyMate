import { useState } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Sliders, Globe, RotateCcw, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Provider, MODELS } from '@/types/chat';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVIDERS: { id: Provider; name: string; color: string }[] = [
  { id: 'openai', name: 'OpenAI', color: 'text-emerald-600' },
  { id: 'anthropic', name: 'Anthropic', color: 'text-violet-600' },
  { id: 'gemini', name: 'Gemini', color: 'text-blue-600' },
  { id: 'local', name: 'Local (Ollama)', color: 'text-amber-600' },
];

const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];

interface SettingsDialogProps {
  settings: Settings;
  onUpdate: (updates: Partial<Settings>) => void;
}

export function SettingsDialog({ settings, onUpdate }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<Settings>(settings);
  const [showKey, setShowKey] = useState(false);
  const usage = storage.getTokenUsage();

  const handleSave = () => {
    onUpdate(local);
    toast.success('Settings saved!');
    setOpen(false);
  };

  const handleOpen = (o: boolean) => {
    if (o) setLocal(settings);
    setOpen(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Settings">
          <SettingsIcon className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-display text-xl">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Provider */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
              <Cpu className="h-4 w-4 text-primary" /> AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setLocal(l => ({ ...l, provider: p.id, model: MODELS[p.id][0], apiKey: '' }))}
                  className={cn(
                    'rounded-xl border-2 p-3 text-sm font-medium transition-all text-left',
                    local.provider === p.id
                      ? 'border-primary gradient-brand-soft'
                      : 'border-border hover:border-primary/30 hover:bg-muted'
                  )}
                >
                  <span className={p.color}>{p.name}</span>
                  {local.provider === p.id && <span className="ml-1 text-[10px] text-primary">✓</span>}
                </button>
              ))}
            </div>
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

          {/* API Key */}
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
                  placeholder={`Enter your ${local.provider} API key`}
                  className="w-full rounded-xl border-2 border-input bg-card px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors pr-16"
                />
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                🔒 Stored locally in your browser. Never sent to our servers.
              </p>
            </div>
          )}

          {/* Temperature */}
          <div>
            <label className="text-sm font-semibold text-foreground flex items-center justify-between mb-2">
              <span>Creativity</span>
              <span className="text-primary font-bold">{local.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={local.temperature}
              onChange={e => setLocal(l => ({ ...l, temperature: +e.target.value }))}
              className="w-full accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Precise</span><span>Creative</span>
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
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Stream toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Stream Responses</p>
              <p className="text-[10px] text-muted-foreground">Show text as it's generated</p>
            </div>
            <button
              onClick={() => setLocal(l => ({ ...l, streamResponses: !l.streamResponses }))}
              className={cn('relative h-6 w-11 rounded-full transition-colors', local.streamResponses ? 'gradient-brand' : 'bg-muted')}
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', local.streamResponses ? 'left-5.5' : 'left-0.5')} />
            </button>
          </div>

          {/* Token Usage */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" /> Usage This Session
              </p>
              <button
                onClick={() => { storage.resetTokenUsage(); toast.success('Usage reset'); }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Tokens used</p>
                <p className="font-bold font-display">{usage.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Est. cost</p>
                <p className="font-bold font-display text-emerald-600">${usage.estimatedCostUSD.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 gradient-brand text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
