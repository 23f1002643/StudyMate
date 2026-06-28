import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { Conversation, Mode } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (message: string) => void;
  onNewMode: (mode: Mode) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export function ChatArea({ conversation, onSendMessage, onNewMode, onFileUpload, isLoading }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const visibleMessages = conversation?.messages.filter(m => m.role !== 'system') || [];
  const hasMessages = visibleMessages.length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {hasMessages ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {visibleMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm">✦</span>
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <EmptyState onSuggestionClick={onSendMessage} onNewMode={onNewMode} />
        </div>
      )}

      <ChatInput
        onSend={onSendMessage}
        onFileUpload={onFileUpload}
        isLoading={isLoading}
        disabled={false}
      />
    </div>
  );
}
