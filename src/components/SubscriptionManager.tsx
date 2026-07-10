import { useState } from 'react'
import { Subscription, SubscriptionInput, Category, TransactionType } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface SubscriptionManagerProps {
  subscriptions: Subscription[]
  categories: Category[]
  addSubscription: (input: SubscriptionInput) => Promise<void>
  updateSubscription: (id: string, input: Partial<SubscriptionInput>) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function SubscriptionManager({
  subscriptions,
  categories,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getChildren,
  getCategoryPath
}: SubscriptionManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingDay, setBillingDay] = useState('1')
  const [mode, setMode] = useState<'auto' | 'remind'>('auto')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setName('')
    setAmount('')
    setBillingDay('1')
    setMode('auto')
    setCategoryId('')
    setCategoryPath([])
    setEditingSub(null)
    setShowForm(false)
  }

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setName(sub.name)
    setAmount(sub.amount.toString())
    setBillingDay(sub.billingDay.toString())
    setMode(sub.mode)
    setCategoryId(sub.categoryId)
    setCategoryPath(sub.categoryPath)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name || !amount || !categoryId) return

    setSubmitting(true)
    try {
      const input: SubscriptionInput = {
        name,
        amount: parseFloat(amount),
        categoryId,
        categoryPath,
        billingDay: parseInt(billingDay),
        mode,
        isActive: true
      }

      if (editingSub) {
        await updateSubscription(editingSub.id, input)
      } else {
        await addSubscription(input)
      }
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sub: Subscription) => {
    if (window.confirm(`確定要刪除「${sub.name}」訂閱嗎？`)) {
      await deleteSubscription(sub.id)
    }
  }

  const handleToggleActive = async (sub: Subscription) => {
    await updateSubscription(sub.id, { isActive: !sub.isActive })
  }

  const handleCategorySelect = (id: string, path: string[]) => {
    setCategoryId(id)
    setCategoryPath(path)
  }

  return (
    <div className="space-y-4">
      {/* 訂閱列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">每月訂閱</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none"
          >
            + 新增
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            尚未新增任何訂閱
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 flex items-center justify-between ${
                  !sub.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-medium">
                    {sub.billingDay}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{sub.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {sub.categoryPath.join(' > ')}
                      <span className="mx-1">·</span>
                      {sub.mode === 'auto' ? '自動記帳' : '手動確認'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${sub.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleToggleActive(sub)}
                    className={`p-1.5 rounded transition-colors focus:outline-none ${
                      sub.isActive
                        ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={sub.isActive ? '停用' : '啟用'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {sub.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(sub)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none"
                    title="編輯"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(sub)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors focus:outline-none"
                    title="刪除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 每月總計 */}
        {subscriptions.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">每月訂閱總計</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                ${subscriptions
                  .filter(s => s.isActive)
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 新增/編輯表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {editingSub ? '編輯訂閱' : '新增訂閱'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none text-gray-600 dark:text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 名稱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  名稱
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：Netflix、Spotify"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  金額
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="每月金額"
                  min="0"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 扣款日 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  每月扣款日
                </label>
                <select
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day} 日</option>
                  ))}
                </select>
              </div>

              {/* 模式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  記帳模式
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('auto')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors focus:outline-none ${
                      mode === 'auto'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    自動記帳
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('remind')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors focus:outline-none ${
                      mode === 'remind'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    手動確認
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {mode === 'auto'
                    ? '每月自動產生一筆支出記錄'
                    : '到期時會提醒你確認是否記帳'
                  }
                </p>
              </div>

              {/* 分類 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  分類
                </label>
                <CategoryPicker
                  type="expense"
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={handleCategorySelect}
                  getChildren={getChildren}
                  getCategoryPath={getCategoryPath}
                />
              </div>
            </div>

            {/* 按鈕 */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || !name || !amount || !categoryId}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none"
              >
                {submitting ? '儲存中...' : (editingSub ? '更新' : '新增')}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
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
