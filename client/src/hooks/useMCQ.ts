import { useState } from 'react';
import { MCQSession, MCQQuestion } from '@/types/chat';

export function useMCQ() {
  const [session, setSession] = useState<MCQSession | null>(null);
  const [loading, setLoading] = useState(false);

  const startSession = (questions: MCQQuestion[]) => {
    setSession({
      questions,
      answers: new Array(questions.length).fill(null),
      currentIndex: 0,
      completed: false,
    });
  };

  const answerQuestion = (answerIndex: number) => {
    if (!session) return;
    const answers = [...session.answers];
    answers[session.currentIndex] = answerIndex;

    const isLast = session.currentIndex === session.questions.length - 1;
    if (isLast) {
      const score = answers.reduce<number>((acc, ans, i) =>
        acc + (ans === session.questions[i].correct ? 1 : 0), 0);
      setSession({ ...session, answers, completed: true, score });
    } else {
      setSession({ ...session, answers, currentIndex: session.currentIndex + 1 });
    }
  };

  const reset = () => setSession(null);

  return { session, loading, setLoading, startSession, answerQuestion, reset };
}
