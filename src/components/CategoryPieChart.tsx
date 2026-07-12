import { useState, useMemo, useCallback, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
import { Transaction } from '../types'

interface CategoryPieChartProps {
  transactions: Transaction[]
}

// 更精緻的配色方案 - 使用柔和但有辨識度的顏色
const COLORS = [
  '#6366f1', // Indigo - 優雅的主色
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
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
  // 轉場動畫狀態
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayData, setDisplayData] = useState<{ name: string; value: number }[]>([])
  const [animationKey, setAnimationKey] = useState(0)

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

  // 當資料變化時，使用平滑過渡
  const currentData = selectedCategory ? subcategoryData : data
  useEffect(() => {
    if (currentData.length > 0 && !selectedSubcategory) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayData(currentData)
        setAnimationKey(prev => prev + 1)
        setIsTransitioning(false)
      }, 150) // 短暫延遲讓淡出完成
      return () => clearTimeout(timer)
    } else if (!selectedSubcategory) {
      setDisplayData(currentData)
    }
  }, [currentData, selectedSubcategory])

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700">
        {/* 月份選擇器 */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-200/70 dark:hover:bg-gray-600 rounded-full transition-all duration-200 active:scale-95 focus:outline-none"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-100 tracking-wide">{formatMonth(selectedMonth)}</h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200/70 dark:hover:bg-gray-600 rounded-full transition-all duration-200 active:scale-95 focus:outline-none"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">本月尚無支出記錄</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700">
      {/* 月份選擇器與標題 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30">
        {/* 月份導航 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-200/70 dark:hover:bg-gray-600 rounded-full transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-gray-700 dark:text-gray-100 tracking-wide">{formatMonth(selectedMonth)}</span>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-200/70 dark:hover:bg-gray-600 rounded-full transition-all duration-200 active:scale-95"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="text-right">
            <span className="text-xs text-gray-400 dark:text-gray-500">總計</span>
            <span className="ml-2 font-bold text-red-500 dark:text-red-400 tabular-nums">
              ${(selectedSubcategory ? subcategoryTransactionsTotal : selectedCategory ? selectedTotal : total).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 交易明細列表（選中中類時顯示） */}
        {selectedSubcategory ? (
          <div className="space-y-2 animate-fadeIn">
            {subcategoryTransactions.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                無交易記錄
              </div>
            ) : (
              subcategoryTransactions.map((t, index) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600/50 hover:shadow-sm transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 日期 */}
                  <div className="w-12 text-center">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                      {formatDate(t.date)}
                    </div>
                  </div>

                  {/* 備註 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 dark:text-gray-200 truncate">
                      {t.description || '-'}
                    </div>
                  </div>

                  {/* 金額 */}
                  <div className="font-semibold text-red-500 dark:text-red-400 tabular-nums">
                    ${t.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* 圖表 */}
            <div
              className="h-64 mb-4 transition-opacity duration-300 ease-out"
              style={{ opacity: isTransitioning ? 0.3 : 1 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key={animationKey}
                    data={displayData.length > 0 ? displayData : currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    label={renderCustomLabel}
                    labelLine={false}
                    animationBegin={0}
                    animationDuration={600}
                    animationEasing="ease-out"
                    onClick={(entry) => {
                      if (selectedCategory) {
                        setSelectedSubcategory(entry.name)
                      } else {
                        setSelectedCategory(entry.name)
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {(displayData.length > 0 ? displayData : currentData).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 分類列表 */}
            <div
              className="space-y-2 transition-opacity duration-300 ease-out"
              style={{ opacity: isTransitioning ? 0.3 : 1 }}
            >
              {(displayData.length > 0 ? displayData : currentData).map((item, index) => {
                const currentTotal = selectedCategory ? selectedTotal : total
                const percentage = currentTotal > 0 ? ((item.value / currentTotal) * 100).toFixed(1) : '0'
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/70 hover:shadow-sm cursor-pointer focus:outline-none active:scale-[0.98]"
                  >
                    {/* 顏色指示 */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />

                    {/* 名稱 */}
                    <span className="flex-1 text-left font-medium text-gray-700 dark:text-gray-200">{item.name}</span>

                    {/* 金額與百分比 */}
                    <div className="text-right">
                      <div className="font-semibold text-gray-800 dark:text-gray-100">${item.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{percentage}%</div>
                    </div>

                    {/* 展開箭頭 */}
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>

            {/* 提示文字 */}
            {!selectedCategory && data.length > 0 && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 select-none">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  點擊分類查看明細
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
