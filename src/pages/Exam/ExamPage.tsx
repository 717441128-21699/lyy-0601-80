import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  FileText,
  Award,
  TrendingUp,
  Play,
  ChevronLeft,
  ChevronRight,
  Send,
  BarChart3,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  Trophy,
  Timer,
  BookOpen,
  Users,
  Edit3,
  RotateCcw,
  Eye,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useExamStore } from '@/store/useExamStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { QUESTION_TYPE_MAP, DIFFICULTY_MAP, type ExamRecord } from '@/types';

type ExamView = 'home' | 'exam' | 'result';

const EXAM_TYPES = [
  {
    type: 'objective' as const,
    name: '客观题卷',
    score: 150,
    questions: 100,
    description: '单选题+多选题，180分钟',
    gradient: 'from-blue-500 to-blue-700',
    icon: FileText,
  },
  {
    type: 'subjective' as const,
    name: '主观题卷',
    score: 180,
    questions: 6,
    description: '案例分析+论述题，240分钟',
    gradient: 'from-orange-500 to-orange-700',
    icon: Edit3,
  },
  {
    type: 'full' as const,
    name: '综合卷',
    score: 300,
    questions: 106,
    description: '客观题+主观题，420分钟',
    gradient: 'from-purple-500 to-purple-700',
    icon: BookOpen,
  },
];

const EXAM_TYPE_MAP = {
  objective: { label: '客观题', color: 'bg-blue-100 text-blue-700' },
  subjective: { label: '主观题', color: 'bg-orange-100 text-orange-700' },
  full: { label: '综合卷', color: 'bg-purple-100 text-purple-700' },
};

const PASSING_SCORE = 108;

