import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  XCircle,
  Calendar,
  FileText,
  Timer,
  BarChart3,
  Scale,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/question-bank', label: '题库', icon: BookOpen },
  { path: '/practice', label: '刷题', icon: PenTool },
  { path: '/wrong-questions', label: '错题', icon: XCircle },
  { path: '/plan', label: '计划', icon: Calendar },
  { path: '/notes', label: '笔记', icon: FileText },
  { path: '/exam', label: '模考', icon: Timer },
  { path: '/analysis', label: '分析', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-slate-900">法考智学</h1>
            <p className="text-xs text-slate-500">高效备考，一战成硕</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={active ? 'nav-item-active' : 'nav-item'}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="glass-card p-4 bg-gradient-to-br from-primary-50 to-accent-50">
          <p className="text-sm font-medium text-slate-700">距离考试还有</p>
          <p className="text-2xl font-serif font-bold text-primary-700 mt-1">
            88 <span className="text-sm font-normal text-slate-500">天</span>
          </p>
          <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div className="h-full w-[72%] bg-gradient-accent rounded-full" />
          </div>
          <p className="text-xs text-slate-500 mt-2">已完成 72% 备考进度</p>
        </div>
      </div>
    </aside>
  );
}
