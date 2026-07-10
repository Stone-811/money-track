import { useState, useMemo, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { Transaction } from '../types'

interface CategoryPieChartProps {
  transactions: Transaction[]
}

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f43f5e', '#84cc16', '#6366f1'
]

// 自定義標籤渲染
const renderCustomLabel = ({
  cx, cy, midAngle, outerRadius, percent, name
}: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 25
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // 只顯示佔比超過 5% 的標籤
  if (percent < 0.05) return null

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs fill-gray-700 dark:fill-gray-300"
      style={{ fontSize: '11px' }}
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  )
}

// 活躍扇形渲染（hover 效果）
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
    payload, percent, value
  } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" className="text-sm font-bold fill-gray-800 dark:fill-gray-200">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-xs fill-gray-600 dark:fill-gray-400">
        ${value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-500">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  )
}

export function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // 根據選中月份篩選交易
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const month = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      return month === selectedMonth && t.type === 'expense'
    })
  }, [transactions, selectedMonth])

  // 計算分類統計
  const data = useMemo(() => {
    const categoryMap: Record<string, number> = {}
    filteredTransactions.forEach(t => {
      const cat = t.categoryPath?.[0] || '未分類'
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount
    })
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  // 計算選中大類的中類明細
  const getSubcategoryDetails = (mainCategory: string) => {
    const categoryTransactions = filteredTransactions.filter(t =>
      t.categoryPath?.[0] === mainCategory
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

  // 取得選中中類的交易明細
  const getSubcategoryTransactions = (mainCategory: string, subcategory: string) => {
    return filteredTransactions
      .filter(t =>
        t.categoryPath?.[0] === mainCategory &&
        (t.categoryPath?.[1] || '未分類') === subcategory
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const subcategoryData = selectedCategory ? getSubcategoryDetails(selectedCategory) : []
  const selectedTotal = subcategoryData.reduce((sum, item) => sum + item.value, 0)
  const subcategoryTransactions = selectedCategory && selectedSubcategory
    ? getSubcategoryTransactions(selectedCategory, selectedSubcategory)
    : []
  const subcategoryTransactionsTotal = subcategoryTransactions.reduce((sum, t) => sum + t.amount, 0)

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index)
  }, [])

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined)
  }, [])

  // 月份導航
  const goToPrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 2, 1)
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    setSelectedCategory(null)
    setSelectedSubcategory(null)
  }

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month, 1)
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    setSelectedCategory(null)
    setSelectedSubcategory(null)
  }

  // 返回上一層
  const goBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null)
    } else if (selectedCategory) {
      setSelectedCategory(null)
    }
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    return `${year}年${parseInt(m)}月`
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {/* 月份選擇器 */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatMonth(selectedMonth)}</h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
          本月尚無支出記錄
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
      {/* 月份選擇器與標題 */}
      <div className="p-4 border-b dark:border-gray-700">
        {/* 月份導航 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatMonth(selectedMonth)}</span>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 標題與總計 */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {selectedSubcategory ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-gray-400 dark:text-gray-500">{selectedCategory}</span>
                <span className="text-gray-400 dark:text-gray-500">›</span>
                {selectedSubcategory}
              </button>
            ) : selectedCategory ? (
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {selectedCategory}
              </button>
            ) : '支出分析'}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            總計 <span className="font-bold text-red-500 dark:text-red-400">
              ${(selectedSubcategory ? subcategoryTransactionsTotal : selectedCategory ? selectedTotal : total).toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* 交易明細列表（選中中類時顯示） */}
        {selectedSubcategory ? (
          <div className="space-y-2">
            {subcategoryTransactions.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                無交易記錄
              </div>
            ) : (
              subcategoryTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                >
                  {/* 日期 */}
                  <div className="w-12 text-center">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatDate(t.date)}
                    </div>
                  </div>

                  {/* 備註 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {t.description || '-'}
                    </div>
                  </div>

                  {/* 金額 */}
                  <div className="font-bold text-red-500 dark:text-red-400">
                    ${t.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* 圖表 */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={selectedCategory ? subcategoryData : data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    label={renderCustomLabel}
                    labelLine={false}
                    onClick={(entry) => {
                      if (selectedCategory) {
                        setSelectedSubcategory(entry.name)
                      } else {
                        setSelectedCategory(entry.name)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
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
                      if (selectedCategory) {
                        setSelectedSubcategory(item.name)
                      } else {
                        setSelectedCategory(item.name)
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus:outline-none active:bg-gray-100 dark:active:bg-gray-600"
                  >
                    {/* 顏色指示 */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />

                    {/* 名稱 */}
                    <span className="flex-1 text-left font-medium text-gray-800 dark:text-gray-200">{item.name}</span>

                    {/* 金額與百分比 */}
                    <div className="text-right">
                      <div className="font-bold text-gray-800 dark:text-gray-200">${item.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</div>
                    </div>

                    {/* 展開箭頭 */}
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>

            {/* 提示文字 */}
            {!selectedCategory && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">點擊分類查看明細</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
