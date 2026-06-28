import { MessageSquare, Brain, Target, Zap, BookOpen, Code2, PenTool, Languages } from 'lucide-react';
import { Mode } from '@/types/chat';

const SUGGESTIONS = [
  { icon: BookOpen, text: 'Explain the water cycle step by step', mode: 'chat' as Mode },
  { icon: Code2, text: 'Debug my JavaScript async/await code', mode: 'chat' as Mode },
  { icon: PenTool, text: 'Help me write a compelling essay intro', mode: 'chat' as Mode },
  { icon: Languages, text: 'Teach me 10 essential Japanese phrases', mode: 'chat' as Mode },
];

const MODES = [
  { mode: 'chat' as Mode, icon: MessageSquare, title: 'Smart Chat', desc: 'Ask anything, get clear explanations', gradient: 'from-violet-500 to-blue-500' },
  { mode: 'agent' as Mode, icon: Brain, title: 'Study Agent', desc: 'Guided learning with Socratic method', gradient: 'from-pink-500 to-violet-500' },
  { mode: 'mcq' as Mode, icon: Target, title: 'Quiz Mode', desc: 'Test yourself with AI questions', gradient: 'from-amber-500 to-orange-500' },
  { mode: 'flashcard' as Mode, icon: Zap, title: 'Flashcards', desc: 'Spaced repetition for memory', gradient: 'from-emerald-500 to-teal-500' },
];

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
  onNewMode: (mode: Mode) => void;
}

export function EmptyState({ onSuggestionClick, onNewMode }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-10 animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl gradient-brand items-center justify-center shadow-lg mb-4">
            <span className="text-white text-3xl">✦</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome to <span className="gradient-text">StudyMate</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your AI learning assistant. Chat with AI, generate quizzes, create flashcards, or start a guided study session.
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {MODES.map(({ mode, icon: Icon, title, desc, gradient }) => (
            <button
              key={mode}
              onClick={() => onNewMode(mode)}
              className="group relative overflow-hidden rounded-2xl border-2 border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className={`absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="font-display font-semibold text-foreground text-sm">{title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        {/* Quick suggestions */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Try asking…</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s.text)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-left hover:border-primary/40 hover:bg-accent transition-all duration-150 group"
              >
                <div className="h-8 w-8 rounded-lg gradient-brand-soft flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">{s.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
