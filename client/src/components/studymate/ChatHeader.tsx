import { formatDistanceToNow } from 'date-fns';
import { Download, Share2, Trash2, Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Conversation, Category, categoryLabels } from '@/types/chat';
import { CategoryBadge } from './CategoryBadge';
import { SettingsDialog } from './SettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onDelete: () => void;
  onCategoryChange: (category: Category) => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function ChatHeader({ 
  conversation, 
  onDelete, 
  onCategoryChange,
  onToggleSidebar,
  sidebarCollapsed,
  isDark,
  onToggleTheme,
}: ChatHeaderProps) {
  const handleExport = () => {
    if (!conversation) return;
    
    const content = conversation.messages
      .map(m => `${m.role === 'user' ? 'You' : 'StudyMate'}: ${m.content}`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Conversation exported!');
  };

  const handleShare = () => {
    if (!conversation) return;
    
    const content = conversation.messages
      .map(m => `${m.role === 'user' ? 'You' : 'StudyMate'}: ${m.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold text-foreground">
              {conversation?.title || 'New Conversation'}
            </h1>
            {conversation && <CategoryBadge category={conversation.category} size="md" />}
          </div>
          {conversation && (
            <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={onToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={handleExport}
          disabled={!conversation}
          title="Export conversation"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={handleShare}
          disabled={!conversation}
          title="Copy to clipboard"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={!conversation}
          title="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Change Category"
              disabled={!conversation}
            >
              <CategoryBadge category={conversation?.category || 'general'} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Change Category
            </div>
            {(Object.keys(categoryLabels) as Category[]).map((cat) => (
              <DropdownMenuItem
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className="cursor-pointer"
              >
                {categoryLabels[cat]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsDialog />
      </div>
    </header>
  );
}
