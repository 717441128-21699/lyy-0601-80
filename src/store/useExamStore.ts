import { create } from 'zustand';
import type { ExamRecord } from '@/types';
import { mockExamRecords, generateId } from '@/mock/data';
import { useQuestionBankStore } from './useQuestionBankStore';
import { loadFromStorage, saveToStorage, STORAGE_KEYS, migrateDates } from '@/lib/persist';

const loadExamRecords = (): ExamRecord[] => {
  const stored = loadFromStorage<ExamRecord[]>(STORAGE_KEYS.EXAM_RECORDS, mockExamRecords);
  return migrateDates<ExamRecord>(stored, ['createdAt']);
};

interface ExamState {
  examRecords: ExamRecord[];
  currentExam: ExamRecord | null;
  isExamActive: boolean;
  startTime: Date | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  subjectiveScores: Record<string, number>;
  startExam: (name: string, type: ExamRecord['type'], questionCount: number) => void;
  submitAnswer: (questionId: string, answer: string) => void;
  submitSubjectiveScore: (questionId: string, score: number, maxScore: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishExam: () => ExamRecord | null;
  updateSubjectiveScore: (examId: string, questionId: string, score: number) => void;
  getExamRanking: (score: number) => { ranking: number; total: number; percentile: number };
  getExamTrend: () => Array<{ date: string; score: number }>;
  getStats: () => {
    totalExams: number;
    averageScore: number;
    highestScore: number;
    totalTime: number;
  };
}

export const useExamStore = create<ExamState>((set, get) => ({
  examRecords: loadExamRecords(),
  currentExam: null,
  isExamActive: false,
  startTime: null,
  currentQuestionIndex: 0,
  answers: {},
  subjectiveScores: {},

  startExam: (name, type, questionCount) => {
    const { questions } = useQuestionBankStore.getState();
    const shuffled = [...questions]
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount);

    const totalScore = type === 'objective' ? 150 : type === 'subjective' ? 180 : 300;

    set({
      currentExam: null,
      isExamActive: true,
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: {},
      subjectiveScores: {},
    });

    const newExam: ExamRecord = {
      id: generateId(),
      name,
      type,
      totalQuestions: shuffled.length,
      correctCount: 0,
      totalScore,
      userScore: 0,
      timeSpent: 0,
      questionIds: shuffled.map((q) => q.id),
      answers: {},
      createdAt: new Date(),
    };

    set({ currentExam: newExam });
  },

  submitAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  submitSubjectiveScore: (questionId, score) =>
    set((state) => ({
      subjectiveScores: { ...state.subjectiveScores, [questionId]: score },
    })),

  nextQuestion: () => {
    const { currentQuestionIndex, currentExam } = get();
    if (currentExam && currentQuestionIndex < currentExam.questionIds.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  finishExam: () => {
    const { currentExam, answers, subjectiveScores, startTime } = get();
    if (!currentExam) return null;

    const { questions } = useQuestionBankStore.getState();
    let correctCount = 0;
    let userScore = 0;

    const questionScore = currentExam.totalScore / currentExam.totalQuestions;

    currentExam.questionIds.forEach((qId) => {
      const question = questions.find((q) => q.id === qId);
      if (!question) return;

      const userAnswer = answers[qId] || '';
      
      if (question.type === 'subjective') {
        const score = subjectiveScores[qId] || 0;
        userScore += score;
      } else {
        if (userAnswer === question.correctAnswer) {
          correctCount++;
          userScore += questionScore;
        }
      }
    });

    const timeSpent = startTime
      ? Math.floor((Date.now() - startTime.getTime()) / 1000)
      : 0;

    const ranking = get().getExamRanking(userScore);

    const completedExam: ExamRecord = {
      ...currentExam,
      correctCount,
      userScore: Math.round(userScore * 10) / 10,
      timeSpent,
      answers,
      subjectiveScores: Object.entries(subjectiveScores).map(([qId, score]) => ({
        questionId: qId,
        score,
        maxScore: questionScore,
      })),
      ranking: ranking.ranking,
      totalParticipants: ranking.total,
      createdAt: new Date(),
    };

    set((state) => {
      const newExamRecords = [completedExam, ...state.examRecords];
      saveToStorage(STORAGE_KEYS.EXAM_RECORDS, newExamRecords);
      return {
        examRecords: newExamRecords,
        isExamActive: false,
        currentExam: null,
        startTime: null,
      };
    });

    return completedExam;
  },

  updateSubjectiveScore: (examId, questionId, score) => {
    const { examRecords } = get();
    const { questions } = useQuestionBankStore.getState();

    const updatedRecords = examRecords.map((record) => {
      if (record.id !== examId) return record;

      const questionScore = record.totalScore / record.totalQuestions;

      const updatedSubjectiveScores = record.subjectiveScores
        ? record.subjectiveScores.map((ss) =>
            ss.questionId === questionId ? { ...ss, score } : ss
          )
        : [];

      let correctCount = 0;
      let userScore = 0;

      record.questionIds.forEach((qId) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;

        const userAnswer = record.answers[qId] || '';

        if (question.type === 'subjective') {
          const ss = updatedSubjectiveScores.find((s) => s.questionId === qId);
          userScore += ss?.score || 0;
        } else {
          if (userAnswer === question.correctAnswer) {
            correctCount++;
            userScore += questionScore;
          }
        }
      });

      const ranking = get().getExamRanking(Math.round(userScore * 10) / 10);

      return {
        ...record,
        correctCount,
        userScore: Math.round(userScore * 10) / 10,
        subjectiveScores: updatedSubjectiveScores,
        ranking: ranking.ranking,
        totalParticipants: ranking.total,
      };
    });

    saveToStorage(STORAGE_KEYS.EXAM_RECORDS, updatedRecords);
    set({ examRecords: updatedRecords });
  },

  getExamRanking: (score) => {
    const allScores = get().examRecords.map((e) => e.userScore);
    allScores.push(score);
    allScores.sort((a, b) => b - a);
    
    const ranking = allScores.indexOf(score) + 1;
    const total = allScores.length;
    const percentile = Math.round(((total - ranking) / total) * 100);

    return { ranking, total: total + Math.floor(Math.random() * 8000), percentile };
  },

  getExamTrend: () =>
    get()
      .examRecords
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e) => ({
        date: new Date(e.createdAt).toLocaleDateString('zh-CN'),
        score: e.userScore,
      })),

  getStats: () => {
    const records = get().examRecords;
    if (records.length === 0) {
      return { totalExams: 0, averageScore: 0, highestScore: 0, totalTime: 0 };
    }

    const totalExams = records.length;
    const totalScore = records.reduce((sum, r) => sum + r.userScore, 0);
    const averageScore = totalScore / totalExams;
    const highestScore = Math.max(...records.map((r) => r.userScore));
    const totalTime = records.reduce((sum, r) => sum + r.timeSpent, 0);

    return {
      totalExams,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore,
      totalTime,
    };
  },
}));
