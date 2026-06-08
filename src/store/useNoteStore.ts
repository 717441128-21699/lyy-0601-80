import { create } from 'zustand';
import type { Note } from '@/types';
import { mockNotes, generateId } from '@/mock/data';
import { loadFromStorage, saveToStorage, STORAGE_KEYS, migrateDates } from '@/lib/persist';

const defaultTags = ['民法', '刑法', '行政法', '民事法律行为', '效力', '正当防卫', '违法阻却事由', '行政复议', '行政诉讼'];

const loadNotes = (): Note[] => {
  const stored = loadFromStorage<Note[]>(STORAGE_KEYS.NOTES, mockNotes);
  return migrateDates<Note>(stored, ['createdAt', 'updatedAt']);
};

const loadTags = (): string[] => {
  return loadFromStorage<string[]>(STORAGE_KEYS.NOTE_TAGS, defaultTags);
};

interface NoteState {
  notes: Note[];
  tags: string[];
  selectedTag: string | null;
  searchKeyword: string;
  setSelectedTag: (tag: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void;
  deleteNote: (id: string) => void;
  addTag: (tag: string) => void;
  getFilteredNotes: () => Note[];
  getNotesByQuestion: (questionId: string) => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: loadNotes(),
  tags: loadTags(),
  selectedTag: null,
  searchKeyword: '',

  setSelectedTag: (tag) => set({ selectedTag: tag }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  addNote: (note) => {
    const newNote: Note = {
      ...note,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newNotes = [newNote, ...state.notes];
      const newTags = [...new Set([...state.tags, ...note.tags])];
      saveToStorage(STORAGE_KEYS.NOTES, newNotes);
      saveToStorage(STORAGE_KEYS.NOTE_TAGS, newTags);
      return { notes: newNotes, tags: newTags };
    });
  },

  updateNote: (id, data) =>
    set((state) => {
      const newNotes = state.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...data,
              updatedAt: new Date(),
              tags: data.tags ? [...new Set([...note.tags, ...data.tags])] : note.tags,
            }
          : note
      );
      const newTags = data.tags ? [...new Set([...state.tags, ...data.tags])] : state.tags;
      saveToStorage(STORAGE_KEYS.NOTES, newNotes);
      saveToStorage(STORAGE_KEYS.NOTE_TAGS, newTags);
      return { notes: newNotes, tags: newTags };
    }),

  deleteNote: (id) =>
    set((state) => {
      const newNotes = state.notes.filter((note) => note.id !== id);
      saveToStorage(STORAGE_KEYS.NOTES, newNotes);
      return { notes: newNotes };
    }),

  addTag: (tag) =>
    set((state) => {
      const newTags = state.tags.includes(tag) ? state.tags : [...state.tags, tag];
      saveToStorage(STORAGE_KEYS.NOTE_TAGS, newTags);
      return { tags: newTags };
    }),

  getFilteredNotes: () => {
    const { notes, selectedTag, searchKeyword } = get();
    return notes.filter((note) => {
      if (selectedTag && !note.tags.includes(selectedTag)) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  },

  getNotesByQuestion: (questionId) =>
    get().notes.filter((note) => note.questionId === questionId),
}));
