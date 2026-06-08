import { create } from 'zustand';
import type { Question, PracticeSession, PracticeResult, AnswerDetail } from '@/types';
import { generateId } from '@/mock/data';

interface PracticeState {
  isActive: boolean;
  sessionId: string | null;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Record<string, string>;
  timeSpent: Record<string, number>;
  startTime: Date | null;
  questionStartTime: Date | null;
  showAnalysis: boolean;
  mode: 'single' | 'exam';
  sessionType: 'practice' | 'wrong' | 'chapter' | 'random';
  startSession: (
    questions: Question[],
    sessionType: PracticeSession['type'],
    mode: 'single' | 'exam'
  ) => void;
  submitAnswer: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  toggleAnalysis: () => void;
  finishSession: () => PracticeResult | null;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  isActive: false,
  sessionId: null,
  currentQuestionIndex: 0,
  questions: [],
  answers: {},
  timeSpent: {},
  startTime: null,
  questionStartTime: null,
  showAnalysis: false,
  mode: 'single',
  sessionType: 'practice',

  startSession: (questions, sessionType, mode) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    set({
      isActive: true,
      sessionId: generateId(),
      currentQuestionIndex: 0,
      questions: shuffled,
      answers: {},
      timeSpent: {},
      startTime: new Date(),
      questionStartTime: new Date(),
      showAnalysis: false,
      mode,
      sessionType,
    });
  },

  submitAnswer: (questionId, answer) => {
    const { questionStartTime } = get();
    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime.getTime()) / 1000)
      : 0;

    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
      timeSpent: { ...state.timeSpent, [questionId]: timeSpent },
      showAnalysis: true,
    }));
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({
        currentQuestionIndex: currentQuestionIndex + 1,
        questionStartTime: new Date(),
        showAnalysis: false,
      });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({
        currentQuestionIndex: currentQuestionIndex - 1,
        questionStartTime: new Date(),
        showAnalysis: false,
      });
    }
  },

  toggleAnalysis: () => set((state) => ({ showAnalysis: !state.showAnalysis })),

  finishSession: () => {
    const { questions, answers, timeSpent, startTime } = get();
    if (questions.length === 0) return null;

    let correctCount = 0;
    const details: AnswerDetail[] = [];

    questions.forEach((q) => {
      const userAnswer = answers[q.id] || '';
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      details.push({
        questionId: q.id,
        userAnswer,
        isCorrect,
        timeSpent: timeSpent[q.id] || 0,
      });
    });

    const totalTime = startTime
      ? Math.floor((Date.now() - startTime.getTime()) / 1000)
      : 0;

    set({ isActive: false });

    return {
      totalQuestions: questions.length,
      correctCount,
      accuracyRate: correctCount / questions.length,
      totalTime,
      details,
    };
  },

  resetSession: () =>
    set({
      isActive: false,
      sessionId: null,
      currentQuestionIndex: 0,
      questions: [],
      answers: {},
      timeSpent: {},
      startTime: null,
      questionStartTime: null,
      showAnalysis: false,
      mode: 'single',
      sessionType: 'practice',
    }),
}));