export default function ExamPage() {
  const {
    examRecords,
    currentExam,
    isExamActive,
    currentQuestionIndex,
    answers,
    startTime,
    startExam,
    submitAnswer,
    submitSubjectiveScore,
    nextQuestion,
    prevQuestion,
    finishExam,
    getExamTrend,
    getStats,
    getExamRanking,
    updateSubjectiveScore,
  } = useExamStore();

  const { questions } = useQuestionBankStore();
  const { addDailyStat } = useAnalysisStore();

  const [currentView, setCurrentView] = useState<ExamView>('home');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [subjectiveAnswer, setSubjectiveAnswer] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [completedExam, setCompletedExam] = useState<ExamRecord | null>(null);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [localSubjectiveScores, setLocalSubjectiveScores] = useState<Record<string, number>>({});
  const [rankingInfo, setRankingInfo] = useState<{ ranking: number; total: number; percentile: number } | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisQuestionIndex, setAnalysisQuestionIndex] = useState(0);

  const handleSubmitExamRef = useRef<() => void>(() => {});

  const stats = getStats();
  const trendData = getExamTrend();

  useEffect(() => {
    if (currentView === 'result' && completedExam) {
      const updated = examRecords.find((r) => r.id === completedExam.id);
      if (updated) {
        setCompletedExam(updated);
        setRankingInfo(getExamRanking(updated.userScore));
      }
    }
  }, [examRecords, currentView, completedExam?.id, getExamRanking]);

  useEffect(() => {
    if (isExamActive && currentExam) {
      const examType = EXAM_TYPES.find((t) => t.type === currentExam.type);
      const totalSeconds = (examType?.type === 'full' ? 420 : examType?.type === 'subjective' ? 240 : 180) * 60;
      
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setRemainingTime(Math.max(0, totalSeconds - elapsed));
      } else {
        setRemainingTime(totalSeconds);
      }
    }
  }, [isExamActive, currentExam, startTime]);

  useEffect(() => {
    if (!isExamActive || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleSubmitExamRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamActive, remainingTime]);

  useEffect(() => {
    if (isExamActive && currentExam) {
      const currentQid = currentExam.questionIds[currentQuestionIndex];
      setSelectedAnswer(answers[currentQid] || '');
      setSubjectiveAnswer(answers[currentQid] || '');
    }
  }, [currentQuestionIndex, isExamActive, currentExam, answers]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isExamActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const handleStartExam = (type: ExamRecord['type'], name: string, questionCount: number) => {
    if (isExamActive) {
      const confirmed = window.confirm('当前有正在进行的考试，确定要开始新考试吗？');
      if (!confirmed) return;
    }
    startExam(name, type, questionCount);
    setCurrentView('exam');
    setLocalSubjectiveScores({});
  };

  const handleSelectOption = (label: string) => {
    if (!currentExam) return;
    const currentQid = currentExam.questionIds[currentQuestionIndex];
    const question = questions.find((q) => q.id === currentQid);

    if (question?.type === 'multiple') {
      const current = selectedAnswer.split('').filter(Boolean);
      if (current.includes(label)) {
        const newAnswer = current.filter((l) => l !== label).sort().join('');
        setSelectedAnswer(newAnswer);
        submitAnswer(currentQid, newAnswer);
      } else {
        const newAnswer = [...current, label].sort().join('');
        setSelectedAnswer(newAnswer);
        submitAnswer(currentQid, newAnswer);
      }
    } else {
      setSelectedAnswer(label);
      submitAnswer(currentQid, label);
    }
  };

  const handleSubjectiveChange = (value: string) => {
    if (!currentExam) return;
    const currentQid = currentExam.questionIds[currentQuestionIndex];
    setSubjectiveAnswer(value);
    submitAnswer(currentQid, value);
  };

  const handleSubjectiveScoreChange = useCallback((questionId: string, score: number, maxScore: number) => {
    const clampedScore = Math.max(0, Math.min(maxScore, score));
    setLocalSubjectiveScores((prev) => ({ ...prev, [questionId]: clampedScore }));
    
    if (currentView === 'result' && completedExam) {
      updateSubjectiveScore(completedExam.id, questionId, clampedScore);
    } else {
      submitSubjectiveScore(questionId, clampedScore, maxScore);
    }
  }, [currentView, completedExam?.id, updateSubjectiveScore, submitSubjectiveScore]);

  const handleSubmitExam = useCallback(() => {
    if (!currentExam) return;

    const unanswered = currentExam.questionIds.filter((qid) => !answers[qid]).length;
    if (unanswered > 0) {
      const confirmed = window.confirm(`还有 ${unanswered} 道题未作答，确定要交卷吗？`);
      if (!confirmed) return;
    }

    const hasSubjective = currentExam.questionIds.some((qid) => {
      const q = questions.find((q) => q.id === qid);
      return q?.type === 'subjective';
    });

    if (hasSubjective && currentExam.type !== 'objective') {
      const questionScore = currentExam.totalScore / currentExam.totalQuestions;
      currentExam.questionIds.forEach((qid) => {
        const q = questions.find((q) => q.id === qid);
        if (q?.type === 'subjective' && localSubjectiveScores[qid] === undefined) {
          handleSubjectiveScoreChange(qid, 0, questionScore);
        }
      });
    }

    const result = finishExam();
    if (result) {
      setCompletedExam(result);
      setRankingInfo(getExamRanking(result.userScore));
      addDailyStat(result.totalQuestions, result.correctCount, Math.floor(result.timeSpent / 60));
      setCurrentView('result');
    }
  }, [currentExam, answers, questions, localSubjectiveScores, finishExam, getExamRanking, addDailyStat, handleSubjectiveScoreChange]);

  useEffect(() => {
    handleSubmitExamRef.current = handleSubmitExam;
  }, [handleSubmitExam]);

  const handleJumpToQuestion = (index: number) => {
    if (!currentExam) return;
    useExamStore.setState({ currentQuestionIndex: index });
    setShowAnswerSheet(false);
  };

  const handleViewRecordDetail = (record: ExamRecord) => {
    setCompletedExam(record);
    setRankingInfo(getExamRanking(record.userScore));
    setCurrentView('result');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCompletedExam(null);
    setRankingInfo(null);
  };

  const handleRetry = () => {
    setCurrentView('home');
    setCompletedExam(null);
    setRankingInfo(null);
  };

  const currentQuestion = currentExam
    ? questions.find((q) => q.id === currentExam.questionIds[currentQuestionIndex])
    : null;

  const getQuestionStatus = (index: number) => {
    if (!currentExam) return 'unanswered';
    const qid = currentExam.questionIds[index];
    if (index === currentQuestionIndex) return 'current';
    return answers[qid] ? 'answered' : 'unanswered';
  };

  const getOptionClass = (label: string) => {
    const isSelected = currentQuestion?.type === 'multiple'
      ? selectedAnswer.includes(label)
      : selectedAnswer === label;
    return isSelected ? 'option-card-selected' : 'option-card';
  };

  const calculateTypeStats = () => {
    if (!completedExam) return [];
    const typeScores: Record<string, { correct: number; total: number; score: number; maxScore: number }> = {};

    completedExam.questionIds.forEach((qid) => {
      const q = questions.find((q) => q.id === qid);
      if (!q) return;

      const type = q.type;
      if (!typeScores[type]) {
        typeScores[type] = { correct: 0, total: 0, score: 0, maxScore: 0 };
      }

      const questionScore = completedExam.totalScore / completedExam.totalQuestions;
      typeScores[type].total++;
      typeScores[type].maxScore += questionScore;

      if (type === 'subjective') {
        const subjectiveScore = completedExam.subjectiveScores?.find((s) => s.questionId === qid);
        const score = subjectiveScore?.score || 0;
        typeScores[type].score += score;
        if (score >= questionScore * 0.6) {
          typeScores[type].correct++;
        }
      } else {
        if (completedExam.answers[qid] === q.correctAnswer) {
          typeScores[type].correct++;
          typeScores[type].score += questionScore;
        }
      }
    });

    return Object.entries(typeScores).map(([type, stats]) => ({
      type,
      label: QUESTION_TYPE_MAP[type as keyof typeof QUESTION_TYPE_MAP].label,
      ...stats,
    }));
  };

  if (currentView === 'home') {
    return (
      <div className="space-y-6 stagger-animation">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="累计模考"
            value={stats.totalExams}
            subtitle="次考试"
            icon={FileText}
            gradient="from-primary-500 to-primary-700"
            delay={0}
          />
          <StatCard
            title="平均分"
            value={stats.averageScore}
            subtitle={`总分 ${EXAM_TYPES[0].score}`}
            icon={Award}
            gradient="from-success-500 to-success-700"
            delay={50}
          />
          <StatCard
            title="最高分"
            value={stats.highestScore}
            subtitle="历史最佳"
            icon={Trophy}
            gradient="from-accent-500 to-accent-700"
            delay={100}
          />
          <StatCard
            title="累计用时"
            value={formatDuration(stats.totalTime)}
            subtitle="学习时长"
            icon={Clock}
            gradient="from-purple-500 to-purple-700"
            delay={150}
          />
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Play className="w-5 h-5 text-primary-500" />
            <h3 className="font-serif text-lg font-semibold text-slate-900">开始模考</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAM_TYPES.map((examType, index) => (
              <div
                key={examType.type}
                className="card-hover p-6 cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() =>
                  handleStartExam(
                    examType.type,
                    `2024年法考${examType.name}模拟卷`,
                    examType.questions
                  )
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${examType.gradient} flex items-center justify-center`}>
                    <examType.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-slate-900 mb-2">
                  {examType.name}
                </h4>
                <p className="text-sm text-slate-500 mb-3">{examType.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-600">
                    <Target className="w-4 h-4" />
                    {examType.score}分
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <FileText className="w-4 h-4" />
                    {examType.questions}题
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">通过线</span>
                    <span className="font-medium text-success-600">{PASSING_SCORE}分</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary-500" />
                <h3 className="font-serif text-lg font-semibold text-slate-900">历史模考记录</h3>
              </div>
              <span className="text-sm text-slate-500">共 {examRecords.length} 次</span>
            </div>
            {examRecords.length > 0 ? (
              <div className="space-y-3">
                {examRecords.map((record, index) => (
                  <div
                    key={record.id}
                    onClick={() => handleViewRecordDetail(record)}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.userScore >= PASSING_SCORE ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'
                      }`}>
                        {record.userScore >= PASSING_SCORE ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{record.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className={`badge ${EXAM_TYPE_MAP[record.type].color}`}>
                            {EXAM_TYPE_MAP[record.type].label}
                          </span>
                          <span>{record.totalQuestions}题</span>
                          <span>{formatDuration(record.timeSpent)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {record.ranking && record.totalParticipants && (
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-slate-500">排名</p>
                          <p className="font-medium text-slate-900">
                            {record.ranking} / {record.totalParticipants}
                          </p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-2xl font-serif font-bold text-slate-900">
                          {record.userScore}
                          <span className="text-sm font-normal text-slate-500">/{record.totalScore}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">暂无模考记录</p>
                <p className="text-sm text-slate-400 mt-1">开始你的第一次模考吧！</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h3 className="font-serif text-lg font-semibold text-slate-900">成绩趋势</h3>
            </div>
            {trendData.length > 1 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      domain={[60, 150]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: '#1E293B', fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#4F46E5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">需要至少2次考试记录</p>
                  <p className="text-sm text-slate-400 mt-1">才能生成趋势图</p>
                </div>
              </div>
            )}
            {trendData.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">通过线</span>
                  <span className="font-medium text-success-600">{PASSING_SCORE}分</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'exam' && currentExam) {
    const progress = ((currentQuestionIndex + 1) / currentExam.questionIds.length) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="stagger-animation">
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">
                第 {currentQuestionIndex + 1} / {currentExam.questionIds.length} 题
              </span>
              <span className={`badge ${EXAM_TYPE_MAP[currentExam.type].color}`}>
                {EXAM_TYPE_MAP[currentExam.type].label}
              </span>
              {currentQuestion && (
                <>
                  <span className={`badge ${QUESTION_TYPE_MAP[currentQuestion.type].color}`}>
                    {QUESTION_TYPE_MAP[currentQuestion.type].label}
                  </span>
                  <span className={`badge ${DIFFICULTY_MAP[currentQuestion.difficulty].color}`}>
                    {DIFFICULTY_MAP[currentQuestion.difficulty].label}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 text-sm font-medium ${
                remainingTime < 300 ? 'text-error-600' : 'text-slate-600'
              }`}>
                <Timer className="w-4 h-4" />
                {formatTime(remainingTime)}
              </span>
              <span className="text-sm text-success-600 font-medium">
                已答 {answeredCount}/{currentExam.questionIds.length}
              </span>
              <button
                onClick={() => setShowAnswerSheet(!showAnswerSheet)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                <FileText className="w-4 h-4" />
                答题卡
              </button>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill bg-gradient-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className={`flex-1 transition-all duration-300 ${showAnswerSheet ? 'mr-80' : ''}`}>
            <div className="card p-8">
              {currentQuestion && (
                <>
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentQuestion.knowledgePoints.map((kp) => (
                        <span key={kp} className="badge-slate">
                          {kp}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-serif text-xl text-slate-900 leading-relaxed">
                      {currentQuestion.content}
                    </h3>
                  </div>

                  {currentQuestion.type !== 'subjective' ? (
                    <div className="space-y-3 mb-6">
                      {currentQuestion.options?.map((option) => (
                        <div
                          key={option.label}
                          onClick={() => handleSelectOption(option.label)}
                          className={getOptionClass(option.label)}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                                currentQuestion.type === 'multiple'
                                  ? selectedAnswer.includes(option.label)
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                  : selectedAnswer === option.label
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {option.label}
                            </span>
                            <span className="flex-1 pt-1">{option.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <textarea
                        value={subjectiveAnswer}
                        onChange={(e) => handleSubjectiveChange(e.target.value)}
                        placeholder="请输入你的答案..."
                        className="input min-h-64 resize-y"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={prevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="btn-secondary"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一题
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {currentQuestionIndex + 1} / {currentExam.questionIds.length}
                      </span>
                    </div>
                    {currentQuestionIndex < currentExam.questionIds.length - 1 ? (
                      <button onClick={nextQuestion} className="btn-primary">
                        下一题
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={handleSubmitExam} className="btn-success">
                        <Send className="w-4 h-4" />
                        交卷
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {showAnswerSheet && (
            <div className="fixed right-6 top-24 w-72 card p-4 z-40 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900">答题卡</h4>
                <button
                  onClick={() => setShowAnswerSheet(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <XCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentExam.questionIds.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleJumpToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        status === 'current'
                          ? 'bg-primary-500 text-white ring-2 ring-primary-200'
                          : status === 'answered'
                          ? 'bg-success-100 text-success-700 hover:bg-success-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded bg-success-100" />
                  <span className="text-slate-600">已答</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded bg-slate-100" />
                  <span className="text-slate-600">未答</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded bg-primary-500" />
                  <span className="text-slate-600">当前</span>
                </div>
              </div>
              <button
                onClick={handleSubmitExam}
                className="w-full btn-success mt-4 justify-center"
              >
                <Send className="w-4 h-4" />
                交卷
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'result' && completedExam) {
    const accuracy = completedExam.totalQuestions > 0
      ? (completedExam.correctCount / completedExam.totalQuestions) * 100
      : 0;
    const isPassed = completedExam.userScore >= PASSING_SCORE;
    const typeStats = calculateTypeStats();
    const subjectiveQuestions = completedExam.questionIds
      .map((qid) => questions.find((q) => q.id === qid))
      .filter((q) => q?.type === 'subjective');
    const questionScore = completedExam.totalScore / completedExam.totalQuestions;

    const pieData = [
      { name: '正确', value: completedExam.correctCount, color: '#10B981' },
      { name: '错误', value: completedExam.totalQuestions - completedExam.correctCount, color: '#F43F5E' },
    ];

    return (
      <div className="max-w-5xl mx-auto stagger-animation">
        <div className="card p-8 mb-6 text-center bg-gradient-to-br from-slate-50 to-primary-50/30">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isPassed ? 'bg-success-100' : 'bg-error-100'
          }`}>
            {isPassed ? (
              <Trophy className="w-10 h-10 text-success-500" />
            ) : (
              <AlertCircle className="w-10 h-10 text-error-500" />
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">
            {isPassed ? '恭喜通过！' : '继续加油！'}
          </h2>
          <p className="text-slate-500 mb-6">{completedExam.name}</p>

          <div className="text-6xl font-serif font-bold text-slate-900 mb-2">
            {completedExam.userScore}
            <span className="text-2xl font-normal text-slate-400">/{completedExam.totalScore}</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm text-slate-500">通过线：{PASSING_SCORE}分</span>
            <span className={`text-sm font-medium ${
              isPassed ? 'text-success-600' : 'text-error-600'
            }`}>
              {isPassed ? `+${completedExam.userScore - PASSING_SCORE}分` : `-${PASSING_SCORE - completedExam.userScore}分`}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">正确率</p>
              <p className="text-2xl font-bold text-primary-600">{Math.round(accuracy)}%</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-slate-500 mb-1">用时</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatDuration(completedExam.timeSpent)}
              </p>
            </div>
            {rankingInfo && (
              <>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500 mb-1">排名</p>
                  <p className="text-2xl font-bold text-accent-600">
                    {rankingInfo.ranking}
                    <span className="text-sm font-normal text-slate-400">/{rankingInfo.total}</span>
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-slate-500 mb-1">击败考生</p>
                  <p className="text-2xl font-bold text-success-600">{rankingInfo.percentile}%</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-6">
            <h4 className="font-medium text-slate-900 mb-4">正确率统计</h4>
            <div className="flex justify-center">
              <ProgressRing
                progress={accuracy}
                size={140}
                strokeWidth={10}
                color={isPassed ? '#10B981' : '#F43F5E'}
                label="正确率"
              />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">总题数</span>
                <span className="font-medium text-slate-900">{completedExam.totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">正确</span>
                <span className="font-medium text-success-600">{completedExam.correctCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">错误</span>
                <span className="font-medium text-error-600">
                  {completedExam.totalQuestions - completedExam.correctCount}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-medium text-slate-900 mb-4">答题分布</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-medium text-slate-900 mb-4">排名情况</h4>
            <div className="flex flex-col items-center justify-center h-48">
              {rankingInfo && (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-3xl font-serif font-bold text-slate-900 mb-1">
                    {rankingInfo.percentile}%
                  </p>
                  <p className="text-sm text-slate-500">击败了{rankingInfo.percentile}%的考生</p>
                  <p className="text-xs text-slate-400 mt-2">
                    共 {rankingInfo.total} 人参与本次模考
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <h4 className="font-medium text-slate-900">各题型得分统计</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {typeStats.map((stat) => (
              <div key={stat.type} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${QUESTION_TYPE_MAP[stat.type as keyof typeof QUESTION_TYPE_MAP].color}`}>
                    {stat.label}
                  </span>
                  <span className="text-sm text-slate-500">{stat.total}题</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">得分</span>
                    <span className="font-medium text-slate-900">
                      {Math.round(stat.score * 10) / 10} / {Math.round(stat.maxScore * 10) / 10}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-gradient-primary"
                      style={{ width: `${(stat.score / stat.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-success-600">正确 {stat.correct}</span>
                  <span className="text-error-600">错误 {stat.total - stat.correct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {subjectiveQuestions.length > 0 && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Edit3 className="w-5 h-5 text-orange-500" />
              <h4 className="font-medium text-slate-900">主观题评分</h4>
            </div>
            <div className="space-y-4">
              {subjectiveQuestions.map((q, index) => {
                if (!q) return null;
                const maxScore = questionScore;
                const existingScore = completedExam.subjectiveScores?.find(
                  (s) => s.questionId === q.id
                )?.score;
                const currentScore = localSubjectiveScores[q.id] ?? existingScore ?? 0;

                return (
                  <div key={q.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="badge bg-orange-100 text-orange-700 mb-2">
                          主观题 {index + 1}
                        </span>
                        <p className="text-sm text-slate-700 line-clamp-2">{q.content}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-2xl font-bold text-orange-600">
                          {currentScore.toFixed(1)}
                          <span className="text-sm font-normal text-slate-400">/{maxScore.toFixed(1)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max={maxScore}
                        step="0.5"
                        value={currentScore}
                        onChange={(e) =>
                          handleSubjectiveScoreChange(q.id, parseFloat(e.target.value), maxScore)
                        }
                        className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.5"
                        value={currentScore}
                        onChange={(e) =>
                          handleSubjectiveScoreChange(q.id, parseFloat(e.target.value) || 0, maxScore)
                        }
                        className="w-20 input text-center"
                      />
                    </div>
                    {completedExam.answers[q.id] && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <p className="text-xs text-slate-500 mb-1">你的答案：</p>
                        <p className="text-sm text-slate-700 line-clamp-3">
                          {completedExam.answers[q.id]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button onClick={handleBackToHome} className="btn-secondary px-8">
            <RotateCcw className="w-4 h-4" />
            返回首页
          </button>
          <button onClick={handleRetry} className="btn-primary px-8">
            <Play className="w-4 h-4" />
            再来一次
          </button>
          <button 
            onClick={() => {
              setAnalysisQuestionIndex(0);
              setShowAnalysisModal(true);
            }} 
            className="btn-accent px-8"
          >
            <Eye className="w-4 h-4" />
            查看解析
          </button>
        </div>

        {showAnalysisModal && (() => {
          const analysisQuestion = questions.find(
            (q) => q.id === completedExam.questionIds[analysisQuestionIndex]
          );
          const userAnswer = completedExam.answers[analysisQuestion?.id || ''] || '';
          const isCorrect = analysisQuestion 
            ? analysisQuestion.type === 'subjective'
              ? (completedExam.subjectiveScores?.find((s) => s.questionId === analysisQuestion.id)?.score || 0) >= 
                (completedExam.totalScore / completedExam.totalQuestions) * 0.6
              : userAnswer === analysisQuestion.correctAnswer
            : false;

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-slate-900">
                      第 {analysisQuestionIndex + 1} 题解析
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      共 {completedExam.questionIds.length} 题
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {analysisQuestion && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`badge ${QUESTION_TYPE_MAP[analysisQuestion.type].color}`}>
                          {QUESTION_TYPE_MAP[analysisQuestion.type].label}
                        </span>
                        <span className={`badge ${DIFFICULTY_MAP[analysisQuestion.difficulty].color}`}>
                          {DIFFICULTY_MAP[analysisQuestion.difficulty].label}
                        </span>
                        <span className={`badge ${isCorrect ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                          {isCorrect ? '回答正确' : '回答错误'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {analysisQuestion.knowledgePoints.map((kp) => (
                          <span key={kp} className="badge-slate">
                            {kp}
                          </span>
                        ))}
                      </div>

                      <div className="mb-6">
                        <p className="font-medium text-slate-700 mb-2">题目</p>
                        <p className="text-slate-900 leading-relaxed">{analysisQuestion.content}</p>
                      </div>

                      {analysisQuestion.options && analysisQuestion.type !== 'subjective' && (
                        <div className="mb-6">
                          <p className="font-medium text-slate-700 mb-2">选项</p>
                          <div className="space-y-2">
                            {analysisQuestion.options.map((option) => {
                              const isCorrectOption = analysisQuestion.correctAnswer.includes(option.label);
                              const isUserSelected = userAnswer.includes(option.label);
                              return (
                                <div
                                  key={option.label}
                                  className={`p-3 rounded-lg border ${
                                    isCorrectOption
                                      ? 'border-success-300 bg-success-50'
                                      : isUserSelected
                                      ? 'border-error-300 bg-error-50'
                                      : 'border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                        isCorrectOption
                                          ? 'bg-success-500 text-white'
                                          : isUserSelected
                                          ? 'bg-error-500 text-white'
                                          : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {option.label}
                                    </span>
                                    <span className="flex-1">{option.text}</span>
                                    {isCorrectOption && (
                                      <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                                    )}
                                    {!isCorrectOption && isUserSelected && (
                                      <XCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-700 mb-2">你的答案</p>
                          <p className={`text-lg font-semibold ${isCorrect ? 'text-success-600' : 'text-error-600'}`}>
                            {userAnswer || '未作答'}
                          </p>
                          {analysisQuestion.type === 'subjective' && (
                            <p className="text-sm text-slate-500 mt-1">
                              得分：{completedExam.subjectiveScores?.find((s) => s.questionId === analysisQuestion.id)?.score || 0}
                              / {completedExam.totalScore / completedExam.totalQuestions}
                            </p>
                          )}
                        </div>
                        <div className="p-4 bg-primary-50 rounded-lg">
                          <p className="font-medium text-primary-700 mb-2">正确答案</p>
                          <p className="text-lg font-semibold text-primary-600">
                            {analysisQuestion.correctAnswer}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-lg mb-4">
                        <p className="font-medium text-slate-700 mb-2">答案解析</p>
                        <p className="text-slate-600 leading-relaxed">{analysisQuestion.analysis}</p>
                      </div>

                      <div className="p-4 bg-accent-50 rounded-lg">
                        <p className="font-medium text-accent-700 mb-2">关联法条</p>
                        <p className="text-accent-600">{analysisQuestion.lawReference}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setAnalysisQuestionIndex((i) => Math.max(0, i - 1))}
                    disabled={analysisQuestionIndex === 0}
                    className="btn-secondary"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一题
                  </button>
                  <span className="text-sm text-slate-500">
                    {analysisQuestionIndex + 1} / {completedExam.questionIds.length}
                  </span>
                  <button
                    onClick={() => setAnalysisQuestionIndex((i) => Math.min(completedExam.questionIds.length - 1, i + 1))}
                    disabled={analysisQuestionIndex === completedExam.questionIds.length - 1}
                    className="btn-primary"
                  >
                    下一题
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return null;
}
