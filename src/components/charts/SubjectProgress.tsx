import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';

export function SubjectProgress() {
  const { subjects } = useQuestionBankStore();

  const data = subjects.map((s) => ({
    name: s.name,
    progress: Math.round((s.completedQuestions / s.totalQuestions) * 100),
    accuracy: Math.round(s.accuracyRate * 100),
    color: s.color,
  }));

  return (
    <div className="card p-6">
      <h3 className="font-serif text-lg font-semibold text-slate-900 mb-4">各科目进度</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">完成进度: {item.progress}%</p>
                      <p className="text-sm text-slate-600">正确率: {item.accuracy}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
