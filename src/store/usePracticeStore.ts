import { create } from 'zustand';
import type { Question, PracticeSession, PracticeResult, AnswerDetail, ReasonType } from '@/types';
import { generateId } from '@/mock/data';

interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  reasonType?: ReasonType;
  timeSpent: number;
}

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
  answerRecords: AnswerRecord[];
  startSession: (
    questions: Question[],
    sessionType: PracticeSession['type'],
    mode: 'single' | 'exam'
  ) => void;
  submitAnswer: (questionId: string, answer: string, reasonType?: ReasonType) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  toggleAnalysis: () => void;
  finishSession: () => PracticeResult | null;
  resetSession: () => void;
  getAnswerRecord: (questionId: string) => AnswerRecord | undefined;
  updateAnswerReason: (questionId: string, reasonType: ReasonType) => void;
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
  answerRecords: [],

  startSession: (questions, sessionType, mode) => {
    const shuffled = sessionType === 'wrong' 
      ? questions 
      : [...questions].sort(() => Math.random() - 0.5);
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
      answerRecords: [],
    });
  },

  submitAnswer: (questionId, answer, reasonType) => {
    const { questionStartTime, questions } = get();
    const timeSpent = questionStartTime
      ? Math.floor((Date.now() - questionStartTime.getTime()) / 1000)
      : 0;
    
    const question = questions.find((q) => q.id === questionId);
    const isCorrect = question ? answer === question.correctAnswer : false;

    set((state) => {
      const existingRecordIndex = state.answerRecords.findIndex(
        (r) => r.questionId === questionId
      );
      
      const newRecord: AnswerRecord = {
        questionId,
        userAnswer: answer,
        isCorrect,
        reasonType,
        timeSpent,
      };

      let newAnswerRecords: AnswerRecord[];
      if (existingRecordIndex >= 0) {
        newAnswerRecords = [...state.answerRecords];
        newAnswerRecords[existingRecordIndex] = newRecord;
      } else {
        newAnswerRecords = [...state.answerRecords, newRecord];
      }

      return {
        answers: { ...state.answers, [questionId]: answer },
        timeSpent: { ...state.timeSpent, [questionId]: timeSpent },
        answerRecords: newAnswerRecords,
        showAnalysis: true,
      };
    });
  },

  getAnswerRecord: (questionId) => {
    return get().answerRecords.find((r) => r.questionId === questionId);
  },

  updateAnswerReason: (questionId, reasonType) => {
    set((state) => ({
      answerRecords: state.answerRecords.map((r) =>
        r.questionId === questionId ? { ...r, reasonType } : r
      ),
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
    const { questions, answers, timeSpent, startTime, answerRecords, sessionType } = get();
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
      answerRecords,
      sessionType,
    } as PracticeResult & { answerRecords: AnswerRecord[]; sessionType: PracticeSession['type'] };
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
      answerRecords: [],
    }),
}));
