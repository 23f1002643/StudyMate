import { useState, KeyboardEvent } from 'react';
import { Send, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      toast.info('Voice input stopped');
    } else {
      setIsListening(true);
      toast.success('Voice input active (Simulated)');
      // Simulate voice input for prototype
      setTimeout(() => {
        setMessage(prev => prev + (prev ? ' ' : '') + "This is simulated voice input text.");
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask StudyMate anything..."}
            className={cn(
              'flex w-full min-h-[52px] max-h-32 resize-none rounded-xl border-2 border-input bg-transparent px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 pr-12 transition-colors',
              isListening && 'border-primary ring-2 ring-primary/20'
            )}
            disabled={disabled}
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary/50 animate-pulse-soft" />
          </div>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleVoice}
          className={cn(
            'h-[52px] w-[52px] rounded-xl border-2 hover:bg-secondary transition-all duration-200',
            isListening && 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100 animate-pulse'
          )}
          title="Voice Input"
        >
          <Mic className={cn("h-5 w-5", isListening && "fill-current")} />
        </Button>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'h-[52px] w-[52px] rounded-xl gradient-primary shadow-lg',
            'hover:shadow-xl transition-all duration-200 hover:scale-105',
            'disabled:opacity-50 disabled:hover:scale-100'
          )}
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      <p className="text-center text-[10px] text-muted-foreground mt-3">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
