import { useState, useEffect, useRef } from 'react'
import { Transaction, TransactionInput, TransactionType, Category } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface DayDetailProps {
  date: Date
  transactions: Transaction[]
  categories: Category[]
  onClose: () => void
  onDelete: (id: string) => void
  onAdd: (input: TransactionInput) => Promise<void>
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
  onDateChange?: (date: Date) => void
}

export function DayDetail({
  date,
  transactions,
  categories,
  onClose,
  onDelete,
  onAdd,
  onUpdate,
  getChildren,
  getCategoryPath,
  onDateChange
}: DayDetailProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 滑動相關
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!onDateChange) return

    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (Math.abs(diff) > minSwipeDistance) {
      const newDate = new Date(date)
      if (diff > 0) {
        // 向左滑 -> 下一天
        newDate.setDate(newDate.getDate() + 1)
      } else {
        // 向右滑 -> 上一天
        newDate.setDate(newDate.getDate() - 1)
      }
      onDateChange(newDate)
    }
  }

  useEffect(() => {
    if (editingId) {
      const t = transactions.find(t => t.id === editingId)
      if (t) {
        setType(t.type)
        setAmount(t.amount.toString())
        setCategoryId(t.categoryId)
        setCategoryPath(t.categoryPath)
        setDescription(t.description)
        setShowForm(true)
      }
    }
  }, [editingId, transactions])

  const formatDate = (d: Date) => {
    const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${d.getMonth() + 1}/${d.getDate()} ${weekDays[d.getDay()]}`
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('確定要刪除這筆記錄嗎？')) {
      onDelete(id)
    }
  }

  const handleCategorySelect = (id: string, path: string[]) => {
    setCategoryId(id)
    setCategoryPath(path)
  }

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setAmount('')
    setCategoryId('')
    setCategoryPath([])
    setDescription('')
    setType('expense')
  }

  const handleSubmit = async () => {
    if (!amount || !categoryId) return

    setSubmitting(true)
    try {
      if (editingId) {
        await onUpdate(editingId, {
          type,
          amount: parseFloat(amount),
          categoryId,
          categoryPath,
          description
        })
      } else {
        await onAdd({
          type,
          amount: parseFloat(amount),
          categoryId,
          categoryPath,
          description,
          date
        })
      }
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div
        ref={contentRef}
        className="bg-gray-50 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 拖曳指示條 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 標題與摘要 */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            {/* 上一天 */}
            {onDateChange && (
              <button
                onClick={() => {
                  const newDate = new Date(date)
                  newDate.setDate(newDate.getDate() - 1)
                  onDateChange(newDate)
                }}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <h3 className="text-xl font-bold text-gray-800">{formatDate(date)}</h3>

            <div className="flex items-center gap-2">
              {/* 下一天 */}
              {onDateChange && (
                <button
                  onClick={() => {
                    const newDate = new Date(date)
                    newDate.setDate(newDate.getDate() + 1)
                    onDateChange(newDate)
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 摘要卡片 */}
          <div className="flex gap-3">
            <div className="flex-1 bg-green-50 rounded-2xl p-3 text-center">
              <div className="text-xs text-green-600 mb-1">收入</div>
              <div className="text-lg font-bold text-green-600">+{income.toLocaleString()}</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-2xl p-3 text-center">
              <div className="text-xs text-red-600 mb-1">支出</div>
              <div className="text-lg font-bold text-red-600">-{expense.toLocaleString()}</div>
            </div>
            <div className={`flex-1 ${income - expense >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-2xl p-3 text-center`}>
              <div className={`text-xs ${income - expense >= 0 ? 'text-blue-600' : 'text-orange-600'} mb-1`}>結餘</div>
              <div className={`text-lg font-bold ${income - expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {income - expense >= 0 ? '+' : ''}{(income - expense).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] bg-white rounded-t-3xl">
          {/* 新增按鈕或表單 */}
          {!showForm ? (
            <div className="p-4">
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                新增記錄
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-100">
              {/* 編輯模式標題 */}
              {editingId && (
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    編輯記錄
                  </span>
                </div>
              )}

              {/* 類型切換 */}
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); setCategoryPath([]) }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    type === 'expense'
                      ? 'bg-white text-red-500 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); setCategoryPath([]) }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                    type === 'income'
                      ? 'bg-white text-green-500 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  收入
                </button>
              </div>

              {/* 金額輸入 */}
              <div className="mb-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-center bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white border-0 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* 分類選擇 */}
              <div className="mb-4 bg-gray-50 rounded-2xl p-4">
                <CategoryPicker
                  type={type}
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={handleCategorySelect}
                  getChildren={getChildren}
                  getCategoryPath={getCategoryPath}
                />
              </div>

              {/* 備註 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="備註（選填）"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white border-0 transition-all"
                />
              </div>

              {/* 按鈕 */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !amount || !categoryId}
                  className={`flex-1 py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    editingId
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {submitting ? '儲存中...' : editingId ? '更新' : '確定'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 交易列表 */}
          {transactions.length === 0 && !showForm ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400">當日無交易記錄</p>
            </div>
          ) : transactions.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs text-gray-500 font-medium">交易記錄 ({transactions.length})</span>
              </div>
              <div className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleEdit(t)}
                    className={`px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-gray-50 transition-colors ${
                      editingId === t.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* 圖標 */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold ${
                      t.type === 'expense' ? 'bg-gradient-to-br from-red-400 to-red-500' : 'bg-gradient-to-br from-green-400 to-green-500'
                    }`}>
                      {t.categoryPath?.[0]?.charAt(0) || (t.type === 'expense' ? '-' : '+')}
                    </div>

                    {/* 內容 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {t.categoryPath?.join(' › ') || '未分類'}
                      </div>
                      {t.description ? (
                        <div className="text-sm text-gray-500 truncate">{t.description}</div>
                      ) : t.subscriptionId ? (
                        <div className="text-xs text-blue-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          訂閱扣款
                        </div>
                      ) : null}
                    </div>

                    {/* 金額 */}
                    <div className="text-right">
                      <span className={`font-bold ${
                        t.type === 'expense' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* 刪除按鈕 */}
                    <button
                      onClick={(e) => handleDelete(e, t.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 底部安全區域 */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
