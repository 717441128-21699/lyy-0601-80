import { create } from 'zustand';
import type { UserProfile, StudyPlanTask } from '@/types';
import { mockUserProfile, mockStudyTasks, generateId } from '@/mock/data';

interface UserState {
  profile: UserProfile;
  todayTasks: StudyPlanTask[];
  updateProfile: (data: Partial<UserProfile>) => void;
  completeTask: (taskId: string) => void;
  addTask: (task: Omit<StudyPlanTask, 'id' | 'completed' | 'createdAt'>) => void;
  updateTaskProgress: (taskId: string, increment: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: mockUserProfile,
  todayTasks: mockStudyTasks,

  updateProfile: (data) =>
    set((state) => ({
      profile: { ...state.profile, ...data },
    })),

  completeTask: (taskId) =>
    set((state) => ({
      todayTasks: state.todayTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: true, completedCount: task.targetCount }
          : task
      ),
    })),

  addTask: (task) => {
    const newTask: StudyPlanTask = {
      ...task,
      id: generateId(),
      completed: false,
      createdAt: new Date(),
    };
    set((state) => ({
      todayTasks: [...state.todayTasks, newTask],
    }));
  },

  updateTaskProgress: (taskId, increment) =>
    set((state) => ({
      todayTasks: state.todayTasks.map((task) => {
        if (task.id !== taskId) return task;
        const newCount = Math.min(task.completedCount + increment, task.targetCount);
        return {
          ...task,
          completedCount: newCount,
          completed: newCount >= task.targetCount,
        };
      }),
    })),
}));
