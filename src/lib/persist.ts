export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed) && parsed.length === 0) return defaultValue;
    if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length === 0) {
      return defaultValue;
    }
    return parsed as T;
  } catch {
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

export const STORAGE_KEYS = {
  USER_PROFILE: 'fakao_user_profile',
  TODAY_TASKS: 'fakao_today_tasks',
  WRONG_QUESTIONS: 'fakao_wrong_questions',
  NOTES: 'fakao_notes',
  NOTE_TAGS: 'fakao_note_tags',
  EXAM_RECORDS: 'fakao_exam_records',
  QUESTION_FAVORITES: 'fakao_question_favorites',
  DAILY_STATS: 'fakao_daily_stats',
} as const;

export function migrateDates<T extends object>(data: T, dateFields: Array<keyof T>): T;
export function migrateDates<T extends object>(data: T[], dateFields: Array<keyof T>): T[];
export function migrateDates<T extends object>(
  data: T | T[],
  dateFields: Array<keyof T>
): T | T[] {
  if (!data || typeof data !== 'object') return data as T;
  
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const result = { ...item };
      dateFields.forEach((field) => {
        const value = result[field];
        if (value && typeof value === 'string') {
          (result as Record<string, unknown>)[field as string] = new Date(value);
        }
      });
      return result;
    });
  }
  
  const result = { ...data };
  dateFields.forEach((field) => {
    const value = result[field];
    if (value && typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = new Date(value);
    }
  });
  
  return result;
}
