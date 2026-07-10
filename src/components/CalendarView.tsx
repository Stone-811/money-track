import { useState, useMemo, FormEvent } from 'react'
import { Transaction, Subscription, TransactionInput, TransactionType, Category, Budget } from '../types'
import { DayDetail } from './DayDetail'

interface CalendarViewProps {
  transactions: Transaction[]
  subscriptions: Subscription[]
  categories: Category[]
  budget?: Budget
  onSetBudget: (month: string, amount: number) => Promise<void>
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
  budget,
  onSetBudget,
  onDeleteTransaction,
  onAddTransaction,
  onUpdateTransaction,
  getChildren,
  getCategoryPath
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

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
      pendingSubscriptionAmount: number
      hasSubscription: boolean
      transactions: Transaction[]
    }> = []

    // 填充前面的空白
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, dayNum: null, income: 0, expense: 0, pendingSubscriptionAmount: 0, hasSubscription: false, transactions: [] })
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

      let expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      // 檢查該日是否有訂閱
      const daySubscriptions = subscriptions.filter(s =>
        s.isActive &&
        s.billingDay === d
      )

      // 計算尚未有交易記錄的訂閱金額
      const pendingSubscriptionAmount = daySubscriptions
        .filter(s => {
          // 檢查是否已有該訂閱的交易
          const hasTransaction = dayTransactions.some(t => t.subscriptionId === s.id)
          return !hasTransaction
        })
        .reduce((sum, s) => sum + s.amount, 0)

      const hasSubscription = daySubscriptions.length > 0

      days.push({
        date,
        dayNum: d,
        income,
        expense,
        pendingSubscriptionAmount,
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
    const pendingAmount = calendarData.reduce((sum, d) => sum + d.pendingSubscriptionAmount, 0)
    return { income, expense, pendingAmount, balance: income - expense - pendingAmount }
  }, [calendarData])

  // 預算計算
  const budgetInfo = useMemo(() => {
    const totalBudget = budget?.amount || 0
    const totalSpent = monthStats.expense + monthStats.pendingAmount
    const remaining = totalBudget - totalSpent
    const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
    const isOverBudget = remaining < 0
    return { totalBudget, totalSpent, remaining, percentage, isOverBudget }
  }, [budget, monthStats])

  // 處理預算儲存
  const handleBudgetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!budgetAmount) return

    setSavingBudget(true)
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
      await onSetBudget(monthStr, parseFloat(budgetAmount))
      setEditingBudget(false)
    } finally {
      setSavingBudget(false)
    }
  }

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
      {/* 月份摘要卡片 + 預算追蹤 */}
      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
        {/* 月份導航 */}
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

        {/* 收支總覽 */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">收入</div>
            <div className="text-base font-bold text-green-200">+{monthStats.income.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">支出</div>
            <div className="text-base font-bold text-red-200">-{(monthStats.expense + monthStats.pendingAmount).toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded-xl py-2 px-1">
            <div className="text-xs opacity-80">結餘</div>
            <div className={`text-base font-bold ${monthStats.balance < 0 ? 'text-red-300' : 'text-white'}`}>
              {monthStats.balance >= 0 ? '+' : ''}{monthStats.balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 預算追蹤 */}
        {editingBudget ? (
          <form onSubmit={handleBudgetSubmit} className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="輸入月預算"
                min="0"
                step="100"
                required
                autoFocus
                className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={savingBudget}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {savingBudget ? '...' : '確定'}
              </button>
              <button
                type="button"
                onClick={() => setEditingBudget(false)}
                className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        ) : budgetInfo.totalBudget > 0 ? (
          <div className="bg-white/10 rounded-xl p-3">
            {/* 預算進度條 */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="opacity-80">預算使用</span>
              <span>
                ${budgetInfo.totalSpent.toLocaleString()} / ${budgetInfo.totalBudget.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetInfo.isOverBudget ? 'bg-red-400' : budgetInfo.percentage > 80 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${budgetInfo.percentage}%` }}
              />
            </div>
            {/* 剩餘預算 */}
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${budgetInfo.isOverBudget ? 'text-red-300' : 'text-green-300'}`}>
                {budgetInfo.isOverBudget ? '超支 ' : '剩餘 '}${Math.abs(budgetInfo.remaining).toLocaleString()}
              </span>
              <button
                onClick={() => { setBudgetAmount(budgetInfo.totalBudget.toString()); setEditingBudget(true) }}
                className="text-xs opacity-70 hover:opacity-100 underline transition-opacity"
              >
                修改預算
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingBudget(true)}
            className="w-full bg-white/10 hover:bg-white/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>設定月預算</span>
          </button>
        )}
      </div>

      {/* 日曆 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {/* 星期標題 */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-3 ${
                i === 0 ? 'text-red-500 dark:text-red-400' : i === 6 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
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
            const hasData = day.income > 0 || day.expense > 0 || day.pendingSubscriptionAmount > 0
            const weekDay = index % 7

            return (
              <button
                key={index}
                disabled={!day.date}
                onClick={() => day.date && setSelectedDate(day.date)}
                className={`
                  relative h-16 flex flex-col items-center justify-start pt-1
                  border-b border-r border-gray-100 dark:border-gray-700 transition-colors
                  ${!day.date ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 active:bg-blue-100 dark:active:bg-blue-900/50'}
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/40' : ''}
                  ${weekDay === 6 ? 'border-r-0' : ''}
                `}
              >
                {day.dayNum && (
                  <>
                    {/* 日期數字 */}
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                      ${dayIsToday ? 'bg-blue-500 text-white' : ''}
                      ${weekDay === 0 && !dayIsToday ? 'text-red-500 dark:text-red-400' : ''}
                      ${weekDay === 6 && !dayIsToday ? 'text-blue-500 dark:text-blue-400' : ''}
                      ${!dayIsToday && weekDay !== 0 && weekDay !== 6 ? 'text-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {day.dayNum}
                    </div>

                    {/* 金額顯示 */}
                    <div className="flex flex-col items-center mt-0.5 w-full px-0.5">
                      {(day.expense + day.pendingSubscriptionAmount) > 0 && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium leading-tight">
                          -{formatAmount(day.expense + day.pendingSubscriptionAmount)}
                        </span>
                      )}
                      {day.income > 0 && (
                        <span className="text-[10px] text-green-500 dark:text-green-400 font-medium leading-tight">
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
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* 今天按鈕 */}
        <div className="border-t dark:border-gray-700 p-2 flex justify-center">
          <button
            onClick={goToToday}
            className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium px-4 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
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
