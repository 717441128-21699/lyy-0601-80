import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Target, TrendingUp, AlertCircle, Play, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SubjectProgress } from '@/components/charts/SubjectProgress';
import { useUserStore } from '@/store/useUserStore';
import { useWrongQuestionStore } from '@/store/useWrongQuestionStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, todayTasks } = useUserStore();
  const { getTodayReviews, getWeakPoints } = useWrongQuestionStore();
  const { subjects } = useQuestionBankStore();

  const todayReviews = getTodayReviews();
  const weakPoints = getWeakPoints().slice(0, 3);
  
  const completedTasks = todayTasks.filter((t) => t.completed).length;
  const totalProgress = todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 100 : 0;

  const totalQuestions = subjects.reduce((sum, s) => sum + s.totalQuestions, 0);
  const completedQuestions = subjects.reduce((sum, s) => sum + s.completedQuestions, 0);

  return (
    <div className="space-y-6 stagger-animation">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="累计刷题"
          value={profile.totalQuestions.toLocaleString()}
          subtitle="道题目"
          icon={BookOpen}
          trend={{ value: 12, label: '较上周' }}
          gradient="from-primary-500 to-primary-700"
          delay={0}
        />
        <StatCard
          title="正确率"
          value={`${Math.round(profile.accuracyRate * 100)}%`}
          subtitle="总正确率"
          icon={Target}
          trend={{ value: 3, label: '较上周' }}
          gradient="from-success-500 to-success-700"
          delay={50}
        />
        <StatCard
          title="学习天数"
          value={profile.studyDays}
          subtitle="连续坚持"
          icon={Clock}
          gradient="from-accent-500 to-accent-700"
          delay={100}
        />
        <StatCard
          title="今日目标"
          value={`${completedTasks}/${todayTasks.length}`}
          subtitle="任务完成"
          icon={CheckCircle}
          gradient="from-purple-500 to-purple-700"
          delay={150}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-slate-900">今日任务</h3>
              <button
                onClick={() => navigate('/plan')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    task.completed
                      ? 'bg-success-50 border-success-200'
                      : 'bg-white border-slate-200 hover:border-primary-300'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.completed
                        ? 'bg-success-100 text-success-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {task.completedCount}/{task.targetCount} 题
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-32">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            task.completed ? 'bg-success-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${(task.completedCount / task.targetCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {!task.completed && (
                    <button
                      onClick={() => navigate('/practice')}
                      className="btn-primary px-3 py-1.5 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      开始
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <SubjectProgress />
        </div>

        <div className="space-y-6">
          <div className="card p-6 text-center">
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-4">今日进度</h3>
            <ProgressRing progress={totalProgress} label="任务完成" color="#4F46E5" />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">已完成</p>
                <p className="text-xl font-semibold text-success-600">{completedTasks}</p>
              </div>
              <div>
                <p className="text-slate-500">待完成</p>
                <p className="text-xl font-semibold text-accent-600">{todayTasks.length - completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-accent-500" />
              <h3 className="font-serif text-lg font-semibold text-slate-900">复习提醒</h3>
            </div>
            {todayReviews.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  你有 <span className="font-semibold text-accent-600">{todayReviews.length}</span> 道错题需要复习
                </p>
                <button
                  onClick={() => navigate('/wrong-questions')}
                  className="w-full btn-accent justify-center"
                >
                  开始复习
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-success-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">今日复习任务已完成！</p>
              </div>
            )}
          </div>

          {weakPoints.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-error-500" />
                <h3 className="font-serif text-lg font-semibold text-slate-900">薄弱知识点</h3>
              </div>
              <div className="space-y-3">
                {weakPoints.map((wp) => (
                  <div key={wp.chapterId} className="p-3 bg-error-50 rounded-lg border border-error-100">
                    <p className="text-sm font-medium text-slate-900">{wp.chapterName}</p>
                    <p className="text-xs text-slate-500 mt-1">{wp.recommendation}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-error-600 font-medium">
                        错误率 {Math.round(wp.errorRate * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          useQuestionBankStore.getState().setSubject(wp.subjectId);
                          useQuestionBankStore.getState().setChapter(wp.chapterId);
                          navigate('/question-bank');
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        去练习 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50">
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2">学习概览</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">总题量</span>
                <span className="font-medium text-slate-900">{totalQuestions.toLocaleString()} 题</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">已完成</span>
                <span className="font-medium text-success-600">{completedQuestions.toLocaleString()} 题</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">完成率</span>
                <span className="font-medium text-primary-600">
                  {Math.round((completedQuestions / totalQuestions) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
