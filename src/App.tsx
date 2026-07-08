import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudget } from './hooks/useBudget'
import { Layout } from './components/Layout'
import { TransactionForm } from './components/TransactionForm'
import { TransactionList } from './components/TransactionList'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { BudgetTracker } from './components/BudgetTracker'
import { Transaction, TransactionInput } from './types'

function App() {
  const { uid, loading: authLoading } = useAuth()
  const { transactions, loading: transLoading, addTransaction, updateTransaction, deleteTransaction, getCategoryStats, getMonthlyStats } = useTransactions(uid)
  const { setBudget, getBudgetForMonth } = useBudget(uid)

  const [activeTab, setActiveTab] = useState<'record' | 'stats' | 'budget'>('record')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // 當前月份
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // 本月統計
  const monthlyStats = useMemo(() => getMonthlyStats(currentMonth), [getMonthlyStats, currentMonth])
  const categoryStats = useMemo(() => getCategoryStats(currentMonth), [getCategoryStats, currentMonth])
  const currentBudget = useMemo(() => getBudgetForMonth(currentMonth), [getBudgetForMonth, currentMonth])

  // 處理新增/編輯
  const handleSubmit = async (input: TransactionInput) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, input)
      setEditingTransaction(null)
    } else {
      await addTransaction(input)
    }
  }

  // 處理刪除
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這筆記錄嗎？')) {
      await deleteTransaction(id)
    }
  }

  // 處理設定預算
  const handleSetBudget = async (month: string, amount: number) => {
    await setBudget({ month, amount })
  }

  // Loading 狀態
  if (authLoading || transLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">載入中...</div>
        </div>
      </div>
    )
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* 記帳頁面 */}
      {activeTab === 'record' && (
        <div className="space-y-4">
          {/* 本月摘要 */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">收入</div>
                <div className="text-lg font-semibold text-green-600">
                  ${monthlyStats.income.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">支出</div>
                <div className="text-lg font-semibold text-red-600">
                  ${monthlyStats.expense.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">結餘</div>
                <div className={`text-lg font-semibold ${monthlyStats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${monthlyStats.balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* 表單 */}
          <TransactionForm
            onSubmit={handleSubmit}
            initialValues={editingTransaction || undefined}
            onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
          />

          {/* 交易列表 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">本月記錄</h2>
            <TransactionList
              transactions={transactions.filter(t => {
                const transMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
                return transMonth === currentMonth
              })}
              onEdit={setEditingTransaction}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      {/* 統計頁面 */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <CategoryPieChart data={categoryStats} />
          <MonthlyBarChart transactions={transactions} />
        </div>
      )}

      {/* 預算頁面 */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          <BudgetTracker
            currentMonth={currentMonth}
            budget={currentBudget}
            spent={monthlyStats.expense}
            onSetBudget={handleSetBudget}
          />

          {/* 本月支出明細 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">分類支出明細</h3>
            {categoryStats.length > 0 ? (
              <div className="space-y-3">
                {categoryStats.sort((a, b) => b.value - a.value).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="text-gray-700">{cat.name}</span>
                    <span className="font-medium text-red-600">
                      ${cat.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                本月尚無支出
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default App
