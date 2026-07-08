import { Subscription } from '../types'

interface SubscriptionReminderProps {
  pendingReminders: Subscription[]
  onConfirm: (sub: Subscription) => Promise<void>
  onSkip: (sub: Subscription) => Promise<void>
}

export function SubscriptionReminder({
  pendingReminders,
  onConfirm,
  onSkip
}: SubscriptionReminderProps) {
  if (pendingReminders.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔔</span>
        <h3 className="font-semibold text-yellow-800">待確認訂閱</h3>
      </div>

      <div className="space-y-3">
        {pendingReminders.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm"
          >
            <div>
              <div className="font-medium text-gray-900">{sub.name}</div>
              <div className="text-sm text-gray-500">
                {sub.categoryPath.join(' > ')} · 每月 {sub.billingDay} 日
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-600 mr-2">
                ${sub.amount.toLocaleString()}
              </span>
              <button
                onClick={() => onConfirm(sub)}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                確認記帳
              </button>
              <button
                onClick={() => onSkip(sub)}
                className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                跳過
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
