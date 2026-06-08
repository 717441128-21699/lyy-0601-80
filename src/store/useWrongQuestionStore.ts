import { create } from 'zustand';
import type { WrongQuestion, WeakPoint, ReasonType } from '@/types';
import { mockWrongQuestions, generateId } from '@/mock/data';
import { useQuestionBankStore } from './useQuestionBankStore';

const INTERVALS = [1, 2, 4, 7, 15, 30];

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
  getTodayReviews: () => WrongQuestion[];
  getWeakPoints: () => WeakPoint[];
  getWrongQuestionsBySubject: (subjectId: string) => WrongQuestion[];
  getWrongQuestionsByReason: (reason: ReasonType) => WrongQuestion[];
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

export const useWrongQuestionStore = create<WrongQuestionState>((set, get) => ({
  wrongQuestions: mockWrongQuestions,
  reasonTypes: ['concept', 'law', 'review', 'careless', 'other'],

  addWrongQuestion: (questionId, wrongAnswer, reasonType) => {
    const existing = get().wrongQuestions.find((wq) => wq.questionId === questionId);
    
    if (existing) {
      set((state) => ({
        wrongQuestions: state.wrongQuestions.map((wq) =>
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
        ),
      }));
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
      set((state) => ({ wrongQuestions: [...state.wrongQuestions, newWrong] }));
    }
  },

  updateReason: (id, reasonType) =>
    set((state) => ({
      wrongQuestions: state.wrongQuestions.map((wq) =>
        wq.id === id ? { ...wq, reasonType } : wq
      ),
    })),

  markAsReviewed: (id, correct) =>
    set((state) => ({
      wrongQuestions: state.wrongQuestions.map((wq) => {
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
      }),
    })),

  markAsMastered: (id) =>
    set((state) => ({
      wrongQuestions: state.wrongQuestions.map((wq) =>
        wq.id === id ? { ...wq, mastered: true } : wq
      ),
    })),

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
}));
