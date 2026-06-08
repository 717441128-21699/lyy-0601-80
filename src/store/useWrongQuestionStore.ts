import { create } from 'zustand';
import type { WrongQuestion, WeakPoint, ReasonType } from '@/types';
import { mockWrongQuestions, generateId } from '@/mock/data';
import { useQuestionBankStore } from './useQuestionBankStore';
import { loadFromStorage, saveToStorage, STORAGE_KEYS, migrateDates } from '@/lib/persist';

const INTERVALS = [1, 2, 4, 7, 15, 30];

const loadWrongQuestions = (): WrongQuestion[] => {
  const stored = loadFromStorage<WrongQuestion[]>(STORAGE_KEYS.WRONG_QUESTIONS, []);
  if (stored.length === 0) return mockWrongQuestions;
  return migrateDates<WrongQuestion>(stored, ['wrongAt', 'nextReviewAt']);
};

interface WrongQuestionState {
  wrongQuestions: WrongQuestion[];
  reasonTypes: ReasonType[];
  addWrongQuestion: (
    questionId: string,
    wrongAnswer: string,
    reasonType: ReasonType
  ) => void;
  updateReason: (id: string, reasonType: ReasonType) => void;
  markAsReviewed: (id: string, correct: boolean) => void;
  markAsMastered: (id: string) => void;
  processReviewResults: (results: Array<{ questionId: string; correct: boolean; reasonType?: ReasonType }>) => void;
  getTodayReviews: () => WrongQuestion[];
  getWeakPoints: () => WeakPoint[];
  getWrongQuestionsBySubject: (subjectId: string) => WrongQuestion[];
  getWrongQuestionsByReason: (reason: ReasonType) => WrongQuestion[];
  getReasonStats: () => Array<{ reason: ReasonType; count: number; percentage: number }>;
}

const calculateNextReview = (wrongQuestion: WrongQuestion): Date => {
  const { reviewCount, correctInReview } = wrongQuestion;
  let intervalIndex = Math.min(reviewCount, INTERVALS.length - 1);
  
  if (correctInReview >= 2) {
    intervalIndex = Math.min(intervalIndex + 1, INTERVALS.length - 1);
  }
  
  const interval = INTERVALS[intervalIndex];
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return nextReview;
};

const persist = (wrongQuestions: WrongQuestion[]) => {
  saveToStorage(STORAGE_KEYS.WRONG_QUESTIONS, wrongQuestions);
};

