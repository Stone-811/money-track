import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudget } from './hooks/useBudget'
import { useCategories } from './hooks/useCategories'
import { useSubscriptions } from './hooks/useSubscriptions'
import { Layout, TabId } from './components/Layout'
import { TransactionForm } from './components/TransactionForm'
import { TransactionList } from './components/TransactionList'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { BudgetTracker } from './components/BudgetTracker'
import { CalendarView } from './components/CalendarView'
import { CategoryManager } from './components/CategoryManager'
import { SubscriptionManager } from './components/SubscriptionManager'
import { SubscriptionReminder } from './components/SubscriptionReminder'
import { Transaction, TransactionInput } from './types'

function App() {
  const { uid, loading: authLoading } = useAuth()
  const {
    transactions,
    loading: transLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getCategoryStats,
    getMonthlyStats
  } = useTransactions(uid)
  const { setBudget, getBudgetForMonth } = useBudget(uid)
  const {
    categories,
    loading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    buildTree,
    getCategoryPath,
    getChildren
  } = useCategories(uid)
  const {
    subscriptions,
    pendingReminders,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    confirmReminder,
    skipReminder
  } = useSubscriptions(uid, addTransaction)

  const [activeTab, setActiveTab] = useState<TabId>('record')
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
  if (authLoading || transLoading || catLoading) {
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
      {/* 訂閱提醒 */}
      {pendingReminders.length > 0 && activeTab === 'record' && (
        <div className="mb-4">
          <SubscriptionReminder
            pendingReminders={pendingReminders}
            onConfirm={confirmReminder}
            onSkip={skipReminder}
          />
        </div>
      )}

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
            initialValues={editingTransaction ? {
              ...editingTransaction,
              type: editingTransaction.type
            } : undefined}
            onCancel={editingTransaction ? () => setEditingTransaction(null) : undefined}
            categories={categories}
            getChildren={getChildren}
            getCategoryPath={getCategoryPath}
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

      {/* 日曆頁面 */}
      {activeTab === 'calendar' && (
        <CalendarView
          transactions={transactions}
          subscriptions={subscriptions}
          onDeleteTransaction={deleteTransaction}
        />
      )}

      {/* 統計頁面 */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <CategoryPieChart data={categoryStats} />
          <MonthlyBarChart transactions={transactions} />

          {/* 預算追蹤 */}
          <BudgetTracker
            currentMonth={currentMonth}
            budget={currentBudget}
            spent={monthlyStats.expense}
            onSetBudget={handleSetBudget}
          />
        </div>
      )}

      {/* 訂閱頁面 */}
      {activeTab === 'subscription' && (
        <SubscriptionManager
          subscriptions={subscriptions}
          categories={categories}
          addSubscription={addSubscription}
          updateSubscription={updateSubscription}
          deleteSubscription={deleteSubscription}
          getChildren={getChildren}
          getCategoryPath={getCategoryPath}
        />
      )}

      {/* 設定頁面 */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <CategoryManager
            categories={categories}
            buildTree={buildTree}
            addCategory={addCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
          />
        </div>
      )}
    </Layout>
  )
}

export default App
