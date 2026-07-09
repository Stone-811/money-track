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
    const startDay = firstDay.getDay()

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

  // 月統計
  const monthStats = useMemo(() => {
    const income = calendarData.reduce((sum, d) => sum + d.income, 0)
    const expense = calendarData.reduce((sum, d) => sum + d.expense, 0)
    return { income, expense, balance: income - expense }
  }, [calendarData])

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate()
  }

  // 計算選中日期的交易（支援跨月份查看）
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null

    const dayTransactions = transactions.filter(t => {
      const tDate = t.date
      return tDate.getFullYear() === selectedDate.getFullYear() &&
             tDate.getMonth() === selectedDate.getMonth() &&
             tDate.getDate() === selectedDate.getDate()
    })

    return {
      date: selectedDate,
      dayNum: selectedDate.getDate(),
      transactions: dayTransactions,
      income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    }
  }, [selectedDate, transactions])

  // 處理日期切換（來自 DayDetail 的左右滑動或按鈕）
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    // 如果切換到不同月份，同步更新日曆視圖
    if (newDate.getFullYear() !== year || newDate.getMonth() !== month) {
      setCurrentDate(newDate)
    }
  }

  // 格式化金額（簡短顯示）
  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return `${(amount / 1000).toFixed(0)}k`
    }
    return amount.toLocaleString()
  }

  return (
    <div className="space-y-3">
      {/* 月份摘要卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">{year}年{month + 1}月</h2>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">收入</div>
            <div className="text-lg font-bold">+{monthStats.income.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">支出</div>
            <div className="text-lg font-bold">-{monthStats.expense.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">結餘</div>
            <div className={`text-lg font-bold ${monthStats.balance < 0 ? 'text-red-300' : ''}`}>
              {monthStats.balance >= 0 ? '+' : ''}{monthStats.balance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 日曆 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* 星期標題 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-3 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日曆格子 */}
        <div className="grid grid-cols-7">
          {calendarData.map((day, index) => {
            const isSelected = selectedDate && day.date &&
              selectedDate.getDate() === day.date.getDate() &&
              selectedDate.getMonth() === day.date.getMonth()
            const dayIsToday = isToday(day.date)
            const hasData = day.income > 0 || day.expense > 0
            const weekDay = index % 7

            return (
              <button
                key={index}
                disabled={!day.date}
                onClick={() => day.date && setSelectedDate(day.date)}
                className={`
                  relative h-16 flex flex-col items-center justify-start pt-1
                  border-b border-r border-gray-100 transition-colors
                  ${!day.date ? 'bg-gray-50/50' : 'hover:bg-blue-50 active:bg-blue-100'}
                  ${isSelected ? 'bg-blue-50' : ''}
                  ${weekDay === 6 ? 'border-r-0' : ''}
                `}
              >
                {day.dayNum && (
                  <>
                    {/* 日期數字 */}
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                      ${dayIsToday ? 'bg-blue-500 text-white' : ''}
                      ${weekDay === 0 && !dayIsToday ? 'text-red-500' : ''}
                      ${weekDay === 6 && !dayIsToday ? 'text-blue-500' : ''}
                      ${!dayIsToday && weekDay !== 0 && weekDay !== 6 ? 'text-gray-700' : ''}
                    `}>
                      {day.dayNum}
                    </div>

                    {/* 金額顯示 */}
                    <div className="flex flex-col items-center mt-0.5 w-full px-0.5">
                      {day.expense > 0 && (
                        <span className="text-[10px] text-red-500 font-medium leading-tight">
                          -{formatAmount(day.expense)}
                        </span>
                      )}
                      {day.income > 0 && (
                        <span className="text-[10px] text-green-500 font-medium leading-tight">
                          +{formatAmount(day.income)}
                        </span>
                      )}
                    </div>

                    {/* 訂閱指示點 */}
                    {day.hasSubscription && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
                    )}

                    {/* 有資料指示點 */}
                    {hasData && !day.hasSubscription && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-300 rounded-full" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* 今天按鈕 */}
        <div className="border-t p-2 flex justify-center">
          <button
            onClick={goToToday}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium px-4 py-1 hover:bg-blue-50 rounded-full transition-colors"
          >
            回到今天
          </button>
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
          onDateChange={handleDateChange}
        />
      )}
    </div>
  )
}
