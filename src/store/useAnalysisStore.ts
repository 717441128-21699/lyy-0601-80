import { create } from 'zustand';
import type { DailyStat, HeatmapData, RadarData, WeakPoint } from '@/types';
import { mockDailyStats, mockHeatmapData, mockRadarData } from '@/mock/data';
import { useWrongQuestionStore } from './useWrongQuestionStore';
import { useExamStore } from './useExamStore';
import { useQuestionBankStore } from './useQuestionBankStore';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/persist';

const loadDailyStats = (): DailyStat[] => {
  return loadFromStorage(STORAGE_KEYS.DAILY_STATS, mockDailyStats);
};

interface AnalysisState {
  dailyStats: DailyStat[];
  heatmapData: HeatmapData[];
  radarData: RadarData[];
  getDailyStats: () => DailyStat[];
  getHeatmapData: (subjectId?: string) => HeatmapData[];
  getRadarData: () => RadarData[];
  getWeakPoints: () => WeakPoint[];
  getSubjectAccuracy: () => Array<{ subject: string; subjectId: string; accuracyRate: number; color: string }>;
  getScoreTrend: () => Array<{ date: string; score: number; type: string }>;
  getOverviewStats: () => {
    totalQuestions: number;
    accuracyRate: number;
    avgTimePerQuestion: number;
    weakPointCount: number;
    totalStudyTime: number;
  };
  addDailyStat: (questions: number, correct: number, time: number) => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  dailyStats: loadDailyStats(),
  heatmapData: mockHeatmapData,
  radarData: mockRadarData,

  getDailyStats: () => get().dailyStats,

  getHeatmapData: (subjectId) => {
    const data = get().heatmapData;
    return subjectId ? data.filter((d) => d.subjectId === subjectId) : data;
  },

  getRadarData: () => get().radarData,

  getWeakPoints: () => useWrongQuestionStore.getState().getWeakPoints(),

  getSubjectAccuracy: () => {
    const { subjects } = useQuestionBankStore.getState();
    return subjects.map((s) => ({
      subject: s.name,
      subjectId: s.id,
      accuracyRate: s.accuracyRate,
      color: s.color,
    }));
  },

  getScoreTrend: () => {
    const examTrend = useExamStore.getState().getExamTrend();
    const dailyAccuracy = get()
      .dailyStats
      .slice(-10)
      .map((d) => ({
        date: d.date,
        score: Math.round(d.accuracyRate * 100),
        type: 'daily',
      }));

    const examScores = examTrend.map((e) => ({
      date: e.date,
      score: Math.round((e.score / 150) * 100),
      type: 'exam',
    }));

    return [...dailyAccuracy, ...examScores];
  },

  getOverviewStats: () => {
    const { dailyStats } = get();
    const { getStats } = useExamStore.getState();

    const totalQuestions = dailyStats.reduce((sum, d) => sum + d.questionCount, 0);
    const totalCorrect = dailyStats.reduce((sum, d) => sum + d.correctCount, 0);
    const totalStudyTime = dailyStats.reduce((sum, d) => sum + d.studyTime, 0) + getStats().totalTime / 60;
    const avgTimePerQuestion = totalQuestions > 0 ? (totalStudyTime * 60) / totalQuestions : 0;

    const weakPoints = useWrongQuestionStore.getState().getWeakPoints();

    return {
      totalQuestions,
      accuracyRate: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
      avgTimePerQuestion: Math.round(avgTimePerQuestion),
      weakPointCount: weakPoints.length,
      totalStudyTime: Math.round(totalStudyTime),
    };
  },

  addDailyStat: (questions, correct, time) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => {
      const existingIndex = state.dailyStats.findIndex((d) => d.date === today);
      
      if (existingIndex >= 0) {
        const updated = [...state.dailyStats];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          questionCount: existing.questionCount + questions,
          correctCount: existing.correctCount + correct,
          accuracyRate: (existing.correctCount + correct) / (existing.questionCount + questions),
          studyTime: existing.studyTime + time,
        };
        saveToStorage(STORAGE_KEYS.DAILY_STATS, updated);
        return { dailyStats: updated };
      } else {
        const updated = [
          ...state.dailyStats,
          {
            date: today,
            questionCount: questions,
            correctCount: correct,
            accuracyRate: questions > 0 ? correct / questions : 0,
            studyTime: time,
          },
        ];
        saveToStorage(STORAGE_KEYS.DAILY_STATS, updated);
        return { dailyStats: updated };
      }
    });
  },
}));
