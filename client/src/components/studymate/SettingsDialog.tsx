import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');

  // Load saved settings on open
  useEffect(() => {
    if (open) {
      const savedKey = localStorage.getItem('studymate-api-key') || '';
      const savedProvider = localStorage.getItem('studymate-provider') || 'openai';
      setApiKey(savedKey);
      setProvider(savedProvider);
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('studymate-api-key', apiKey);
    localStorage.setItem('studymate-provider', provider);
    toast.success('Settings saved successfully');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider and other preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <select
                id="provider"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
                <option value="gemini">Google (Gemini Pro)</option>
                <option value="local">Local (Ollama)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder={`Enter your ${provider} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4 py-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="voice-input" className="flex flex-col space-y-1">
                <span>Voice Input</span>
                <span className="font-normal text-xs text-muted-foreground">Enable microphone button in chat</span>
              </Label>
              <Switch id="voice-input" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="text-to-speech" className="flex flex-col space-y-1">
                <span>Text to Speech</span>
                <span className="font-normal text-xs text-muted-foreground">Read AI responses aloud</span>
              </Label>
              <Switch id="text-to-speech" />
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="auto-title" className="flex flex-col space-y-1">
                <span>Auto-generate Titles</span>
                <span className="font-normal text-xs text-muted-foreground">Automatically title new conversations</span>
              </Label>
              <Switch id="auto-title" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="stream-response" className="flex flex-col space-y-1">
                <span>Stream Responses</span>
                <span className="font-normal text-xs text-muted-foreground">Show responses as they are generated</span>
              </Label>
              <Switch id="stream-response" defaultChecked />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} className="gradient-primary text-white">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
