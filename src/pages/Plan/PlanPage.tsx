import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Target,
  BookOpen,
  RefreshCw,
  FileText,
  CheckCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Flame,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useUserStore } from '@/store/useUserStore';
import { useWrongQuestionStore } from '@/store/useWrongQuestionStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { StudyPlanTask, Subject, Chapter } from '@/types';

const TASK_TYPE_CONFIG = {
  practice: {
    icon: BookOpen,
    label: '练习',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    borderColor: 'border-primary-200',
    gradient: 'from-primary-500 to-primary-700',
  },
  review: {
    icon: RefreshCw,
    label: '复习',
    color: 'text-accent-600',
    bgColor: 'bg-accent-100',
    borderColor: 'border-accent-200',
    gradient: 'from-accent-500 to-accent-700',
  },
  note: {
    icon: FileText,
    label: '笔记',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    gradient: 'from-purple-500 to-purple-700',
  },
};

export default function PlanPage() {
  const navigate = useNavigate();
  const { profile, todayTasks, addTask, completeTask, updateTaskProgress } = useUserStore();
  const { getTodayReviews, getWeakPoints } = useWrongQuestionStore();
  const { subjects, chapters, getFilteredQuestions, setSubject, setChapter } = useQuestionBankStore();
  const { startSession } = usePracticeStore();
  const { getDailyStats } = useAnalysisStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'practice' as StudyPlanTask['type'],
    targetCount: 20,
    relatedSubject: '',
    relatedChapter: '',
  });

  const todayReviews = getTodayReviews();
  const weakPoints = getWeakPoints().slice(0, 3);
  const dailyStats = getDailyStats();

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const filteredTasks = useMemo(() => {
    const dateStr = formatDate(selectedDate);
    return todayTasks.filter((t) => t.date === dateStr);
  }, [todayTasks, selectedDate]);

  const completedTasks = filteredTasks.filter((t) => t.completed).length;
  const totalProgress = filteredTasks.length > 0 ? (completedTasks / filteredTasks.length) * 100 : 0;

  const todayQuestions = useMemo(() => {
    const todayStr = formatDate(new Date());
    const todayStat = dailyStats.find((d) => d.date === todayStr);
    return todayStat?.questionCount || 0;
  }, [dailyStats]);

  const todayStudyTime = useMemo(() => {
    const todayStr = formatDate(new Date());
    const todayStat = dailyStats.find((d) => d.date === todayStr);
    return todayStat?.studyTime || 0;
  }, [dailyStats]);

  const weekHeatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const stat = dailyStats.find((d) => d.date === dateStr);
      
      let intensity = 0;
      if (stat) {
        if (stat.questionCount >= 100) intensity = 4;
        else if (stat.questionCount >= 60) intensity = 3;
        else if (stat.questionCount >= 30) intensity = 2;
        else if (stat.questionCount > 0) intensity = 1;
      }
      
      data.push({
        day: weekdays[date.getDay()],
        date: dateStr,
        count: stat?.questionCount || 0,
        intensity,
      });
    }
    return data;
  }, [dailyStats]);

  const getHeatmapColor = (intensity: number) => {
    const colors = ['#E2E8F0', '#C7D2FE', '#818CF8', '#6366F1', '#4F46E5'];
    return colors[intensity];
  };

  const filteredChapters = useMemo(() => {
    if (!newTask.relatedSubject) return [];
    return chapters.filter((c) => c.subjectId === newTask.relatedSubject);
  }, [chapters, newTask.relatedSubject]);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    addTask({
      title: newTask.title,
      type: newTask.type,
      targetCount: newTask.targetCount,
      completedCount: 0,
      relatedSubject: newTask.relatedSubject || undefined,
      relatedChapter: newTask.relatedChapter || undefined,
      date: formatDate(selectedDate),
    });
    
    setShowAddModal(false);
    setNewTask({
      title: '',
      type: 'practice',
      targetCount: 20,
      relatedSubject: '',
      relatedChapter: '',
    });
  };

  const handleStartTask = (task: StudyPlanTask) => {
    if (task.relatedSubject) {
      setSubject(task.relatedSubject);
      if (task.relatedChapter) {
        setChapter(task.relatedChapter);
      }
    }
    
    const questions = getFilteredQuestions().slice(0, task.targetCount);
    
    if (task.type === 'review') {
      const wrongQuestionIds = getTodayReviews().map((wq) => wq.questionId);
      const wrongQuestions = useQuestionBankStore.getState().questions.filter((q) =>
        wrongQuestionIds.includes(q.id)
      );
      if (wrongQuestions.length > 0) {
        startSession(wrongQuestions.slice(0, task.targetCount), 'wrong', 'single');
        navigate('/practice');
        return;
      }
    }
    
    if (questions.length > 0) {
      startSession(questions, task.type === 'review' ? 'wrong' : 'practice', 'single');
      navigate('/practice');
    }
  };

  const handleAddRecommendedTask = (type: 'review' | 'practice', title: string, subjectId?: string, chapterId?: string) => {
    addTask({
      title,
      type,
      targetCount: type === 'review' ? todayReviews.length : 30,
      completedCount: 0,
      relatedSubject: subjectId,
      relatedChapter: chapterId,
      date: formatDate(selectedDate),
    });
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return '';
    return subjects.find((s) => s.id === subjectId)?.name || '';
  };

  const getChapterName = (chapterId?: string) => {
    if (!chapterId) return '';
    return chapters.find((c) => c.id === chapterId)?.name || '';
  };

  return (
    <div className="space-y-6 stagger-animation">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 text-center">
          <h3 className="text-sm text-slate-500 mb-4">今日完成进度</h3>
          <ProgressRing progress={totalProgress} label="任务完成" color="#4F46E5" />
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">已完成</p>
              <p className="text-xl font-semibold text-success-600">{completedTasks}</p>
            </div>
            <div>
              <p className="text-slate-500">待完成</p>
              <p className="text-xl font-semibold text-accent-600">{filteredTasks.length - completedTasks}</p>
            </div>
          </div>
        </div>

        <StatCard
          title="今日已做题数"
          value={todayQuestions}
          subtitle="道题目"
          icon={Target}
          trend={{ value: 15, label: '较昨日' }}
          gradient="from-primary-500 to-primary-700"
          delay={50}
        />

        <StatCard
          title="累计学习天数"
          value={profile.studyDays}
          subtitle={`连续 ${profile.currentStreak} 天`}
          icon={Flame}
          gradient="from-accent-500 to-accent-700"
          delay={100}
        />

        <StatCard
          title="今日学习时长"
          value={`${Math.floor(todayStudyTime / 60)}h${todayStudyTime % 60}m`}
          subtitle="有效学习"
          icon={Clock}
          trend={{ value: 8, label: '较昨日' }}
          gradient="from-success-500 to-success-700"
          delay={150}
        />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeDate(-1)}
              className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-primary-700">{formatDisplayDate(selectedDate)}</span>
            </div>
            
            <button
              onClick={() => changeDate(1)}
              className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            添加任务
          </button>
        </div>

        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => {
              const config = TASK_TYPE_CONFIG[task.type];
              const TaskIcon = config.icon;
              const progress = task.targetCount > 0 ? (task.completedCount / task.targetCount) * 100 : 0;
              
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    task.completed
                      ? 'bg-success-50 border-success-200'
                      : 'bg-white border-slate-200 hover:border-primary-300'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <TaskIcon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      <span className={`badge ${task.type === 'practice' ? 'badge-primary' : task.type === 'review' ? 'badge-accent' : 'badge-slate'}`}>
                        {config.label}
                      </span>
                      {task.relatedSubject && (
                        <span className="text-xs text-slate-500">
                          {getSubjectName(task.relatedSubject)}
                          {task.relatedChapter && ` · ${getChapterName(task.relatedChapter)}`}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-slate-500">
                        {task.completedCount}/{task.targetCount} 题
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            task.completed ? 'bg-success-500' : `bg-gradient-to-r ${config.gradient}`
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {task.completed ? (
                    <div className="flex items-center gap-2 text-success-600">
                      <CheckCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">已完成</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartTask(task)}
                      className={`btn ${task.type === 'practice' ? 'btn-primary' : task.type === 'review' ? 'btn-accent' : 'btn-secondary'} px-4 py-2`}
                    >
                      <Play className="w-4 h-4" />
                      开始
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">暂无学习任务</p>
              <p className="text-sm text-slate-400">点击"添加任务"创建今日学习计划</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-serif text-lg font-semibold text-slate-900">智能推荐</h3>
          </div>
          
          <div className="space-y-4">
            {todayReviews.length > 0 && (
              <div className="p-4 bg-accent-50 rounded-lg border border-accent-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">错题复习</p>
                      <p className="text-sm text-slate-600 mt-1">
                        你有 <span className="font-semibold text-accent-600">{todayReviews.length}</span> 道错题需要复习巩固
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddRecommendedTask('review', `复习 ${todayReviews.length} 道错题`)}
                    className="btn-accent px-3 py-1.5 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>
            )}
            
            {weakPoints.map((wp) => (
              <div key={wp.chapterId} className="p-4 bg-error-50 rounded-lg border border-error-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-error-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-error-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{wp.chapterName}</p>
                      <p className="text-sm text-slate-600 mt-1">{wp.recommendation}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-error-600 font-medium">
                          错误率 {Math.round(wp.errorRate * 100)}%
                        </span>
                        <span className="text-xs text-slate-500">
                          {getSubjectName(wp.subjectId)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddRecommendedTask('practice', `加强练习：${wp.chapterName}`, wp.subjectId, wp.chapterId)}
                    className="btn-primary px-3 py-1.5 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              </div>
            ))}
            
            {todayReviews.length === 0 && weakPoints.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-success-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">太棒了！暂无需要加强的内容</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-accent-600" />
            <h3 className="font-serif text-lg font-semibold text-slate-900">本周学习热力图</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekHeatmapData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                          <p className="text-sm font-medium text-slate-900">{data.date}</p>
                          <p className="text-sm text-slate-600">
                            做题 <span className="font-semibold text-primary-600">{data.count}</span> 道
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {weekHeatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.intensity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-slate-500">学习强度</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: getHeatmapColor(level) }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">高</span>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-serif text-xl font-semibold text-slate-900">添加学习任务</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  任务标题
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入任务标题"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  任务类型
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(TASK_TYPE_CONFIG) as Array<keyof typeof TASK_TYPE_CONFIG>).map((type) => {
                    const config = TASK_TYPE_CONFIG[type];
                    const TypeIcon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, type })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newTask.type === type
                            ? `border-primary-500 bg-primary-50`
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <TypeIcon className={`w-6 h-6 mx-auto mb-2 ${newTask.type === type ? 'text-primary-600' : 'text-slate-500'}`} />
                        <p className={`text-sm font-medium ${newTask.type === type ? 'text-primary-700' : 'text-slate-700'}`}>
                          {config.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  目标数量
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={newTask.targetCount}
                    onChange={(e) => setNewTask({ ...newTask, targetCount: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-serif font-bold text-primary-600">{newTask.targetCount}</span>
                    <span className="text-sm text-slate-500 ml-1">题</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  关联科目
                </label>
                <select
                  className="input"
                  value={newTask.relatedSubject}
                  onChange={(e) => setNewTask({ ...newTask, relatedSubject: e.target.value, relatedChapter: '' })}
                >
                  <option value="">请选择科目（可选）</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {newTask.relatedSubject && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    关联章节
                  </label>
                  <select
                    className="input"
                    value={newTask.relatedChapter}
                    onChange={(e) => setNewTask({ ...newTask, relatedChapter: e.target.value })}
                  >
                    <option value="">请选择章节（可选）</option>
                    {filteredChapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
                className="btn-primary flex-1"
              >
                添加任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
