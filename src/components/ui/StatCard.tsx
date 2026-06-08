import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  gradient?: string;
  delay?: number;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, gradient = 'from-primary-500 to-primary-700', delay = 0 }: StatCardProps) {
  return (
    <div
      className="card-hover p-6 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-serif font-bold text-slate-900 mt-2 animate-count-up">
            {value}
          </p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.value >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
