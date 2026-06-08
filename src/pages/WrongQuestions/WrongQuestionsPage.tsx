import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookX,
  RefreshCw,
  Target,
  CheckCircle,
  Search,
  Filter,
  AlertTriangle,
  ChevronRight,
  Calendar,
  BookOpen,
  Scale,
  ShieldAlert,
  Building2,
  Gavel,
  FileText,
  Briefcase,
  Landmark,
  Play,
  TrendingUp,
} from 'lucide-react';
import { useWrongQuestionStore } from '@/store/useWrongQuestionStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import {
  REASON_TYPES,
  DIFFICULTY_MAP,
  QUESTION_TYPE_MAP,
  ReasonType,
  type WrongQuestion,
  type Question,
} from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import Empty from '@/components/Empty';

const iconMap: Record<string, any> = {
  Scale,
  ShieldAlert,
  Building2,
  Gavel,
  FileText,
  Briefcase,
  Landmark,
  BookOpen,
};

type TabType = 'today' | 'all' | 'weak';

export default function WrongQuestionsPage() {
  const navigate = useNavigate();
  const {
    wrongQuestions,
    getTodayReviews,
    getWeakPoints,
    markAsReviewed,
    markAsMastered,
    updateReason,
  } = useWrongQuestionStore();

  const { subjects, questions, chapters, setSubject, setChapter } =
    useQuestionBankStore();
  const { startSession } = usePracticeStore();

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReasonType | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);

  const todayReviews = getTodayReviews();
  const weakPoints = getWeakPoints();

  const stats = useMemo(() => {
    const total = wrongQuestions.length;
    const today = todayReviews.length;
    const weak = weakPoints.length;
    const mastered = wrongQuestions.filter((wq) => wq.mastered).length;
    return { total, today, weak, mastered };
  }, [wrongQuestions, todayReviews, weakPoints]);

  const getQuestionById = (questionId: string): Question | undefined => {
    return questions.find((q) => q.id === questionId);
  };

  const getSubjectById = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId);
  };

  const filteredWrongQuestions = useMemo(() => {
    let list: WrongQuestion[] = [];

    if (activeTab === 'today') {
      list = todayReviews;
    } else if (activeTab === 'all') {
      list = wrongQuestions.filter((wq) => !wq.mastered);
    }

    if (selectedSubject) {
      list = list.filter((wq) => {
        const q = getQuestionById(wq.questionId);
        return q?.subjectId === selectedSubject;
      });
    }

    if (selectedReason) {
      list = list.filter((wq) => wq.reasonType === selectedReason);
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      list = list.filter((wq) => {
        const q = getQuestionById(wq.questionId);
        if (!q) return false;
        return (
          q.content.toLowerCase().includes(keyword) ||
          q.knowledgePoints.some((kp) => kp.toLowerCase().includes(keyword))
        );
      });
    }

    return list;
  }, [activeTab, todayReviews, wrongQuestions, selectedSubject, selectedReason, searchKeyword, questions]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `已过期 ${Math.abs(diff)} 天`;
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    return `${diff} 天后`;
  };

  const handleReview = (wrongQuestion: WrongQuestion) => {
    const question = getQuestionById(wrongQuestion.questionId);
    if (!question) return;

    startSession([question], 'wrong', 'single');
    navigate('/practice');
  };

  const handleMarkMastered = (id: string) => {
    markAsMastered(id);
  };

  const handleStartWeakPractice = (chapterId: string, subjectId: string) => {
    setSubject(subjectId);
    setChapter(chapterId);
    const chapterQuestions = questions.filter((q) => q.chapterId === chapterId);
    if (chapterQuestions.length === 0) return;

    const practiceQuestions = chapterQuestions.slice(0, 20);
    startSession(practiceQuestions, 'chapter', 'single');
    navigate('/practice');
  };

  const getReasonBadge = (wrongQuestion: WrongQuestion) => {
    const reason = REASON_TYPES.find((r) => r.value === wrongQuestion.reasonType);
    if (!reason) return null;

    const colorMap: Record<string, string> = {
      concept: 'bg-blue-100 text-blue-700',
      law: 'bg-purple-100 text-purple-700',
      review: 'bg-orange-100 text-orange-700',
      careless: 'bg-yellow-100 text-yellow-700',
      other: 'bg-gray-100 text-gray-700',
    };

    const isEditing = editingReasonId === wrongQuestion.id;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <select
            value={wrongQuestion.reasonType}
            onChange={(e) => {
              updateReason(wrongQuestion.id, e.target.value as ReasonType);
              setEditingReasonId(null);
            }}
            onBlur={() => setEditingReasonId(null)}
            autoFocus
            className="badge border-0 bg-slate-100 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {REASON_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <button
        onClick={() => setEditingReasonId(wrongQuestion.id)}
        className={`badge ${colorMap[wrongQuestion.reasonType] || 'bg-slate-100 text-slate-700'} hover:opacity-80 transition-opacity cursor-pointer`}
        title="点击修改错误原因"
      >
        {reason.label}
        <ChevronRight className="w-3 h-3 ml-0.5" />
      </button>
    );
  };

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate >= 0.6) return 'text-error-600';
    if (errorRate >= 0.4) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getErrorRateBg = (errorRate: number) => {
    if (errorRate >= 0.6) return 'bg-error-500';
    if (errorRate >= 0.4) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-animation">
        <StatCard
          title="总错题数"
          value={stats.total}
          subtitle="累计做错的题目"
          icon={BookX}
          gradient="from-error-500 to-error-700"
          delay={0}
        />
        <StatCard
          title="今日待复习"
          value={stats.today}
          subtitle="需要复习的题目"
          icon={RefreshCw}
          gradient="from-primary-500 to-primary-700"
          trend={{ value: 12, label: '较昨日' }}
          delay={50}
        />
        <StatCard
          title="薄弱知识点"
          value={stats.weak}
          subtitle="需要加强的章节"
          icon={Target}
          gradient="from-orange-500 to-orange-700"
          delay={100}
        />
        <StatCard
          title="已掌握错题"
          value={stats.mastered}
          subtitle="连续答对3次以上"
          icon={CheckCircle}
          gradient="from-success-500 to-success-700"
          trend={{ value: 8, label: '较上周' }}
          delay={150}
        />
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索题目、知识点..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary gap-2 ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-slate-600 font-medium">科目:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedSubject(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !selectedSubject
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部科目
                </button>
                {subjects.map((subject) => {
                  const Icon = iconMap[subject.icon] || BookOpen;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedSubject === subject.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" style={{ color: subject.color }} />
                      {subject.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-slate-600 font-medium">错误原因:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedReason(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !selectedReason
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  全部原因
                </button>
                {REASON_TYPES.map((reason) => {
                  const colorMap: Record<string, string> = {
                    concept: 'bg-blue-100 text-blue-700',
                    law: 'bg-purple-100 text-purple-700',
                    review: 'bg-orange-100 text-orange-700',
                    careless: 'bg-yellow-100 text-yellow-700',
                    other: 'bg-gray-100 text-gray-700',
                  };
                  const activeColor = colorMap[reason.value] || 'bg-slate-100 text-slate-700';

                  return (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedReason === reason.value
                          ? activeColor
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {reason.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-2">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'today'
                ? 'bg-gradient-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            今日待复习
            {stats.today > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'today' ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
              }`}>
                {stats.today}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-gradient-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookX className="w-4 h-4" />
            全部错题
          </button>
          <button
            onClick={() => setActiveTab('weak')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'weak'
                ? 'bg-gradient-primary text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            薄弱知识点
            {stats.weak > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'weak' ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
              }`}>
                {stats.weak}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'weak' ? (
          <div className="space-y-4 stagger-animation">
            {weakPoints.length === 0 ? (
              <Empty
                icon={CheckCircle}
                title="暂无薄弱知识点"
                description="继续保持，你的知识掌握情况良好"
              />
            ) : (
              weakPoints.map((wp, index) => {
                const subject = getSubjectById(wp.subjectId);
                const IconComponent = subject ? iconMap[subject.icon] || BookOpen : BookOpen;

                return (
                  <div
                    key={wp.chapterId}
                    className="card p-5 hover:shadow-card-hover transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${subject?.color}15` }}
                          >
                            <IconComponent
                              className="w-5 h-5"
                              style={{ color: subject?.color }}
                            />
                          </div>
                          <div>
                            <h3 className="font-serif font-semibold text-slate-900">
                              {wp.chapterName}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {subject?.name} · 错误 {wp.wrongCount}/{wp.totalCount} 题
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`w-4 h-4 ${getErrorRateColor(wp.errorRate)}`} />
                            <span className={`text-lg font-bold ${getErrorRateColor(wp.errorRate)}`}>
                              {Math.round(wp.errorRate * 100)}%
                            </span>
                            <span className="text-sm text-slate-500">错误率</span>
                          </div>
                          <div className="flex-1 max-w-48">
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${getErrorRateBg(wp.errorRate)}`}
                                style={{ width: `${wp.errorRate * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">建议：</span>
                            {wp.recommendation}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {wp.knowledgePoints.slice(0, 4).map((kp) => (
                            <span key={kp} className="badge-slate">
                              {kp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartWeakPractice(wp.chapterId, wp.subjectId)}
                        className="btn-primary flex-shrink-0"
                      >
                        <Play className="w-4 h-4" />
                        开始练习
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3 stagger-animation">
            {filteredWrongQuestions.length === 0 ? (
              <Empty
                icon={BookX}
                title={activeTab === 'today' ? '今日没有待复习的错题' : '暂无错题记录'}
                description={activeTab === 'today' ? '继续保持，或者去练习更多题目' : '开始做题，错题会自动记录在这里'}
              />
            ) : (
              filteredWrongQuestions.map((wrongQuestion, index) => {
                const question = getQuestionById(wrongQuestion.questionId);
                if (!question) return null;

                const subject = getSubjectById(question.subjectId);
                const chapter = chapters.find((c) => c.id === question.chapterId);
                const isOverdue = new Date(wrongQuestion.nextReviewAt) < new Date();

                return (
                  <div
                    key={wrongQuestion.id}
                    className="card p-4 hover:shadow-card-hover transition-all"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge ${QUESTION_TYPE_MAP[question.type].color}`}>
                            {QUESTION_TYPE_MAP[question.type].label}
                          </span>
                          <span className={`badge ${DIFFICULTY_MAP[question.difficulty].color}`}>
                            {DIFFICULTY_MAP[question.difficulty].label}
                          </span>
                          {getReasonBadge(wrongQuestion)}
                          {subject && (
                            <span className="badge-primary">
                              {subject.name}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-800 line-clamp-2 mb-3">
                          {question.content}
                        </p>

                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                          {chapter && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {chapter.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-error-500" />
                            错误 {wrongQuestion.reviewCount + 1} 次
                          </span>
                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue ? 'text-error-600 font-medium' : ''
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            下次复习：{formatDate(wrongQuestion.nextReviewAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleMarkMastered(wrongQuestion.id)}
                          className="btn-secondary gap-1.5 text-xs px-3 py-1.5"
                          title="标记为已掌握"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          已掌握
                        </button>
                        <button
                          onClick={() => handleReview(wrongQuestion)}
                          className="btn-primary gap-1.5 text-xs px-3 py-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          复习
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
