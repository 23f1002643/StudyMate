import { useState } from 'react';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { MCQSession, MCQQuestion } from '@/types/chat';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/markdown';

interface MCQModeProps {
  session: MCQSession | null;
  onAnswer: (index: number) => void;
  onReset: () => void;
  onGenerate: (topic: string, count: number) => void;
  loading: boolean;
}

export function MCQMode({ session, onAnswer, onReset, onGenerate, loading }: MCQModeProps) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [answered, setAnswered] = useState<number | null>(null);

  const handleAnswer = (i: number) => {
    if (answered !== null) return;
    setAnswered(i);
    setTimeout(() => {
      onAnswer(i);
      setAnswered(null);
    }, 1200);
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
        <div className="w-full max-w-md">
          <div className="gradient-brand rounded-2xl p-6 text-white mb-6 text-center">
            <Trophy className="h-10 w-10 mx-auto mb-2" />
            <h2 className="font-display text-2xl font-bold">MCQ Practice</h2>
            <p className="text-white/80 text-sm mt-1">Test your knowledge with AI-generated questions</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Topic</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Thermodynamics, React Hooks, World War 2…"
                className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                onKeyDown={e => e.key === 'Enter' && topic.trim() && onGenerate(topic, count)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Questions: <span className="text-primary font-bold">{count}</span>
              </label>
              <input
                type="range" min="3" max="15" value={count}
                onChange={e => setCount(+e.target.value)}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>3</span><span>15</span>
              </div>
            </div>
            <button
              onClick={() => topic.trim() && onGenerate(topic, count)}
              disabled={!topic.trim() || loading}
              className="w-full gradient-brand text-white rounded-xl py-3 font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : '🎯 Generate Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.completed) {
    const pct = Math.round((session.score! / session.questions.length) * 100);
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : '📚 Keep studying!';
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-scale-in">
        <div className="w-full max-w-md text-center">
          <div className={cn('rounded-2xl p-8 mb-6', pct >= 80 ? 'gradient-brand text-white' : 'bg-card border border-border')}>
            <div className="text-6xl font-display font-bold">{pct}%</div>
            <div className="text-xl font-semibold mt-1">{grade}</div>
            <div className="text-sm opacity-80 mt-1">
              {session.score}/{session.questions.length} correct
            </div>
          </div>
          {/* Review */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto scrollbar-thin text-left">
            {session.questions.map((q, i) => {
              const userAns = session.answers[i];
              const correct = userAns === q.correct;
              return (
                <div key={i} className={cn('rounded-xl p-3 border text-sm', correct ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800' : 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800')}>
                  <div className="flex gap-2 items-start mb-1">
                    {correct ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <p className="font-medium">{q.question}</p>
                  </div>
                  {!correct && <p className="text-xs ml-6 text-muted-foreground">Correct: {q.options[q.correct]}</p>}
                  <p className="text-xs ml-6 text-muted-foreground mt-0.5">{q.explanation}</p>
                </div>
              );
            })}
          </div>
          <button onClick={onReset} className="w-full gradient-brand text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" /> Try Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const q = session.questions[session.currentIndex];
  const progress = ((session.currentIndex) / session.questions.length) * 100;

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in">
      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Question {session.currentIndex + 1} of {session.questions.length}</span>
          <span>{session.answers.filter(a => a !== null).length} answered</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Question */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-sm">
          <p className="font-display font-semibold text-lg leading-relaxed">{q.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let state: 'default' | 'correct' | 'wrong' = 'default';
            if (answered !== null) {
              if (i === q.correct) state = 'correct';
              else if (i === answered && answered !== q.correct) state = 'wrong';
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answered !== null}
                className={cn(
                  'w-full text-left rounded-xl border-2 px-5 py-3.5 text-sm font-medium transition-all duration-200',
                  state === 'default' && 'border-border bg-card hover:border-primary/50 hover:bg-accent',
                  state === 'correct' && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
                  state === 'wrong' && 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',

                )}
              >
                <span className="inline-flex items-center gap-3">
                  <span className={cn(
                    'flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                    state === 'correct' && 'border-emerald-500 bg-emerald-500 text-white',
                    state === 'wrong' && 'border-red-500 bg-red-500 text-white',
                    state === 'default' && 'border-current',
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                  {state === 'correct' && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                  {state === 'wrong' && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
