import { useState, memo } from 'react';
import { format } from 'date-fns';
import { Copy, Check, User, Sparkles } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/markdown';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderedHTML = !isUser ? renderMarkdown(message.content) : null;

  return (
    <div className={cn(
      'group flex gap-3 animate-fade-in',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-sm mt-0.5',
        isUser ? 'gradient-brand' : 'bg-card border border-border'
      )}>
        {isUser
          ? <User className="h-4 w-4" />
          : <Sparkles className="h-4 w-4 text-primary" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'relative max-w-[78%] rounded-2xl px-4 py-3 shadow-sm',
        isUser
          ? 'chat-bubble-user text-white rounded-tr-sm'
          : 'bg-card border border-border rounded-tl-sm'
      )}>
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle rounded-sm" />
        )}

        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className="prose-studymate text-sm text-foreground"
            dangerouslySetInnerHTML={{ __html: renderedHTML || '' }}
          />
        )}

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between gap-2 mt-2 pt-1.5',
          'border-t',
          isUser ? 'border-white/20' : 'border-border'
        )}>
          <span className={cn(
            'text-[10px]',
            isUser ? 'text-white/60' : 'text-muted-foreground'
          )}>
            {format(message.timestamp, 'h:mm a')}
            {message.tokens ? ` · ${message.tokens} tokens` : ''}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-all duration-150 rounded p-0.5',
              isUser
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Copy message"
          >
            {copied
              ? <Check className="h-3 w-3" />
              : <Copy className="h-3 w-3" />
            }
          </button>
        </div>
      </div>
    </div>
  );
});
