import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '仪表盘', subtitle: '查看你的学习概览和今日任务' },
  '/question-bank': { title: '题库', subtitle: '按科目和章节浏览练习题目' },
  '/practice': { title: '刷题', subtitle: '开始新一轮的题目练习' },
  '/wrong-questions': { title: '错题本', subtitle: '复习错题，攻克薄弱知识点' },
  '/plan': { title: '学习计划', subtitle: '制定和管理你的备考计划' },
  '/notes': { title: '我的笔记', subtitle: '整理和查看你的学习笔记' },
  '/exam': { title: '模考大赛', subtitle: '全真模拟，检验备考成果' },
  '/analysis': { title: '数据分析', subtitle: '深度分析你的学习数据' },
};

export function AppLayout() {
  const location = useLocation();
  const pathKey = Object.keys(pageTitles).find(
    (key) => key === '/' ? location.pathname === '/' : location.pathname.startsWith(key)
  ) || '/';
  const pageInfo = pageTitles[pathKey];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
