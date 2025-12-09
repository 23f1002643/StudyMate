import { BookOpen, Code, Languages, PenTool, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  { icon: BookOpen, text: 'Explain quantum physics in simple terms', category: 'Study' },
  { icon: PenTool, text: 'Help me write an essay introduction', category: 'Essay' },
  { icon: Code, text: 'How do React hooks work?', category: 'Code' },
  { icon: Languages, text: 'Teach me common Spanish phrases', category: 'Language' },
];

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 animate-fade-in">
      <div className="gradient-primary rounded-3xl p-6 shadow-2xl mb-8">
        <Sparkles className="h-12 w-12 text-white" />
      </div>
      
      <h2 className="font-display text-3xl font-bold text-foreground mb-3">
        Welcome to <span className="gradient-text">StudyMate</span>
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-10">
        Your AI-powered study companion. Ask me anything about your studies, 
        essays, coding, languages, or any topic you're curious about.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex items-start gap-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            <div className="rounded-lg p-2 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <suggestion.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {suggestion.category}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {suggestion.text}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
