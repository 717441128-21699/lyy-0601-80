import { create } from 'zustand';
import type { Note } from '@/types';
import { mockNotes, generateId } from '@/mock/data';

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
  notes: mockNotes,
  tags: ['民法', '刑法', '行政法', '民事法律行为', '效力', '正当防卫', '违法阻却事由', '行政复议', '行政诉讼'],
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
    set((state) => ({
      notes: [newNote, ...state.notes],
      tags: [...new Set([...state.tags, ...note.tags])],
    }));
  },

  updateNote: (id, data) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...data,
              updatedAt: new Date(),
              tags: data.tags ? [...new Set([...note.tags, ...data.tags])] : note.tags,
            }
          : note
      ),
      tags: data.tags ? [...new Set([...state.tags, ...data.tags])] : state.tags,
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    })),

  addTag: (tag) =>
    set((state) => ({
      tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag],
    })),

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
