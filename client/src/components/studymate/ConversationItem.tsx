import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { CategoryBadge } from './CategoryBadge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-all duration-200',
        isActive 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-secondary/80 border border-transparent'
      )}
      onClick={onClick}
    >
      <div className={cn(
        'flex-shrink-0 rounded-lg p-2',
        isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
      )}>
        <MessageSquare className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <p className={cn(
          'text-sm font-medium truncate',
          isActive ? 'text-primary' : 'text-foreground'
        )}>
          {conversation.title}
        </p>
        <div className="flex items-center gap-2">
          <CategoryBadge category={conversation.category} />
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
