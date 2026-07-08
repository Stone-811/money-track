import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudget } from './hooks/useBudget'
import { useCategories } from './hooks/useCategories'
import { useSubscriptions } from './hooks/useSubscriptions'
import { Layout, TabId } from './components/Layout'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { BudgetTracker } from './components/BudgetTracker'
import { CalendarView } from './components/CalendarView'
import { CategoryManager } from './components/CategoryManager'
import { SubscriptionManager } from './components/SubscriptionManager'
import { SubscriptionReminder } from './components/SubscriptionReminder'

function App() {
  const { uid, loading: authLoading } = useAuth()
  const {
    transactions,
    addTransaction,
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

  const [activeTab, setActiveTab] = useState<TabId>('calendar')

  // 當前月份
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // 本月統計
  const monthlyStats = useMemo(() => getMonthlyStats(currentMonth), [getMonthlyStats, currentMonth])
  const categoryStats = useMemo(() => getCategoryStats(currentMonth), [getCategoryStats, currentMonth])
  const currentBudget = useMemo(() => getBudgetForMonth(currentMonth), [getBudgetForMonth, currentMonth])

  // 處理設定預算
  const handleSetBudget = async (month: string, amount: number) => {
    await setBudget({ month, amount })
  }

  // Loading 狀態
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">登入中...</div>
        </div>
      </div>
    )
  }

  // 顯示 uid 用於除錯
  console.log('uid:', uid, 'categories:', categories.length)

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* 日曆頁面 */}
      {activeTab === 'calendar' && (
        <>
          {pendingReminders.length > 0 && (
            <div className="mb-4">
              <SubscriptionReminder
                pendingReminders={pendingReminders}
                onConfirm={confirmReminder}
                onSkip={skipReminder}
              />
            </div>
          )}
          <CalendarView
            transactions={transactions}
            subscriptions={subscriptions}
            categories={categories}
            onDeleteTransaction={deleteTransaction}
            onAddTransaction={addTransaction}
            getChildren={getChildren}
            getCategoryPath={getCategoryPath}
          />
        </>
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
            loading={catLoading}
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
