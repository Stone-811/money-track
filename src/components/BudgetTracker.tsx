import { useState, FormEvent } from 'react'
import { Budget } from '../types'

interface BudgetTrackerProps {
  currentMonth: string
  budget: Budget | undefined
  spent: number
  onSetBudget: (month: string, amount: number) => Promise<void>
}

export function BudgetTracker({ currentMonth, budget, spent, onSetBudget }: BudgetTrackerProps) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(budget?.amount?.toString() || '')
  const [saving, setSaving] = useState(false)

  const budgetAmount = budget?.amount || 0
  const remaining = budgetAmount - spent
  const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0
  const isOverBudget = remaining < 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!amount) return

    setSaving(true)
    try {
      await onSetBudget(currentMonth, parseFloat(amount))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    return `${year}年${parseInt(m)}月`
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">預算追蹤</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatMonth(currentMonth)}</span>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              設定月預算
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="輸入預算金額"
              min="0"
              step="100"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      ) : budgetAmount > 0 ? (
        <div className="space-y-4">
          {/* 進度條 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">已花費</span>
              <span className={isOverBudget ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                ${spent.toLocaleString()} / ${budgetAmount.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* 剩餘金額 */}
          <div className={`text-center p-4 rounded-lg ${
            isOverBudget
              ? 'bg-red-50 dark:bg-red-900/30'
              : 'bg-green-50 dark:bg-green-900/30'
          }`}>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {isOverBudget ? '超出預算' : '剩餘預算'}
            </div>
            <div className={`text-2xl font-bold ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              ${Math.abs(remaining).toLocaleString()}
            </div>
          </div>

          <button
            onClick={() => { setAmount(budgetAmount.toString()); setEditing(true) }}
            className="w-full py-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-medium transition-colors"
          >
            修改預算
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-gray-500 dark:text-gray-400 mb-4">尚未設定本月預算</div>
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            設定預算
          </button>
        </div>
      )}
    </div>
  )
}
