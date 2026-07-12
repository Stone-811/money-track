import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
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
  // 計算最近6個月的支出
  const { data, maxExpense, avgExpense } = useMemo(() => {
    const monthlyMap: Record<string, number> = {}

    // 初始化最近6個月
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = 0
    }

    // 填入支出資料
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyMap[key] !== undefined) {
          monthlyMap[key] += t.amount
        }
      }
    })

    const monthlyData = Object.entries(monthlyMap).map(([month, expense]) => ({
      month: `${parseInt(month.slice(5))}月`,
      expense,
      fullMonth: month
    }))

    const expenses = monthlyData.map(d => d.expense)
    const max = Math.max(...expenses)
    const avg = expenses.reduce((a, b) => a + b, 0) / expenses.length

    return { data: monthlyData, maxExpense: max, avgExpense: avg }
  }, [transactions])

  // 當前月份
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700">
      {/* 標題區 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-100 tracking-wide">每月支出趨勢</h3>
          <div className="text-right">
            <div className="text-xs text-gray-400 dark:text-gray-500">平均</div>
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
              ${avgExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* 圖表區 */}
      <div className="p-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAmount}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                width={40}
              />
              <Bar
                dataKey="expense"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => {
                  const isCurrentMonth = entry.fullMonth === currentMonth
                  const isMax = entry.expense === maxExpense && maxExpense > 0
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isCurrentMonth ? '#6366f1' : isMax ? '#f43f5e' : '#e5e7eb'}
                      className={isCurrentMonth ? '' : isMax ? '' : 'dark:fill-gray-600'}
                      style={{ filter: isCurrentMonth || isMax ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none' }}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 圖例說明 */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-indigo-500 shadow-sm" />
            <span className="text-gray-500 dark:text-gray-400">本月</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-500 shadow-sm" />
            <span className="text-gray-500 dark:text-gray-400">最高</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-600" />
            <span className="text-gray-500 dark:text-gray-400">其他</span>
          </div>
        </div>

        {/* 月份詳細數據 */}
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {data.map((item) => {
            const isCurrentMonth = item.fullMonth === currentMonth
            return (
              <div
                key={item.fullMonth}
                className={`text-center py-2 rounded-lg transition-all duration-200 ${
                  isCurrentMonth
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className={`text-xs font-medium ${
                  isCurrentMonth
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.month}
                </div>
                <div className={`text-xs mt-0.5 font-semibold tabular-nums ${
                  isCurrentMonth
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {formatAmount(item.expense)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
