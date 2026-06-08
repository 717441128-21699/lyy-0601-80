import { LucideIcon, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export default function Empty({
  icon: Icon = BookOpen,
  title = '暂无数据',
  description = '这里还没有内容',
  className,
}: EmptyProps) {
  return (
    <div className={cn('card p-12 text-center', className)}>
      <Icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <p className="font-serif text-lg font-medium text-slate-700 mb-2">{title}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
