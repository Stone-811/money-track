import { useState, useMemo } from 'react'
import { Subscription, SubscriptionInput, Category, TransactionType, Transaction } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface SubscriptionManagerProps {
  subscriptions: Subscription[]
  transactions: Transaction[]
  categories: Category[]
  addSubscription: (input: SubscriptionInput) => Promise<void>
  updateSubscription: (id: string, input: Partial<SubscriptionInput>) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>
  retrySubscription: (sub: Subscription) => Promise<boolean | undefined>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function SubscriptionManager({
  subscriptions,
  transactions,
  categories,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  retrySubscription,
  getChildren,
  getCategoryPath
}: SubscriptionManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  // 檢查訂閱本月是否已有交易記錄
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const today = now.getDate()

  const subscriptionStatus = useMemo(() => {
    const status: Record<string, { hasTransaction: boolean; isPending: boolean }> = {}

    for (const sub of subscriptions) {
      const hasTransaction = transactions.some(t =>
        t.subscriptionId === sub.id &&
        t.date.getFullYear() === currentYear &&
        t.date.getMonth() === currentMonth
      )
      // 已過扣款日但沒有交易記錄 = 待補記
      const isPending = sub.isActive && sub.billingDay <= today && !hasTransaction
      status[sub.id] = { hasTransaction, isPending }
    }
    return status
  }, [subscriptions, transactions, currentMonth, currentYear, today])

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

  const handleRetry = async (sub: Subscription) => {
    if (retrying) return
    setRetrying(sub.id)
    try {
      await retrySubscription(sub)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 訂閱列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-700/30">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-100 tracking-wide">每月訂閱</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-violet-700 transition-all active:scale-95 focus:outline-none shadow-sm"
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
            {subscriptions.map((sub) => {
              const status = subscriptionStatus[sub.id]
              const showRetryButton = status?.isPending && sub.mode === 'auto'

              return (
                <div
                  key={sub.id}
                  className={`p-4 ${!sub.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* 日期徽章 */}
                    <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-sm font-semibold ${
                      status?.hasTransaction
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    }`}>
                      {sub.billingDay}
                    </div>

                    {/* 內容區 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{sub.name}</span>
                          {status?.hasTransaction && (
                            <span className="flex-shrink-0 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                              已記帳
                            </span>
                          )}
                          {showRetryButton && (
                            <span className="flex-shrink-0 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                              待補記
                            </span>
                          )}
                        </div>
                        <span className="flex-shrink-0 font-semibold text-rose-500 dark:text-rose-400 tabular-nums">
                          ${sub.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {sub.categoryPath.join(' › ')} · {sub.mode === 'auto' ? '自動' : '手動'}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {showRetryButton && (
                            <button
                              onClick={() => handleRetry(sub)}
                              disabled={retrying === sub.id}
                              className="px-2 py-1 text-[10px] bg-amber-500 text-white rounded-md font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors focus:outline-none"
                            >
                              {retrying === sub.id ? '...' : '補記'}
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(sub)}
                            className={`p-1 rounded-lg transition-colors focus:outline-none ${
                              sub.isActive
                                ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={sub.isActive ? '停用' : '啟用'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {sub.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(sub)}
                            className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg transition-colors focus:outline-none"
                            title="編輯"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors focus:outline-none"
                            title="刪除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  名稱
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：Netflix、Spotify"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
              </div>

              {/* 金額 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  金額
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="每月金額"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
              </div>

              {/* 扣款日 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  每月扣款日
                </label>
                <select
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 transition-all"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>{day} 日</option>
                  ))}
                </select>
              </div>

              {/* 模式 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                  記帳模式
                </label>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode('auto')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none ${
                      mode === 'auto'
                        ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    自動記帳
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('remind')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none ${
                      mode === 'remind'
                        ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || !name || !amount || !categoryId}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] focus:outline-none"
              >
                {submitting ? '儲存中...' : (editingSub ? '更新' : '新增')}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
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
