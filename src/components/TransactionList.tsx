import { Transaction } from '../types'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString()
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        尚無交易記錄
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    transaction.type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {transaction.type === 'expense' ? '-' : '+'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {transaction.category}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(transaction.date)}
                    {transaction.description && ` · ${transaction.description}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold ${
                    transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {transaction.type === 'expense' ? '-' : '+'}${formatAmount(transaction.amount)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="編輯"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
        ))}
      </div>
    </div>
  )
}
