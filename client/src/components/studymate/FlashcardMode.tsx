import { useState } from 'react';
import { RotateCcw, Loader2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { FlashcardSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface FlashcardModeProps {
  session: FlashcardSession | null;
  onFlip: () => void;
  onRate: (d: 'easy' | 'medium' | 'hard') => void;
  onReset: () => void;
  onGenerate: (text: string) => void;
  loading: boolean;
}

export function FlashcardMode({ session, onFlip, onRate, onReset, onGenerate, loading }: FlashcardModeProps) {
  const [inputText, setInputText] = useState('');

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
        <div className="w-full max-w-md">
          <div className="gradient-brand rounded-2xl p-6 text-white mb-6 text-center">
            <Zap className="h-10 w-10 mx-auto mb-2" />
            <h2 className="font-display text-2xl font-bold">Flashcards</h2>
            <p className="text-white/80 text-sm mt-1">Paste your notes, get instant flashcards</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Paste your notes or topic</label>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Paste your study material, notes, or describe a topic…"
                className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none h-32"
              />
            </div>
            <button
              onClick={() => inputText.trim() && onGenerate(inputText)}
              disabled={!inputText.trim() || loading}
              className="w-full gradient-brand text-white rounded-xl py-3 font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : '⚡ Create Flashcards'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.completed) {
    const easy = session.results.filter(r => r === 'easy').length;
    const medium = session.results.filter(r => r === 'medium').length;
    const hard = session.results.filter(r => r === 'hard').length;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-scale-in">
        <div className="w-full max-w-sm text-center">
          <div className="gradient-brand text-white rounded-2xl p-8 mb-6">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="font-display text-2xl font-bold">Session Complete!</h2>
            <p className="text-white/80 text-sm mt-1">{session.cards.length} cards reviewed</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[['😊', easy, 'Easy', 'text-emerald-600'], ['🤔', medium, 'Medium', 'text-amber-600'], ['😤', hard, 'Hard', 'text-red-500']].map(([emoji, count, label, color]) => (
              <div key={label as string} className="bg-card border border-border rounded-xl p-4">
                <div className="text-2xl mb-1">{emoji}</div>
                <div className={cn('text-2xl font-bold font-display', color as string)}>{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          <button onClick={onReset} className="w-full gradient-brand text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" /> New Session
          </button>
        </div>
      </div>
    );
  }

  const card = session.cards[session.currentIndex];
  const progress = (session.currentIndex / session.cards.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Card {session.currentIndex + 1} of {session.cards.length}</span>
          <span className={cn('font-medium', card.difficulty === 'easy' ? 'text-emerald-600' : card.difficulty === 'medium' ? 'text-amber-600' : 'text-red-500')}>
            {card.difficulty}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Card */}
        <div
          onClick={onFlip}
          className={cn(
            'relative bg-card border-2 border-border rounded-2xl p-8 mb-6 cursor-pointer shadow-sm',
            'hover:border-primary/40 hover:shadow-md transition-all duration-300 min-h-[200px]',
            'flex flex-col items-center justify-center text-center select-none',
          )}
        >
          {!session.flipped ? (
            <>
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">Question</div>
              <p className="font-display text-xl font-semibold leading-relaxed">{card.front}</p>
              <p className="text-xs text-muted-foreground mt-6">Tap to reveal answer</p>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-4">Answer</div>
              <p className="text-base leading-relaxed">{card.back}</p>
              <div className="mt-6 text-xs text-muted-foreground">How well did you know this?</div>
            </>
          )}
        </div>

        {/* Rate buttons - only show after flip */}
        {session.flipped && (
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {([['😤', 'hard', 'Hard', 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800'],
               ['🤔', 'medium', 'Medium', 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:border-amber-800'],
               ['😊', 'easy', 'Easy', 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800'],
            ] as const).map(([emoji, diff, label, cls]) => (
              <button
                key={diff}
                onClick={() => onRate(diff)}
                className={cn('rounded-xl border-2 py-3 font-semibold text-sm transition-all hover:scale-105', cls)}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        )}

        {!session.flipped && (
          <button
            onClick={onFlip}
            className="w-full gradient-brand text-white rounded-xl py-3 font-semibold text-sm transition-all hover:opacity-90"
          >
            Reveal Answer
          </button>
        )}
      </div>
    </div>
  );
}
