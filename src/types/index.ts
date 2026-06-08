export interface UserProfile {
  name: string;
  studyDays: number;
  currentStreak: number;
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalQuestions: number;
  completedQuestions: number;
  accuracyRate: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  totalQuestions: number;
  completedCount: number;
  masteryRate: number;
  children?: Chapter[];
}

export interface Question {
  id: string;
  subjectId: string;
  chapterId: string;
  type: 'single' | 'multiple' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  options?: Array<{ label: string; text: string }>;
  correctAnswer: string;
  analysis: string;
  lawReference: string;
  isFavorite: boolean;
  exerciseCount: number;
  correctCount: number;
  knowledgePoints: string[];
}

export interface WrongQuestion {
  id: string;
  questionId: string;
  wrongAnswer: string;
  reasonType: string;
  userNote?: string;
  reviewCount: number;
  correctInReview: number;
  wrongAt: Date;
  nextReviewAt: Date;
  mastered: boolean;
}

export interface StudyPlanTask {
  id: string;
  title: string;
  type: 'practice' | 'review' | 'note';
  targetCount: number;
  completedCount: number;
  relatedSubject?: string;
  relatedChapter?: string;
  date: string;
  completed: boolean;
  createdAt: Date;
}

export interface Note {
  id: string;
  questionId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamRecord {
  id: string;
  name: string;
  type: 'objective' | 'subjective' | 'full';
  totalQuestions: number;
  correctCount: number;
  totalScore: number;
  userScore: number;
  timeSpent: number;
  ranking?: number;
  totalParticipants?: number;
  subjectiveScores?: Array<{ questionId: string; score: number; maxScore: number }>;
  questionIds: string[];
  answers: Record<string, string>;
  createdAt: Date;
}

export interface PracticeSession {
  id: string;
  type: 'practice' | 'wrong' | 'chapter' | 'random';
  mode: 'single' | 'exam';
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, string>;
  timeSpent: Record<string, number>;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

export interface PracticeResult {
  totalQuestions: number;
  correctCount: number;
  accuracyRate: number;
  totalTime: number;
  details: AnswerDetail[];
}

export interface AnswerDetail {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface WeakPoint {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  errorRate: number;
  wrongCount: number;
  totalCount: number;
  recommendation: string;
  knowledgePoints: string[];
}

export interface DailyStat {
  date: string;
  questionCount: number;
  correctCount: number;
  accuracyRate: number;
  studyTime: number;
}

export interface HeatmapData {
  subjectId: string;
  chapterId: string;
  chapterName: string;
  masteryRate: number;
  questionCount: number;
}

export interface RadarData {
  subject: string;
  subjectId: string;
  score: number;
  fullMark: number;
}

export type ReasonType = 'concept' | 'law' | 'review' | 'careless' | 'other';

export const REASON_TYPES: Array<{ value: ReasonType; label: string; color: string }> = [
  { value: 'concept', label: '概念不清', color: 'bg-blue-500' },
  { value: 'law', label: '法条不熟', color: 'bg-purple-500' },
  { value: 'review', label: '理解偏差', color: 'bg-orange-500' },
  { value: 'careless', label: '审题失误', color: 'bg-yellow-500' },
  { value: 'other', label: '其他原因', color: 'bg-gray-500' },
];

export const DIFFICULTY_MAP = {
  easy: { label: '简单', color: 'bg-green-100 text-green-700' },
  medium: { label: '中等', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: '困难', color: 'bg-red-100 text-red-700' },
};

export const QUESTION_TYPE_MAP = {
  single: { label: '单选题', color: 'bg-blue-100 text-blue-700' },
  multiple: { label: '多选题', color: 'bg-purple-100 text-purple-700' },
  subjective: { label: '主观题', color: 'bg-orange-100 text-orange-700' },
};
