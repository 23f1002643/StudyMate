import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { Conversation } from '@/types/chat';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (message: string) => void;
}

export function ChatArea({ conversation, onSendMessage }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const hasMessages = conversation && conversation.messages.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {hasMessages ? (
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            {conversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 overflow-auto">
          <EmptyState onSuggestionClick={onSendMessage} />
        </div>
      )}
      
      <div className="flex-shrink-0">
        <ChatInput onSend={onSendMessage} />
      </div>
    </div>
  );
}
