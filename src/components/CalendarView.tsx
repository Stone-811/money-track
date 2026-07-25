import { useState, useMemo, useEffect, FormEvent } from 'react'
import { Transaction, Subscription, Category, Budget, TransactionType, TransactionInput } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface CalendarViewProps {
  transactions: Transaction[]
  subscriptions: Subscription[]
  categories: Category[]
  getBudgetForMonth: (month: string) => Budget | undefined
  onSetBudget: (month: string, amount: number) => Promise<void>
  onDeleteTransaction: (id: string) => void
  onUpdateTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function CalendarView({
  transactions,
  subscriptions,
  categories,
  getBudgetForMonth,
  onSetBudget,
  onDeleteTransaction,
  onUpdateTransaction,
  getChildren,
  getCategoryPath
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // 預設選中今天
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  // 編輯交易
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editType, setEditType] = useState<TransactionType>('expense')
  const [editAmount, setEditAmount] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editCategoryPath, setEditCategoryPath] = useState<string[]>([])
  const [editDescription, setEditDescription] = useState('')
  const [editDate, setEditDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  // 當前顯示月份字串
  const displayedMonth = useMemo(() => {
    return `${year}-${String(month + 1).padStart(2, '0')}`
  }, [year, month])

  // 月份切換時關閉預算編輯並重設金額
  useEffect(() => {
    setEditingBudget(false)
    setBudgetAmount('')
  }, [displayedMonth])

  // 當前顯示月份的預算
  const budget = useMemo(() => {
    return getBudgetForMonth(displayedMonth)
  }, [getBudgetForMonth, displayedMonth])

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
      await onSetBudget(displayedMonth, parseFloat(budgetAmount))
      setEditingBudget(false)
    } finally {
      setSavingBudget(false)
    }
  }

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  // 開啟編輯交易
  const openEditTransaction = (t: Transaction) => {
    setEditingTransaction(t)
    setEditType(t.type)
    setEditAmount(t.amount.toString())
    setEditCategoryId(t.categoryId)
    setEditCategoryPath(t.categoryPath)
    setEditDescription(t.description)
    setEditDate(`${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}-${String(t.date.getDate()).padStart(2, '0')}`)
  }

  // 關閉編輯
  const closeEditTransaction = () => {
    setEditingTransaction(null)
    setEditType('expense')
    setEditAmount('')
    setEditCategoryId('')
    setEditCategoryPath([])
    setEditDescription('')
    setEditDate('')
  }

  // 儲存編輯
  const handleEditSubmit = async () => {
    if (!editingTransaction || !editAmount || !editCategoryId) return

    setSubmitting(true)
    try {
      const newDate = editDate ? new Date(editDate + 'T00:00:00') : editingTransaction.date
      await onUpdateTransaction(editingTransaction.id, {
        type: editType,
        amount: parseFloat(editAmount),
        categoryId: editCategoryId,
        categoryPath: editCategoryPath,
        description: editDescription,
        date: newDate
      })
      closeEditTransaction()
    } finally {
      setSubmitting(false)
    }
  }

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

  // 格式化選中日期
  const formatSelectedDate = (d: Date) => {
    const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${d.getMonth() + 1}/${d.getDate()} ${weekDays[d.getDay()]}`
  }

  return (
    <div className="space-y-3">
      {/* 月份摘要 + 預算（合併區塊） */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700">
        {/* 月份導航（支援滑動） */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700"
          onTouchStart={(e) => {
            const touch = e.touches[0]
            e.currentTarget.dataset.startX = touch.clientX.toString()
          }}
          onTouchEnd={(e) => {
            const startX = parseFloat(e.currentTarget.dataset.startX || '0')
            const endX = e.changedTouches[0].clientX
            const diff = endX - startX
            if (Math.abs(diff) > 50) {
              if (diff > 0) goToPrevMonth()
              else goToNextMonth()
            }
          }}
        >
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{year}年{month + 1}月</h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 收支數據 */}
        <div className="px-4 py-3 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">收入</div>
            <div className="text-sm font-bold text-green-600 dark:text-green-400">
              +${monthStats.income.toLocaleString()}
            </div>
          </div>
          <div className="text-center border-x dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">支出</div>
            <div className="text-sm font-bold text-red-600 dark:text-red-400">
              -${(monthStats.expense + monthStats.pendingAmount).toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">結餘</div>
            <div className={`text-sm font-bold ${monthStats.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
              {monthStats.balance >= 0 ? '+' : ''}${monthStats.balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 預算區域 */}
        <div className="px-4 py-3">
          {editingBudget ? (
            <form onSubmit={handleBudgetSubmit}>
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
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingBudget}
                  className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {savingBudget ? '...' : '確定'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBudget(false)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          ) : budgetInfo.totalBudget > 0 ? (
            <div
              onClick={() => { setBudgetAmount(budgetInfo.totalBudget.toString()); setEditingBudget(true) }}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 -mx-3 px-3 py-1.5 -my-1.5 rounded-lg transition-colors group"
            >
              {/* 預算進度條 */}
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>預算</span>
                  <span className="font-medium">
                    ${budgetInfo.totalSpent.toLocaleString()} / ${budgetInfo.totalBudget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetInfo.isOverBudget ? 'bg-red-500' : budgetInfo.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${budgetInfo.percentage}%` }}
                  />
                </div>
              </div>
              {/* 剩餘金額 */}
              <div className="text-right min-w-[80px]">
                <div className={`text-base font-bold ${budgetInfo.isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                  {budgetInfo.isOverBudget ? '-' : ''}${Math.abs(budgetInfo.remaining).toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">
                  {budgetInfo.isOverBudget ? '超支' : '剩餘'}
                </div>
              </div>
              {/* 編輯提示 */}
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => setEditingBudget(true)}
              className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-400 dark:text-gray-500 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>設定預算</span>
            </button>
          )}
        </div>
      </div>

      {/* 日曆 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700">
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
            const weekDay = index % 7

            return (
              <button
                key={index}
                disabled={!day.date}
                onClick={() => day.date && setSelectedDate(day.date)}
                className={`
                  relative h-16 flex flex-col items-center justify-start pt-1
                  border-b border-r border-gray-100 dark:border-gray-700 transition-all duration-200
                  ${!day.date ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100 dark:active:bg-indigo-900/50'}
                  ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}
                  ${weekDay === 6 ? 'border-r-0' : ''}
                `}
              >
                {day.dayNum && (
                  <>
                    {/* 日期數字 */}
                    <div className={`
                      w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                      ${dayIsToday ? 'bg-indigo-500 text-white shadow-sm' : ''}
                      ${weekDay === 0 && !dayIsToday ? 'text-rose-500 dark:text-rose-400' : ''}
                      ${weekDay === 6 && !dayIsToday ? 'text-indigo-500 dark:text-indigo-400' : ''}
                      ${!dayIsToday && weekDay !== 0 && weekDay !== 6 ? 'text-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {day.dayNum}
                    </div>

                    {/* 金額顯示（只顯示實際交易） */}
                    <div className="flex flex-col items-center mt-0.5 w-full px-0.5">
                      {day.expense > 0 && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium leading-tight">
                          -{formatAmount(day.expense)}
                        </span>
                      )}
                      {day.income > 0 && (
                        <span className="text-[10px] text-green-500 dark:text-green-400 font-medium leading-tight">
                          +{formatAmount(day.income)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* 今天按鈕 */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-2 flex justify-center">
          <button
            onClick={goToToday}
            className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium px-4 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all duration-200 active:scale-95"
          >
            回到今天
          </button>
        </div>
      </div>

      {/* 選中日期的交易紀錄 */}
      {selectedDate && selectedDayData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700 animate-fadeIn">
          {/* 日期標題 */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setDate(newDate.getDate() - 1)
                  handleDateChange(newDate)
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatSelectedDate(selectedDate)}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setDate(newDate.getDate() + 1)
                  handleDateChange(newDate)
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {selectedDayData.income > 0 && (
                <span className="text-green-600 dark:text-green-400 font-medium">+${selectedDayData.income.toLocaleString()}</span>
              )}
              {selectedDayData.expense > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">-${selectedDayData.expense.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* 交易列表 */}
          {selectedDayData.transactions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">當日無交易記錄</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">點擊下方 + 按鈕開始記帳</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {selectedDayData.transactions.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openEditTransaction(t)}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                >
                  {/* 圖標 */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm shadow-sm ${
                    t.type === 'expense' ? 'bg-gradient-to-br from-rose-400 to-rose-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                  }`}>
                    {categories.find(c => c.id === t.categoryId)?.icon || t.categoryPath?.[0]?.charAt(0) || (t.type === 'expense' ? '-' : '+')}
                  </div>

                  {/* 內容 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                      {t.categoryPath?.join(' › ') || '未分類'}
                    </div>
                    {t.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.description}</div>
                    )}
                  </div>

                  {/* 金額與箭頭 */}
                  <span className={`font-bold text-sm ${
                    t.type === 'expense' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
                  }`}>
                    {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 編輯交易 Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={closeEditTransaction}>
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* 標題 */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">編輯交易</h3>
              <button
                onClick={closeEditTransaction}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">日期</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 類型切換 */}
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setEditType('expense'); setEditCategoryId(''); setEditCategoryPath([]) }}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                    editType === 'expense'
                      ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setEditType('income'); setEditCategoryId(''); setEditCategoryPath([]) }}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                    editType === 'income'
                      ? 'bg-white dark:bg-gray-600 text-green-500 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  收入
                </button>
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">金額</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 text-xl font-bold text-center bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 border-0 transition-all"
                  />
                </div>
              </div>

              {/* 分類 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">分類</label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <CategoryPicker
                    type={editType}
                    categories={categories}
                    selectedId={editCategoryId}
                    onSelect={(id, path) => { setEditCategoryId(id); setEditCategoryPath(path) }}
                    getChildren={getChildren}
                    getCategoryPath={getCategoryPath}
                  />
                </div>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">備註</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="選填"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 刪除按鈕 */}
              <button
                onClick={() => {
                  if (window.confirm('確定要刪除這筆交易嗎？')) {
                    onDeleteTransaction(editingTransaction.id)
                    closeEditTransaction()
                  }
                }}
                className="w-full py-2.5 text-red-500 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                刪除此筆交易
              </button>
            </div>

            {/* 按鈕 */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={handleEditSubmit}
                disabled={submitting || !editAmount || !editCategoryId}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {submitting ? '儲存中...' : '更新'}
              </button>
              <button
                onClick={closeEditTransaction}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
