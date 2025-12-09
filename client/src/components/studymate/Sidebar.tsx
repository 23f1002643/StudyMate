import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from './Logo';
import { ConversationItem } from './ConversationItem';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-80'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b border-sidebar-border',
        collapsed && 'justify-center'
      )}>
        <Logo collapsed={collapsed} />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New Conversation Button */}
      <div className={cn('p-3', collapsed && 'px-3')}>
        <Button
          onClick={onNewConversation}
          className={cn(
            'gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]',
            collapsed ? 'w-12 h-12 p-0' : 'w-full'
          )}
        >
          <Plus className="h-5 w-5" />
          {!collapsed && <span className="ml-2">New Conversation</span>}
        </Button>
      </div>

      {/* Conversations List */}
      {!collapsed && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Recent Conversations
          </h3>
        </div>
      )}

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {conversations.map((conversation) => (
            collapsed ? (
              <div
                key={conversation.id}
                className={cn(
                  'flex items-center justify-center rounded-lg p-3 cursor-pointer transition-all duration-200',
                  conversation.id === activeConversationId
                    ? 'bg-primary/10'
                    : 'hover:bg-secondary/80'
                )}
                onClick={() => onSelectConversation(conversation.id)}
                title={conversation.title}
              >
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  conversation.id === activeConversationId ? 'bg-primary' : 'bg-muted-foreground/30'
                )} />
              </div>
            ) : (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
              />
            )
          ))}
        </div>
      </ScrollArea>

      {/* Collapse Button (when collapsed) */}
      {collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10"
            onClick={onToggleCollapse}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
