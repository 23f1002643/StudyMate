import { Download, Share2, Trash2, Menu, Moon, Sun, FileText, X, Brain } from 'lucide-react';
import { Conversation, Category, categoryLabels, categoryEmoji, categoryColors, ContextDoc } from '@/types/chat';
import { SettingsDialog } from './SettingsDialog';
import { Settings } from '@/types/chat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: Conversation | null;
  settings: Settings;
  onSettingsUpdate: (u: Partial<Settings>) => void;
  onDelete: () => void;
  onCategoryChange: (category: Category) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onRemoveDoc: (docId: string) => void;
}

export function ChatHeader({
  conversation, settings, onSettingsUpdate,
  onDelete, onCategoryChange, onToggleSidebar, sidebarCollapsed,
  isDark, onToggleTheme, onRemoveDoc,
}: ChatHeaderProps) {

  const handleExport = () => {
    if (!conversation) return;
    const content = conversation.messages
      .filter(m => m.role !== 'system')
      .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  const handleShare = () => {
    if (!conversation) return;
    const content = conversation.messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'You' : 'StudyMate'}: ${m.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const modeLabel = {
    chat: '💬 Chat',
    agent: '🧠 Study Agent',
    mcq: '🎯 Quiz',
    flashcard: '⚡ Flashcards',
  }[conversation?.mode || 'chat'];

  return (
    <header className="flex-shrink-0 flex flex-col border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14 gap-3">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {sidebarCollapsed && (
            <button onClick={onToggleSidebar} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <Menu className="h-4 w-4" />
            </button>
          )}
          {conversation ? (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{categoryEmoji[conversation.category]}</span>
                <h1 className="font-display font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs text-sm">
                  {conversation.title}
                </h1>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                  {modeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={conversation.category}
                  onChange={e => onCategoryChange(e.target.value as Category)}
                  className="text-[10px] text-muted-foreground bg-transparent focus:outline-none cursor-pointer hover:text-foreground transition-colors"
                >
                  {(Object.keys(categoryLabels) as Category[]).map(c => (
                    <option key={c} value={c}>{categoryEmoji[c]} {categoryLabels[c]}</option>
                  ))}
                </select>
                {conversation.totalTokens ? (
                  <span className="text-[10px] text-muted-foreground">· {conversation.totalTokens.toLocaleString()} tokens</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center">
                <span className="text-white text-sm">✦</span>
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">StudyMate</p>
                <p className="text-[10px] text-muted-foreground">AI Learning Assistant</p>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onToggleTheme} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {conversation && (
            <>
              <button onClick={handleExport} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Export">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={handleShare} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy to clipboard">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={onDelete} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <SettingsDialog settings={settings} onUpdate={onSettingsUpdate} />
        </div>
      </div>

      {/* Context docs bar */}
      {conversation?.contextDocs && conversation.contextDocs.length > 0 && (
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Context:</span>
          {conversation.contextDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2 py-0.5 text-[11px] font-medium">
              <FileText className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{doc.name}</span>
              <button onClick={() => onRemoveDoc(doc.id)} className="hover:text-destructive transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
