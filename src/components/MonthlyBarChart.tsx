import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Transaction } from '../types'

interface MonthlyBarChartProps {
  transactions: Transaction[]
}

export function MonthlyBarChart({ transactions }: MonthlyBarChartProps) {
  // 計算最近6個月的收支
  const getMonthlyData = () => {
    const monthlyMap: Record<string, { income: number; expense: number }> = {}

    // 初始化最近6個月
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = { income: 0, expense: 0 }
    }

    // 填入資料
    transactions.forEach(t => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap[key]) {
        if (t.type === 'income') {
          monthlyMap[key].income += t.amount
        } else {
          monthlyMap[key].expense += t.amount
        }
      }
    })

    return Object.entries(monthlyMap).map(([month, data]) => ({
      month: month.slice(5), // 只顯示月份
      收入: data.income,
      支出: data.expense
    }))
  }

  const data = getMonthlyData()

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">月度收支趨勢</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{ borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="收入" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
