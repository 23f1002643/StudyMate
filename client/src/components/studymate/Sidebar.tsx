import { Plus, ChevronLeft, ChevronRight, MessageSquare, Target, Zap, Brain, Trash2, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation, Mode, categoryEmoji } from '@/types/chat';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const MODE_OPTIONS: { mode: Mode; icon: typeof MessageSquare; label: string; desc: string }[] = [
  { mode: 'chat', icon: MessageSquare, label: 'Chat', desc: 'Ask anything' },
  { mode: 'agent', icon: Brain, label: 'Study Agent', desc: 'Guided learning' },
  { mode: 'mcq', icon: Target, label: 'Quiz', desc: 'Test yourself' },
  { mode: 'flashcard', icon: Zap, label: 'Flashcards', desc: 'Spaced review' },
];

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (mode: Mode) => void;
  onDeleteConversation: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  conversations, activeConversationId,
  onSelectConversation, onNewConversation, onDeleteConversation,
  collapsed, onToggleCollapse,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [showModeMenu, setShowModeMenu] = useState(false);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {
    today: filtered.filter(c => {
      const d = new Date(c.updatedAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }),
    older: filtered.filter(c => {
      const d = new Date(c.updatedAt);
      const now = new Date();
      return d.toDateString() !== now.toDateString();
    }),
  };

  return (
    <aside className={cn(
      'relative flex flex-col h-full border-r border-sidebar-border transition-all duration-300 ease-in-out',
      'bg-[hsl(var(--sidebar-bg))]',
      collapsed ? 'w-[64px]' : 'w-72'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center p-4 border-b border-sidebar-border gap-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-base">✦</span>
            </div>
            <div>
              <span className="font-display font-bold text-foreground text-base">StudyMate</span>
              <span className="text-[10px] text-muted-foreground block -mt-0.5">AI Learning Assistant</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shadow-sm">
            <span className="text-white text-base">✦</span>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Conversation */}
      <div className={cn('p-3 relative', collapsed && 'px-2')}>
        {collapsed ? (
          <button
            onClick={() => onNewConversation('chat')}
            className="w-full h-10 flex items-center justify-center rounded-xl gradient-brand text-white shadow-sm hover:opacity-90 transition-opacity"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowModeMenu(s => !s)}
              className="w-full flex items-center justify-between gap-2 gradient-brand text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity"
            >
              <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Session</span>
              <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', showModeMenu && 'rotate-90')} />
            </button>
            {showModeMenu && (
              <div className="mt-2 rounded-xl border border-border bg-card shadow-md overflow-hidden animate-scale-in z-10">
                {MODE_OPTIONS.map(({ mode, icon: Icon, label, desc }) => (
                  <button
                    key={mode}
                    onClick={() => { onNewConversation(mode); setShowModeMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors border-b border-border last:border-0"
                  >
                    <div className="h-8 w-8 rounded-lg gradient-brand-soft flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-muted/40 focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      )}

      {/* Conversations */}
      <ScrollArea className="flex-1 px-2">
        <div className="pb-4 space-y-4">
          {!collapsed && grouped.today.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Today</p>
              {grouped.today.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConversationId} onSelect={() => onSelectConversation(c.id)} onDelete={() => onDeleteConversation(c.id)} />)}
            </div>
          )}
          {!collapsed && grouped.older.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Earlier</p>
              {grouped.older.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConversationId} onSelect={() => onSelectConversation(c.id)} onDelete={() => onDeleteConversation(c.id)} />)}
            </div>
          )}
          {collapsed && conversations.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              title={c.title}
              className={cn(
                'w-full h-10 flex items-center justify-center rounded-xl transition-all',
                c.id === activeConversationId ? 'gradient-brand-soft border border-primary/30' : 'hover:bg-muted'
              )}
            >
              <span className="text-base">{categoryEmoji[c.category]}</span>
            </button>
          ))}
          {!collapsed && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              {search ? 'No results found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-sidebar-border">
          <button onClick={onToggleCollapse} className="w-full h-10 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}

function ConvItem({ conv, active, onSelect, onDelete }: { conv: Conversation; active: boolean; onSelect: () => void; onDelete: () => void }) {
  const modeIcon = { chat: '💬', agent: '🧠', mcq: '🎯', flashcard: '⚡' }[conv.mode] || '💬';
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150 text-left',
        active ? 'gradient-brand-soft border border-primary/30 shadow-sm' : 'hover:bg-muted'
      )}
      onClick={onSelect}
    >
      <span className="text-sm flex-shrink-0">{modeIcon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', active ? 'text-foreground' : 'text-foreground/80')}>{conv.title}</p>
        <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(conv.updatedAt, { addSuffix: true })}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
