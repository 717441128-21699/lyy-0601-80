import { create } from 'zustand';
import type { Subject, Chapter, Question } from '@/types';
import { mockSubjects, mockChapters, mockQuestions } from '@/mock/data';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/persist';

const loadFavorites = (): string[] => {
  return loadFromStorage<string[]>(STORAGE_KEYS.QUESTION_FAVORITES, []);
};

const initializeQuestions = (): Question[] => {
  const favoriteIds = loadFavorites();
  return mockQuestions.map((q) => ({
    ...q,
    isFavorite: favoriteIds.includes(q.id),
  }));
};

interface QuestionBankState {
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  currentSubject: string | null;
  currentChapter: string | null;
  searchKeyword: string;
  filterDifficulty: Question['difficulty'] | null;
  filterType: Question['type'] | null;
  showFavoritesOnly: boolean;
  setSubject: (id: string | null) => void;
  setChapter: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilterDifficulty: (difficulty: Question['difficulty'] | null) => void;
  setFilterType: (type: Question['type'] | null) => void;
  toggleFavoritesOnly: () => void;
  toggleFavorite: (questionId: string) => void;
  getFilteredQuestions: () => Question[];
}

export const useQuestionBankStore = create<QuestionBankState>((set, get) => ({
  subjects: mockSubjects,
  chapters: mockChapters,
  questions: initializeQuestions(),
  currentSubject: null,
  currentChapter: null,
  searchKeyword: '',
  filterDifficulty: null,
  filterType: null,
  showFavoritesOnly: false,

  setSubject: (id) => set({ currentSubject: id, currentChapter: null }),
  setChapter: (id) => set({ currentChapter: id }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setFilterDifficulty: (difficulty) => set({ filterDifficulty: difficulty }),
  setFilterType: (type) => set({ filterType: type }),
  toggleFavoritesOnly: () => set((state) => ({ showFavoritesOnly: !state.showFavoritesOnly })),

  toggleFavorite: (questionId) =>
    set((state) => {
      const updatedQuestions = state.questions.map((q) =>
        q.id === questionId ? { ...q, isFavorite: !q.isFavorite } : q
      );
      const favoriteIds = updatedQuestions
        .filter((q) => q.isFavorite)
        .map((q) => q.id);
      saveToStorage(STORAGE_KEYS.QUESTION_FAVORITES, favoriteIds);
      return { questions: updatedQuestions };
    }),

  getFilteredQuestions: () => {
    const {
      questions,
      currentSubject,
      currentChapter,
      searchKeyword,
      filterDifficulty,
      filterType,
      showFavoritesOnly,
    } = get();

    return questions.filter((q) => {
      if (currentSubject && q.subjectId !== currentSubject) return false;
      if (currentChapter && q.chapterId !== currentChapter) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      if (filterType && q.type !== filterType) return false;
      if (showFavoritesOnly && !q.isFavorite) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          q.content.toLowerCase().includes(keyword) ||
          q.knowledgePoints.some((kp) => kp.toLowerCase().includes(keyword))
        );
      }
      return true;
    });
  },
}));
