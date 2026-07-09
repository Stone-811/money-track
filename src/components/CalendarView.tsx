import { useState, useMemo } from 'react'
import { Transaction, Subscription, TransactionInput, TransactionType, Category } from '../types'
import { DayDetail } from './DayDetail'

interface CalendarViewProps {
  transactions: Transaction[]
  subscriptions: Subscription[]
  categories: Category[]
  onDeleteTransaction: (id: string) => void
  onAddTransaction: (input: TransactionInput) => Promise<void>
  onUpdateTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function CalendarView({
  transactions,
  subscriptions,
  categories,
  onDeleteTransaction,
  onAddTransaction,
  onUpdateTransaction,
  getChildren,
  getCategoryPath
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 計算月曆資料
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay() // 0-6, 0 = Sunday

    const days: Array<{
      date: Date | null
      dayNum: number | null
      income: number
      expense: number
      hasSubscription: boolean
      transactions: Transaction[]
    }> = []

    // 填充前面的空白
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, dayNum: null, income: 0, expense: 0, hasSubscription: false, transactions: [] })
    }

    // 填充日期
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      const dayTransactions = transactions.filter(t => {
        const tDate = t.date
        return tDate.getFullYear() === year &&
               tDate.getMonth() === month &&
               tDate.getDate() === d
      })

      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const hasSubscription = subscriptions.some(s => s.isActive && s.billingDay === d)

      days.push({
        date,
        dayNum: d,
        income,
        expense,
        hasSubscription,
        transactions: dayTransactions
      })
    }

    return days
  }, [year, month, transactions, subscriptions])

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  }

  // 取得當日交易
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    return calendarData.find(d =>
      d.date &&
      d.date.getFullYear() === selectedDate.getFullYear() &&
      d.date.getMonth() === selectedDate.getMonth() &&
      d.date.getDate() === selectedDate.getDate()
    )
  }, [selectedDate, calendarData])

  return (
    <div className="space-y-4">
      {/* 月份切換 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">{year}年{month + 1}月</h2>
            <button
              onClick={goToToday}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              回到今天
            </button>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 星期標題 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日曆格子 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day, index) => (
            <button
              key={index}
              disabled={!day.date}
              onClick={() => day.date && setSelectedDate(day.date)}
              className={`
                relative min-h-[70px] p-1 rounded-lg text-left transition-colors
                ${!day.date ? 'bg-gray-50' : 'hover:bg-blue-50 cursor-pointer'}
                ${isToday(day.date) ? 'ring-2 ring-blue-500' : ''}
                ${selectedDate && day.date &&
                  selectedDate.getDate() === day.date.getDate() &&
                  selectedDate.getMonth() === day.date.getMonth()
                  ? 'bg-blue-100'
                  : 'bg-white'
                }
              `}
            >
              {day.dayNum && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      isToday(day.date) ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {day.dayNum}
                    </span>
                    {day.hasSubscription && (
                      <span className="text-xs" title="有訂閱扣款">🔄</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {day.income > 0 && (
                      <div className="text-xs text-green-600 truncate">
                        +${day.income.toLocaleString()}
                      </div>
                    )}
                    {day.expense > 0 && (
                      <div className="text-xs text-red-600 truncate">
                        -${day.expense.toLocaleString()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 月份摘要 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3">本月摘要</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">收入</div>
            <div className="text-lg font-semibold text-green-600">
              ${calendarData.reduce((sum, d) => sum + d.income, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">支出</div>
            <div className="text-lg font-semibold text-red-600">
              ${calendarData.reduce((sum, d) => sum + d.expense, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">結餘</div>
            <div className={`text-lg font-semibold ${
              calendarData.reduce((sum, d) => sum + d.income - d.expense, 0) >= 0
                ? 'text-blue-600'
                : 'text-red-600'
            }`}>
              ${calendarData.reduce((sum, d) => sum + d.income - d.expense, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 日期明細彈窗 */}
      {selectedDate && selectedDayData && (
        <DayDetail
          date={selectedDate}
          transactions={selectedDayData.transactions}
          categories={categories}
          onClose={() => setSelectedDate(null)}
          onDelete={onDeleteTransaction}
          onAdd={onAddTransaction}
          onUpdate={onUpdateTransaction}
          getChildren={getChildren}
          getCategoryPath={getCategoryPath}
        />
      )}
    </div>
  )
}
