import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Transaction } from '../types'

interface CategoryPieChartProps {
  data: { name: string; value: number }[]
  transactions?: Transaction[]
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f43f5e', '#84cc16', '#6366f1'
]

export function CategoryPieChart({ data, transactions = [] }: CategoryPieChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // 計算選中大類的中類明細
  const getSubcategoryDetails = (mainCategory: string) => {
    const categoryTransactions = transactions.filter(t =>
      t.type === 'expense' && t.categoryPath?.[0] === mainCategory
    )

    const subcategoryMap: Record<string, number> = {}
    categoryTransactions.forEach(t => {
      const subcat = t.categoryPath?.[1] || '未分類'
      subcategoryMap[subcat] = (subcategoryMap[subcat] || 0) + t.amount
    })

    return Object.entries(subcategoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }

  const subcategoryData = selectedCategory ? getSubcategoryDetails(selectedCategory) : []
  const selectedTotal = subcategoryData.reduce((sum, item) => sum + item.value, 0)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">支出分析</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-gray-400">
          本月尚無支出記錄
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          {selectedCategory ? (
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {selectedCategory}
            </button>
          ) : '支出分析'}
        </h3>
        <span className="text-sm text-gray-500">
          總計 <span className="font-bold text-red-500">${(selectedCategory ? selectedTotal : total).toLocaleString()}</span>
        </span>
      </div>

      <div className="p-4">
        {/* 圖表 */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={selectedCategory ? subcategoryData : data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                onClick={(entry) => {
                  if (!selectedCategory && transactions.length > 0) {
                    setSelectedCategory(entry.name)
                  }
                }}
                style={{ cursor: selectedCategory ? 'default' : 'pointer' }}
              >
                {(selectedCategory ? subcategoryData : data).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 分類列表 */}
        <div className="space-y-2">
          {(selectedCategory ? subcategoryData : data).map((item, index) => {
            const percentage = ((item.value / (selectedCategory ? selectedTotal : total)) * 100).toFixed(1)
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (!selectedCategory && transactions.length > 0) {
                    setSelectedCategory(item.name)
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedCategory ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {/* 顏色指示 */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />

                {/* 名稱 */}
                <span className="flex-1 text-left font-medium text-gray-800">{item.name}</span>

                {/* 金額與百分比 */}
                <div className="text-right">
                  <div className="font-bold text-gray-800">${item.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{percentage}%</div>
                </div>

                {/* 展開箭頭 */}
                {!selectedCategory && transactions.length > 0 && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* 提示文字 */}
        {!selectedCategory && transactions.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">點擊分類查看明細</p>
        )}
      </div>
    </div>
  )
}
