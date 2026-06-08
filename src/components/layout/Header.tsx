import { Bell, Search, User, Flame } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { profile } = useUserStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h2 className="font-serif text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索题目、知识点..."
            className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-50 rounded-full">
          <Flame className="w-4 h-4 text-accent-500" />
          <span className="text-sm font-medium text-accent-700">{profile.currentStreak} 天连续</span>
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900">{profile.name}</p>
            <p className="text-xs text-slate-500">学习 {profile.studyDays} 天</p>
          </div>
        </div>
      </div>
    </header>
  );
}
