import { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Send, Mic, Paperclip, ChevronDown, BookOpen, FileText, Code2, Brain, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROMPT_TEMPLATES = [
  { icon: BookOpen, label: 'Explain concept', prompt: 'Explain this concept step by step with examples: ' },
  { icon: Brain, label: 'Quiz me', prompt: 'Quiz me on this topic with 5 questions: ' },
  { icon: FileText, label: 'Summarize', prompt: 'Summarize the key points of: ' },
  { icon: Code2, label: 'Debug code', prompt: 'Debug and fix this code, explain what was wrong:\n```\n\n```' },
  { icon: Lightbulb, label: 'Study plan', prompt: 'Create a detailed study plan for: ' },
];

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileUpload?: (file: File) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onFileUpload, disabled, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  const handleSend = () => {
    if (!message.trim() || disabled || isLoading) return;
    onSend(message.trim());
    setMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplate = (prompt: string) => {
    setMessage(prompt);
    setShowTemplates(false);
    textareaRef.current?.focus();
    setTimeout(autoResize, 10);
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setMessage(prev => prev + transcript);
      setTimeout(autoResize, 10);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error('Voice input failed'); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success('Listening… speak now');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onFileUpload) onFileUpload(file);
    e.target.value = '';
  };

  const charCount = message.length;
  const isNearLimit = charCount > 3000;

  return (
    <div className="relative border-t border-border bg-background/80 backdrop-blur-sm px-4 pb-4 pt-3">
      {/* Prompt Templates */}
      {showTemplates && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-xl shadow-lg p-2 grid grid-cols-1 gap-1 z-10 animate-slide-up">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
            Quick Templates
          </p>
          {PROMPT_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => handleTemplate(t.prompt)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left transition-colors"
            >
              <div className="h-7 w-7 rounded-lg gradient-brand-soft flex items-center justify-center flex-shrink-0">
                <t.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className={cn(
          'relative flex items-end gap-2 rounded-2xl border-2 bg-card transition-all duration-200',
          isListening ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-900' :
            'border-input focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15'
        )}>
          {/* Template button */}
          <button
            onClick={() => setShowTemplates(s => !s)}
            className="flex-shrink-0 ml-3 mb-3 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            title="Prompt templates"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showTemplates && 'rotate-180')} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => { setMessage(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? '🎙️ Listening…' : 'Ask anything… (Enter to send, Shift+Enter for newline)'}
            className="flex-1 resize-none bg-transparent py-3 pr-2 text-sm outline-none placeholder:text-muted-foreground/50 min-h-[48px] max-h-40 scrollbar-thin"
            rows={1}
            disabled={disabled || isLoading}
          />

          {/* Right actions */}
          <div className="flex items-center gap-1 mr-2 mb-2 flex-shrink-0">
            {isNearLimit && (
              <span className="text-[10px] text-destructive mr-1">{charCount}/4000</span>
            )}
            <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current?.click()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              title="Upload context file (.txt/.md)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={toggleVoice}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isListening
                  ? 'text-red-500 bg-red-50 dark:bg-red-950 animate-pulse'
                  : 'text-muted-foreground hover:text-primary hover:bg-accent'
              )}
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled || isLoading}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
                'gradient-brand text-white shadow-sm',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'enabled:hover:shadow-md enabled:hover:scale-105 enabled:active:scale-95'
              )}
              title="Send (Enter)"
            >
              {isLoading
                ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-2">
          AI can make mistakes — verify important information
        </p>
      </div>
    </div>
  );
}
