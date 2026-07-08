import { useState, useEffect, FormEvent } from 'react'
import { TransactionInput, TransactionType, Category } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface TransactionFormProps {
  onSubmit: (input: TransactionInput) => Promise<void>
  initialValues?: Partial<TransactionInput & { type: TransactionType }>
  onCancel?: () => void
  categories: Category[]
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function TransactionForm({
  onSubmit,
  initialValues,
  onCancel,
  categories,
  getChildren,
  getCategoryPath
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialValues?.type || 'expense')
  const [amount, setAmount] = useState(initialValues?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId || '')
  const [categoryPath, setCategoryPath] = useState<string[]>(initialValues?.categoryPath || [])
  const [description, setDescription] = useState(initialValues?.description || '')
  const [date, setDate] = useState(
    initialValues?.date
      ? initialValues.date.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [submitting, setSubmitting] = useState(false)

  // 當 type 改變時，重置分類
  useEffect(() => {
    if (!initialValues) {
      setCategoryId('')
      setCategoryPath([])
    }
  }, [type, initialValues])

  const handleCategorySelect = (id: string, path: string[]) => {
    setCategoryId(id)
    setCategoryPath(path)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId) return

    setSubmitting(true)
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        categoryId,
        categoryPath,
        description,
        date: new Date(date)
      })
      // 重置表單
      setAmount('')
      setCategoryId('')
      setCategoryPath([])
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">
        {initialValues ? '編輯記錄' : '新增記錄'}
      </h2>

      {/* 類型切換 */}
      <div className="flex gap-4 mb-4">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
            type === 'income'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          收入
        </button>
      </div>

      {/* 金額 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          金額
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="輸入金額"
          min="0"
          step="1"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 分類 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          分類
        </label>
        <CategoryPicker
          type={type}
          categories={categories}
          selectedId={categoryId}
          onSelect={handleCategorySelect}
          getChildren={getChildren}
          getCategoryPath={getCategoryPath}
        />
      </div>

      {/* 日期 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          日期
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 備註 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備註
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="輸入備註（選填）"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 按鈕 */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !categoryId}
          className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '儲存中...' : (initialValues ? '更新' : '新增')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
