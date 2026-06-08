import { create } from 'zustand';
import type { UserProfile, StudyPlanTask } from '@/types';
import { mockUserProfile, mockStudyTasks, generateId } from '@/mock/data';
import { loadFromStorage, saveToStorage, STORAGE_KEYS, migrateDates } from '@/lib/persist';

const loadProfile = (): UserProfile => {
  const loaded = loadFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, mockUserProfile);
  return loaded;
};

const loadTodayTasks = (): StudyPlanTask[] => {
  const loaded = loadFromStorage<StudyPlanTask[]>(STORAGE_KEYS.TODAY_TASKS, mockStudyTasks);
  return migrateDates<StudyPlanTask>(loaded, ['createdAt']);
};

interface UserState {
  profile: UserProfile;
  todayTasks: StudyPlanTask[];
  updateProfile: (data: Partial<UserProfile>) => void;
  completeTask: (taskId: string) => void;
  addTask: (task: Omit<StudyPlanTask, 'id' | 'completed' | 'createdAt'>) => void;
  updateTaskProgress: (taskId: string, increment: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: loadProfile(),
  todayTasks: loadTodayTasks(),

  updateProfile: (data) =>
    set((state) => {
      const newProfile = { ...state.profile, ...data };
      saveToStorage(STORAGE_KEYS.USER_PROFILE, newProfile);
      return { profile: newProfile };
    }),

  completeTask: (taskId) =>
    set((state) => {
      const newTasks = state.todayTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: true, completedCount: task.targetCount }
          : task
      );
      saveToStorage(STORAGE_KEYS.TODAY_TASKS, newTasks);
      return { todayTasks: newTasks };
    }),

  addTask: (task) => {
    const newTask: StudyPlanTask = {
      ...task,
      id: generateId(),
      completed: false,
      createdAt: new Date(),
    };
    set((state) => {
      const newTasks = [...state.todayTasks, newTask];
      saveToStorage(STORAGE_KEYS.TODAY_TASKS, newTasks);
      return { todayTasks: newTasks };
    });
  },

  updateTaskProgress: (taskId, increment) =>
    set((state) => {
      const newTasks = state.todayTasks.map((task) => {
        if (task.id !== taskId) return task;
        const newCount = Math.min(task.completedCount + increment, task.targetCount);
        return {
          ...task,
          completedCount: newCount,
          completed: newCount >= task.targetCount,
        };
      });
      saveToStorage(STORAGE_KEYS.TODAY_TASKS, newTasks);
      return { todayTasks: newTasks };
    }),
}));
