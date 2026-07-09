import { useState, useEffect } from 'react'
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
  getCategoryPath
}: DayDetailProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 當編輯模式改變時，重置表單
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
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    return `${d.getMonth() + 1}月${d.getDate()}日 (${weekDays[d.getDay()]})`
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
        // 更新現有記錄
        await onUpdate(editingId, {
          type,
          amount: parseFloat(amount),
          categoryId,
          categoryPath,
          description
        })
      } else {
        // 新增記錄
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-slide-up">
        {/* 標題 */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold text-lg">{formatDate(date)}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
          {/* 摘要 */}
          <div className="px-4 py-3 bg-gray-50 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-gray-500">收入</div>
              <div className="font-semibold text-green-600">${income.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">支出</div>
              <div className="font-semibold text-red-600">${expense.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">結餘</div>
              <div className={`font-semibold ${income - expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${(income - expense).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 新增按鈕或表單 */}
          {!showForm ? (
            <div className="p-4">
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增記錄
              </button>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border-b">
              {/* 編輯模式標題 */}
              {editingId && (
                <div className="mb-3 text-center">
                  <span className="text-sm text-blue-600 font-medium">編輯記錄</span>
                </div>
              )}

              {/* 類型切換 */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); setCategoryPath([]) }}
                  className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                    type === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); setCategoryPath([]) }}
                  className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                    type === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  收入
                </button>
              </div>

              {/* 金額 */}
              <div className="mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="輸入金額"
                  min="0"
                  className="w-full px-4 py-3 text-xl font-semibold text-center border-0 bg-white rounded-xl focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* 分類選擇 */}
              <div className="mb-4 bg-white rounded-xl p-3">
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
                  className="w-full px-4 py-2 border-0 bg-white rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !amount || !categoryId}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '儲存中...' : editingId ? '更新' : '確定'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-white text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 交易列表 */}
          <div>
            {transactions.length === 0 && !showForm ? (
              <div className="p-8 text-center text-gray-500">
                當日無交易記錄
              </div>
            ) : transactions.length > 0 && (
              <div className="divide-y">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleEdit(t)}
                    className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                      editingId === t.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          t.type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      >
                        {t.type === 'expense' ? '-' : '+'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {t.categoryPath?.join(' > ') || '未分類'}
                        </div>
                        {t.description && (
                          <div className="text-sm text-gray-500">{t.description}</div>
                        )}
                        {t.subscriptionId && (
                          <div className="text-xs text-blue-500">🔄 訂閱</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${
                          t.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="刪除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
