import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Target,
  Clock,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import Empty from '@/components/Empty';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useWrongQuestionStore } from '@/store/useWrongQuestionStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import type { HeatmapData, RadarData, ReasonType } from '@/types';
import { REASON_TYPES } from '@/types';
import { cn } from '@/lib/utils';

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    getOverviewStats,
    getDailyStats,
    getRadarData,
    getHeatmapData,
    getSubjectAccuracy,
    getScoreTrend,
  } = useAnalysisStore();
  const { getWeakPoints, getReasonStats } = useWrongQuestionStore();
  const { subjects, setSubject, setChapter } = useQuestionBankStore();
  usePracticeStore();

  const overviewStats = getOverviewStats();
  const dailyStats = getDailyStats();
  const radarData = getRadarData();
  const subjectAccuracy = getSubjectAccuracy().map((item) => ({
    ...item,
    accuracyRate: Math.round(item.accuracyRate * 100),
  }));
  const weakPoints = getWeakPoints().slice(0, 10);
  const scoreTrend = getScoreTrend();
  const reasonStats = getReasonStats();

  const reasonPieData = useMemo(() => {
    const colorMap: Record<ReasonType, string> = {
      concept: '#3B82F6',
      law: '#8B5CF6',
      review: '#F97316',
      careless: '#EAB308',
      other: '#6B7280',
    };
    
    return reasonStats.map((item) => {
      const reason = REASON_TYPES.find((r) => r.value === item.reason);
      return {
        name: reason?.label || item.reason,
        value: item.count,
        percentage: Math.round(item.percentage * 100),
        color: colorMap[item.reason] || '#6B7280',
      };
    });
  }, [reasonStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleRadarClick = (data: RadarData) => {
    setSelectedSubject(selectedSubject === data.subjectId ? null : data.subjectId);
  };

  const handleSubjectFilter = (subjectId: string | null) => {
    setSelectedSubject(subjectId);
  };

  const handleGoToPractice = (subjectId: string, chapterId: string) => {
    setSubject(subjectId);
    setChapter(chapterId);
    navigate('/practice');
  };

  const trendData = useMemo(() => {
    const last30Days = dailyStats.slice(-30);
    const examTrend = scoreTrend.filter((t) => t.type === 'exam');

    const merged = last30Days.map((day) => {
      const date = day.date.slice(5);
      const exam = examTrend.find((e) => e.date === day.date);
      return {
        date,
        daily: Math.round(day.accuracyRate * 100),
        exam: exam ? exam.score : null,
      };
    });

    return merged;
  }, [dailyStats, scoreTrend]);

  const heatmapData = useMemo(() => {
    const data = getHeatmapData(selectedSubject || undefined);
    const grouped: Record<string, HeatmapData[]> = {};

    data.forEach((item) => {
      if (!grouped[item.subjectId]) {
        grouped[item.subjectId] = [];
      }
      grouped[item.subjectId].push(item);
    });

    return grouped;
  }, [getHeatmapData, selectedSubject]);

  const getHeatmapColor = (masteryRate: number) => {
    if (masteryRate >= 0.8) return 'bg-success-500';
    if (masteryRate >= 0.6) return 'bg-success-400';
    if (masteryRate >= 0.4) return 'bg-success-300';
    if (masteryRate >= 0.2) return 'bg-success-200';
    return 'bg-success-100';
  };

  const getTextColor = (masteryRate: number) => {
    return masteryRate >= 0.6 ? 'text-white' : 'text-slate-700';
  };

  const subjectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [subjects]);

  const allSubjectIds = useMemo(() => {
    return Object.keys(heatmapData).sort((a, b) => {
      const indexA = subjects.findIndex((s) => s.id === a);
      const indexB = subjects.findIndex((s) => s.id === b);
      return indexA - indexB;
    });
  }, [heatmapData, subjects]);

  const maxChapters = useMemo(() => {
    return Math.max(...Object.values(heatmapData).map((arr) => arr.length), 0);
  }, [heatmapData]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}分${secs}秒` : `${minutes}分钟`;
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div className="space-y-6 stagger-animation">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">学习分析</h1>
          <p className="text-sm text-slate-500 mt-1">全面了解你的学习情况，精准提升薄弱环节</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-secondary"
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="累计做题"
          value={overviewStats.totalQuestions.toLocaleString()}
          subtitle="道题目"
          icon={BookOpen}
          gradient="from-primary-500 to-primary-700"
          delay={0}
        />
        <StatCard
          title="正确率"
          value={`${Math.round(overviewStats.accuracyRate * 100)}%`}
          subtitle="总正确率"
          icon={Target}
          trend={{ value: 3, label: '较上周' }}
          gradient="from-success-500 to-success-700"
          delay={50}
        />
        <StatCard
          title="平均用时"
          value={formatTime(overviewStats.avgTimePerQuestion)}
          subtitle="每题平均"
          icon={Clock}
          gradient="from-accent-500 to-accent-700"
          delay={100}
        />
        <StatCard
          title="薄弱知识点"
          value={overviewStats.weakPointCount}
          subtitle="个待加强"
          icon={AlertTriangle}
          gradient="from-error-500 to-error-700"
          delay={150}
        />
        <StatCard
          title="累计学习"
          value={formatStudyTime(overviewStats.totalStudyTime)}
          subtitle="总时长"
          icon={Calendar}
          gradient="from-purple-500 to-purple-700"
          delay={200}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-slate-900">成绩趋势</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-primary-500" />
                日常练习
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-accent-500" />
                模考得分
              </span>
            </div>
          </div>
          <div className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(trendData.length / 6)}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-medium text-slate-900 text-sm">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.dataKey === 'daily' ? '日常正确率' : '模考得分率'}:{' '}
                                {entry.value !== null ? `${entry.value}%` : '暂无数据'}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="daily"
                    name="日常练习正确率"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                    animationDuration={800}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="exam"
                    name="模考得分率"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#F59E0B' }}
                    activeDot={{ r: 6 }}
                    isAnimationActive
                    animationDuration={800}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty title="暂无数据" description="开始练习后这里会显示你的成绩趋势" />
            )}
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-slate-900">科目掌握度</h3>
            <button
              onClick={() => handleSubjectFilter(null)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              重置筛选
            </button>
          </div>
          <div className="h-64">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, cursor: 'pointer' }}
                    onClick={(data) => handleRadarClick(data as RadarData)}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="掌握程度"
                    dataKey="score"
                    stroke="#6366F1"
                    fill="#6366F1"
                    fillOpacity={0.3}
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={800}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as RadarData;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-medium text-slate-900">{data.subject}</p>
                            <p className="text-sm text-slate-600">掌握度: {data.score}%</p>
                            <p className="text-xs text-primary-600 mt-1">点击可筛选下方热力图</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Empty title="暂无数据" description="完成练习后这里会显示各科目掌握情况" />
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-lg font-semibold text-slate-900">知识点掌握热力图</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3 h-3" />
              <span>颜色越深表示掌握越好</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">筛选科目:</span>
            <select
              value={selectedSubject || ''}
              onChange={(e) => handleSubjectFilter(e.target.value || null)}
              className="input w-auto py-1.5 text-sm"
            >
              <option value="">全部科目</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {allSubjectIds.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div
              className="grid gap-1 min-w-max"
              style={{
                gridTemplateColumns: `80px repeat(${allSubjectIds.length}, 140px)`,
              }}
            >
              <div className="flex items-end justify-center pb-2 text-xs text-slate-500 font-medium">
                章节
              </div>
              {allSubjectIds.map((subjectId) => (
                <div
                  key={subjectId}
                  className={cn(
                    'flex items-center justify-center pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer',
                    selectedSubject === subjectId
                      ? 'text-primary-600 border-primary-500'
                      : 'text-slate-600 border-transparent hover:text-primary-600'
                  )}
                  onClick={() => handleSubjectFilter(selectedSubject === subjectId ? null : subjectId)}
                >
                  {subjectNameMap[subjectId] || subjectId}
                </div>
              ))}

              {Array.from({ length: maxChapters }).map((_, chapterIndex) => (
                <>
                  <div
                    key={`label-${chapterIndex}`}
                    className="flex items-center text-xs text-slate-500 pr-2"
                  >
                    第{chapterIndex + 1}章
                  </div>
                  {allSubjectIds.map((subjectId) => {
                    const chapters = heatmapData[subjectId] || [];
                    const chapter = chapters[chapterIndex];

                    if (!chapter) {
                      return (
                        <div
                          key={`${subjectId}-${chapterIndex}`}
                          className="h-16 rounded bg-slate-50"
                        />
                      );
                    }

                    return (
                      <div
                        key={`${subjectId}-${chapterIndex}`}
                        className={cn(
                          'h-16 rounded p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md',
                          getHeatmapColor(chapter.masteryRate),
                          getTextColor(chapter.masteryRate)
                        )}
                        title={`${chapter.chapterName}\n掌握率: ${Math.round(chapter.masteryRate * 100)}%\n题量: ${chapter.questionCount}题`}
                        onClick={() =>
                          handleGoToPractice(chapter.subjectId, chapter.chapterId)
                        }
                      >
                        <span className="text-xs font-medium truncate w-full text-center">
                          {chapter.chapterName}
                        </span>
                        <span className="text-xs font-bold mt-1">
                          {Math.round(chapter.masteryRate * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
              <span>掌握度:</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-success-100" />
                <span>20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-success-200" />
                <span>40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-success-300" />
                <span>60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-success-400" />
                <span>80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 rounded bg-success-500" />
                <span>100%</span>
              </div>
            </div>
          </div>
        ) : (
          <Empty title="暂无数据" description="完成练习后这里会显示知识点掌握情况" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <h3 className="font-serif text-lg font-semibold text-slate-900">各科目正确率</h3>
          </div>
          <div className="h-80">
            {subjectAccuracy.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectAccuracy}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <YAxis
                    dataKey="subject"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-medium text-slate-900">{item.subject}</p>
                            <p className="text-sm text-slate-600">
                              正确率: {item.accuracyRate}%
                            </p>
                            <p
                              className={cn(
                                'text-xs mt-1',
                                item.accuracyRate >= 60
                                  ? 'text-success-600'
                                  : 'text-error-600'
                              )}
                            >
                              {item.accuracyRate >= 60 ? '✓ 已达及格线' : '✗ 低于及格线'}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={60} stroke="#EF4444" strokeDasharray="5 5" />
                  <Bar
                    dataKey="accuracyRate"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive
                    animationDuration={800}
                    label={{
                      position: 'right',
                      fontSize: 11,
                      formatter: (value: number) => `${value}%`,
                    }}
                  >
                    {subjectAccuracy.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.accuracyRate >= 60 ? entry.color : '#FCA5A5'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty title="暂无数据" description="完成练习后这里会显示各科目正确率" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
            <span className="w-8 h-0.5 bg-error-500" style={{ borderStyle: 'dashed' }} />
            <span>60%及格线</span>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '420ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-serif text-lg font-semibold text-slate-900">错误原因统计</h3>
          </div>
          <div className="h-80">
            {reasonPieData.length > 0 && reasonPieData.some(d => d.value > 0) ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reasonPieData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        labelLine={true}
                      >
                        {reasonPieData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                                <p className="font-medium text-slate-900">{item.name}</p>
                                <p className="text-sm text-slate-600">
                                  {item.value} 题 ({item.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {reasonPieData.filter(d => d.value > 0).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-900">{item.value}题</span>
                        <span className="text-xs text-slate-500 ml-2">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Empty
                  icon={CheckCircle}
                  title="暂无数据"
                  description="完成练习后这里会显示错误原因统计"
                  className="border-0 shadow-none bg-transparent"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 animate-slide-up" style={{ animationDelay: '450ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-error-500" />
          <h3 className="font-serif text-lg font-semibold text-slate-900">薄弱知识点排行</h3>
        </div>
        <div className="h-80 overflow-y-auto space-y-3 pr-2">
          {weakPoints.length > 0 ? (
            weakPoints.map((wp, index) => (
              <div
                key={wp.chapterId}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:border-error-300 hover:bg-error-50/50 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                          index < 3
                            ? 'bg-gradient-to-br from-error-500 to-error-700'
                            : 'bg-slate-400'
                        )}
                      >
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-slate-900 truncate">
                        {wp.chapterName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-8">
                      {wp.recommendation}
                    </p>
                    <div className="mt-2 ml-8">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-error-600 font-medium">
                          错误率 {Math.round(wp.errorRate * 100)}%
                        </span>
                        <span className="text-slate-500">
                          错{wp.wrongCount}题 / 共{wp.totalCount}题
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            wp.errorRate >= 0.6
                              ? 'bg-gradient-to-r from-error-400 to-error-600'
                              : wp.errorRate >= 0.4
                              ? 'bg-gradient-to-r from-accent-400 to-accent-600'
                              : 'bg-gradient-to-r from-slate-400 to-slate-500'
                          )}
                          style={{ width: `${wp.errorRate * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGoToPractice(wp.subjectId, wp.chapterId)}
                    className="btn-primary px-3 py-1.5 text-sm whitespace-nowrap"
                  >
                    去练习
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center">
              <Empty
                icon={CheckCircle}
                title="太棒了！"
                description="目前没有薄弱知识点，继续保持！"
                className="border-0 shadow-none bg-transparent"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
