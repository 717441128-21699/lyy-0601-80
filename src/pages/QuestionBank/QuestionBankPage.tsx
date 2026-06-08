import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, StarOff, ChevronDown, ChevronRight, Filter, Play, BookOpen, Scale, ShieldAlert, Building2, Gavel, FileText, Briefcase, Landmark } from 'lucide-react';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { DIFFICULTY_MAP, QUESTION_TYPE_MAP } from '@/types';

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

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const {
    subjects,
    chapters,
    currentSubject,
    currentChapter,
    searchKeyword,
    filterDifficulty,
    filterType,
    showFavoritesOnly,
    setSubject,
    setChapter,
    setSearchKeyword,
    setFilterDifficulty,
    setFilterType,
    toggleFavoritesOnly,
    toggleFavorite,
    getFilteredQuestions,
  } = useQuestionBankStore();

  const { startSession } = usePracticeStore();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);

  const filteredQuestions = getFilteredQuestions();
  const subjectChapters = currentSubject
    ? chapters.filter((c) => c.subjectId === currentSubject)
    : [];

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const startPractice = () => {
    if (filteredQuestions.length === 0) return;
    const questions = filteredQuestions.slice(0, questionCount);
    startSession(questions, currentChapter ? 'chapter' : 'random', 'single');
    navigate('/practice');
  };

  const currentSubjectData = subjects.find((s) => s.id === currentSubject);
  const IconComponent = currentSubjectData ? iconMap[currentSubjectData.icon] || BookOpen : BookOpen;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 stagger-animation">
      <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">
        <div className="card p-4">
          <h3 className="font-serif font-semibold text-slate-900 mb-3">科目</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSubject(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                !currentSubject
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>全部科目</span>
            </button>
            {subjects.map((subject) => {
              const Icon = iconMap[subject.icon] || BookOpen;
              return (
                <button
                  key={subject.id}
                  onClick={() => setSubject(subject.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    currentSubject === subject.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: subject.color }} />
                  <span className="flex-1">{subject.name}</span>
                  <span className="text-xs text-slate-400">
                    {subject.completedQuestions}/{subject.totalQuestions}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {currentSubject && subjectChapters.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconComponent className="w-4 h-4" style={{ color: currentSubjectData?.color }} />
              <h3 className="font-serif font-semibold text-slate-900">章节</h3>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setChapter(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                  !currentChapter
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>全部章节</span>
              </button>
              {subjectChapters.map((chapter) => (
                <div key={chapter.id}>
                  <button
                    onClick={() => {
                      setChapter(chapter.id);
                      toggleChapter(chapter.id);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                      currentChapter === chapter.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm">{chapter.name}</span>
                    <span className="text-xs text-slate-400">
                      {chapter.completedCount}/{chapter.totalQuestions}
                    </span>
                  </button>
                  {expandedChapters.has(chapter.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      <div className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-slate-500">掌握率</span>
                        <span className="font-medium text-slate-700">
                          {Math.round(chapter.masteryRate * 100)}%
                        </span>
                      </div>
                      <div className="progress-bar mx-3">
                        <div
                          className="progress-fill bg-primary-500"
                          style={{ width: `${chapter.masteryRate * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="card p-4 mb-4">
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
            <button
              onClick={toggleFavoritesOnly}
              className={`btn-secondary gap-2 ${showFavoritesOnly ? 'bg-accent-50 border-accent-300 text-accent-700' : ''}`}
            >
              <Star className="w-4 h-4" />
              {showFavoritesOnly ? '已收藏' : '收藏'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">难度:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterDifficulty(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      !filterDifficulty
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(DIFFICULTY_MAP).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFilterDifficulty(key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        filterDifficulty === key
                          ? value.color
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">题型:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      !filterType
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(QUESTION_TYPE_MAP).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFilterType(key as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        filterType === key
                          ? value.color
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                共 <span className="font-semibold text-primary-600">{filteredQuestions.length}</span> 道题目
              </span>
              {currentSubject && (
                <span className="badge-primary">
                  {currentSubjectData?.name}
                </span>
              )}
              {currentChapter && (
                <span className="badge-accent">
                  {chapters.find((c) => c.id === currentChapter)?.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">练习数量:</span>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="input w-24 py-1.5 text-sm"
                >
                  <option value={10}>10题</option>
                  <option value={20}>20题</option>
                  <option value={30}>30题</option>
                  <option value={50}>50题</option>
                  <option value={100}>100题</option>
                </select>
              </div>
              <button
                onClick={startPractice}
                disabled={filteredQuestions.length === 0}
                className="btn-primary"
              >
                <Play className="w-4 h-4" />
                开始练习
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无符合条件的题目</p>
              <p className="text-sm text-slate-400 mt-1">请调整筛选条件</p>
            </div>
          ) : (
            filteredQuestions.slice(0, 50).map((question, index) => (
              <div
                key={question.id}
                className="card p-4 hover:shadow-card-hover transition-all"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${QUESTION_TYPE_MAP[question.type].color}`}>
                        {QUESTION_TYPE_MAP[question.type].label}
                      </span>
                      <span className={`badge ${DIFFICULTY_MAP[question.difficulty].color}`}>
                        {DIFFICULTY_MAP[question.difficulty].label}
                      </span>
                      {question.knowledgePoints.slice(0, 2).map((kp) => (
                        <span key={kp} className="badge-slate">
                          {kp}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-800 line-clamp-2">{question.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>练习 {question.exerciseCount} 次</span>
                      <span>正确率 {Math.round((question.correctCount / (question.exerciseCount || 1)) * 100)}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(question.id)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    {question.isFavorite ? (
                      <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                    ) : (
                      <StarOff className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
