import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Transaction } from '../types'

interface MonthlyBarChartProps {
  transactions: Transaction[]
}

// 格式化金額（縮寫顯示）
const formatAmount = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">月度收支趨勢</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              className="dark:fill-gray-400"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAmount}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              className="dark:fill-gray-400"
              width={45}
            />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{
                borderRadius: '8px',
                backgroundColor: 'var(--tooltip-bg, #fff)',
                border: '1px solid var(--tooltip-border, #e5e7eb)',
                color: 'var(--tooltip-text, #1f2937)'
              }}
              labelStyle={{ color: 'var(--tooltip-text, #1f2937)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
            />
            <Bar dataKey="收入" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
