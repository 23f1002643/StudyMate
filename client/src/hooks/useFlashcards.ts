import { useState } from 'react';
import { FlashcardSession, Flashcard } from '@/types/chat';

export function useFlashcards() {
  const [session, setSession] = useState<FlashcardSession | null>(null);

  const startSession = (cards: Flashcard[]) => {
    setSession({ cards, currentIndex: 0, flipped: false, completed: false, results: [] });
  };

  const flip = () => {
    if (!session) return;
    setSession({ ...session, flipped: !session.flipped });
  };

  const rate = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!session) return;
    const results = [...session.results, difficulty];
    const isLast = session.currentIndex === session.cards.length - 1;
    setSession({
      ...session,
      results,
      flipped: false,
      completed: isLast,
      currentIndex: isLast ? session.currentIndex : session.currentIndex + 1,
    });
  };

  const reset = () => setSession(null);

  return { session, startSession, flip, rate, reset };
}
