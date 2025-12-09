import { format } from 'date-fns';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-4 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center shadow-md',
          isUser 
            ? 'gradient-primary text-white' 
            : 'bg-secondary text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'group relative max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
          isUser 
            ? 'chat-bubble-user text-white rounded-tr-sm' 
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        <div className={cn(
          'flex items-center gap-2 mt-2 pt-2 border-t',
          isUser ? 'border-white/20' : 'border-border'
        )}>
          <span className={cn(
            'text-[10px]',
            isUser ? 'text-white/70' : 'text-muted-foreground'
          )}>
            {format(message.timestamp, 'h:mm a')}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser 
                ? 'text-white/70 hover:text-white hover:bg-white/10' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