export const useWrongQuestionStore = create<WrongQuestionState>((set, get) => ({
  wrongQuestions: loadWrongQuestions(),
  reasonTypes: ['concept', 'law', 'review', 'careless', 'other'],

  addWrongQuestion: (questionId, wrongAnswer, reasonType) => {
    set((state) => {
      const existing = state.wrongQuestions.find((wq) => wq.questionId === questionId);
      let newWrongQuestions: WrongQuestion[];
      
      if (existing) {
        newWrongQuestions = state.wrongQuestions.map((wq) =>
          wq.id === existing.id
            ? {
                ...wq,
                wrongAnswer,
                reasonType,
                reviewCount: 0,
                correctInReview: 0,
                wrongAt: new Date(),
                nextReviewAt: new Date(),
                mastered: false,
              }
            : wq
        );
      } else {
        const newWrong: WrongQuestion = {
          id: generateId(),
          questionId,
          wrongAnswer,
          reasonType,
          reviewCount: 0,
          correctInReview: 0,
          wrongAt: new Date(),
          nextReviewAt: new Date(),
          mastered: false,
        };
        newWrongQuestions = [...state.wrongQuestions, newWrong];
      }
      
      persist(newWrongQuestions);
      return { wrongQuestions: newWrongQuestions };
    });
  },

  updateReason: (id, reasonType) =>
    set((state) => {
      const newWrongQuestions = state.wrongQuestions.map((wq) =>
        wq.id === id ? { ...wq, reasonType } : wq
      );
      persist(newWrongQuestions);
      return { wrongQuestions: newWrongQuestions };
    }),

  markAsReviewed: (id, correct) =>
    set((state) => {
      const newWrongQuestions = state.wrongQuestions.map((wq) => {
        if (wq.id !== id) return wq;
        const updated = {
          ...wq,
          reviewCount: wq.reviewCount + 1,
          correctInReview: correct ? wq.correctInReview + 1 : 0,
        };
        return {
          ...updated,
          nextReviewAt: calculateNextReview(updated),
          mastered: updated.correctInReview >= 3,
        };
      });
      persist(newWrongQuestions);
      return { wrongQuestions: newWrongQuestions };
    }),

  markAsMastered: (id) =>
    set((state) => {
      const newWrongQuestions = state.wrongQuestions.map((wq) =>
        wq.id === id ? { ...wq, mastered: true } : wq
      );
      persist(newWrongQuestions);
      return { wrongQuestions: newWrongQuestions };
    }),

  processReviewResults: (results) => {
    set((state) => {
      const newWrongQuestions = [...state.wrongQuestions];
      
      results.forEach(({ questionId, correct, reasonType }) => {
        const index = newWrongQuestions.findIndex((wq) => wq.questionId === questionId);
        if (index === -1) return;
        
        const wq = newWrongQuestions[index];
        
        if (correct) {
          const updated = {
            ...wq,
            reviewCount: wq.reviewCount + 1,
            correctInReview: wq.correctInReview + 1,
          };
          newWrongQuestions[index] = {
            ...updated,
            nextReviewAt: calculateNextReview(updated),
            mastered: updated.correctInReview >= 3,
          };
        } else {
          newWrongQuestions[index] = {
            ...wq,
            reviewCount: 0,
            correctInReview: 0,
            wrongAt: new Date(),
            nextReviewAt: new Date(),
            mastered: false,
            reasonType: reasonType || wq.reasonType,
          };
        }
      });
      
      persist(newWrongQuestions);
      return { wrongQuestions: newWrongQuestions };
    });
  },

  getTodayReviews: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return get()
      .wrongQuestions.filter((wq) => {
        if (wq.mastered) return false;
        const nextReview = new Date(wq.nextReviewAt);
        nextReview.setHours(0, 0, 0, 0);
        return nextReview <= today;
      })
      .sort((a, b) => new Date(a.wrongAt).getTime() - new Date(b.wrongAt).getTime());
  },

  getWeakPoints: () => {
    const { wrongQuestions } = get();
    const { questions, chapters, subjects } = useQuestionBankStore.getState();
    
    const chapterStats = new Map<
      string,
      { wrongCount: number; totalCount: number; knowledgePoints: Set<string> }
    >();

    wrongQuestions.forEach((wq) => {
      if (wq.mastered) return;
      
      const question = questions.find((q) => q.id === wq.questionId);
      if (!question) return;

      const chapterId = question.chapterId;
      if (!chapterStats.has(chapterId)) {
        chapterStats.set(chapterId, {
          wrongCount: 0,
          totalCount: 0,
          knowledgePoints: new Set(),
        });
      }
      
      const stats = chapterStats.get(chapterId)!;
      stats.wrongCount++;
      question.knowledgePoints.forEach((kp) => stats.knowledgePoints.add(kp));
    });

    questions.forEach((q) => {
      const stats = chapterStats.get(q.chapterId);
      if (stats) {
        stats.totalCount += q.exerciseCount;
      }
    });

    const weakPoints: WeakPoint[] = [];
    chapterStats.forEach((stats, chapterId) => {
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter) return;
      
      const totalCount = stats.totalCount || stats.wrongCount;
      const errorRate = stats.wrongCount / totalCount;
      
      if (errorRate > 0.3) {
        let recommendation = '有待提高，建议定期复习';
        if (errorRate > 0.6) {
          recommendation = '急需加强，建议重新学习章节内容';
        } else if (errorRate > 0.4) {
          recommendation = '需要重点练习，建议多做相关题目';
        }
        
        weakPoints.push({
          chapterId,
          chapterName: chapter.name,
          subjectId: chapter.subjectId,
          errorRate,
          wrongCount: stats.wrongCount,
          totalCount,
          recommendation,
          knowledgePoints: Array.from(stats.knowledgePoints),
        });
      }
    });

    return weakPoints.sort((a, b) => b.errorRate - a.errorRate);
  },

  getWrongQuestionsBySubject: (subjectId) => {
    const { questions } = useQuestionBankStore.getState();
    return get().wrongQuestions.filter((wq) => {
      const question = questions.find((q) => q.id === wq.questionId);
      return question?.subjectId === subjectId;
    });
  },

  getWrongQuestionsByReason: (reason) =>
    get().wrongQuestions.filter((wq) => wq.reasonType === reason),

  getReasonStats: () => {
    const { wrongQuestions, reasonTypes } = get();
    const activeWrongQuestions = wrongQuestions.filter((wq) => !wq.mastered);
    const total = activeWrongQuestions.length;
    
    return reasonTypes.map((reason) => {
      const count = activeWrongQuestions.filter((wq) => wq.reasonType === reason).length;
      return {
        reason,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  },
}));
