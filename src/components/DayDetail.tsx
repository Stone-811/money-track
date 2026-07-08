import { Transaction } from '../types'

interface DayDetailProps {
  date: Date
  transactions: Transaction[]
  onClose: () => void
  onDelete: (id: string) => void
}

export function DayDetail({ date, transactions, onClose, onDelete }: DayDetailProps) {
  const formatDate = (d: Date) => {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const handleDelete = (id: string) => {
    if (window.confirm('確定要刪除這筆記錄嗎？')) {
      onDelete(id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slide-up">
        {/* 標題 */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
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

        {/* 交易列表 */}
        <div className="overflow-y-auto max-h-[50vh]">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              當日無交易記錄
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between group">
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
                        {t.categoryPath.join(' > ')}
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
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
  )
}
