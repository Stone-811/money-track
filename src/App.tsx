import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudget } from './hooks/useBudget'
import { useCategories } from './hooks/useCategories'
import { useSubscriptions } from './hooks/useSubscriptions'
import { useDarkMode } from './hooks/useDarkMode'
import { Layout, TabId } from './components/Layout'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { BudgetTracker } from './components/BudgetTracker'
import { CalendarView } from './components/CalendarView'
import { CategoryManager } from './components/CategoryManager'
import { SubscriptionManager } from './components/SubscriptionManager'
import { SubscriptionReminder } from './components/SubscriptionReminder'
import { LoginScreen } from './components/LoginScreen'
import { QuickAddButton } from './components/QuickAddButton'
import { CalendarSkeleton, StatsSkeleton } from './components/Skeleton'

function App() {
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const { uid, loading: authLoading, signIn, signOut, error: authError } = useAuth()
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyStats
  } = useTransactions(uid)
  const { setBudget, getBudgetForMonth } = useBudget(uid)
  const {
    categories,
    loading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategories,
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
  } = useSubscriptions(uid, addTransaction, transactions)

  const [activeTab, setActiveTab] = useState<TabId>('calendar')

  // 當前月份
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  // 計算未處理訂閱金額
  const pendingSubscriptionAmount = useMemo(() => {
    const now = new Date()
    const today = now.getDate()
    return subscriptions
      .filter(s =>
        s.isActive &&
        s.billingDay <= today &&
        s.lastProcessedMonth !== currentMonth
      )
      .reduce((sum, s) => sum + s.amount, 0)
  }, [subscriptions, currentMonth])

  // 本月統計（包含未處理訂閱）
  const monthlyStats = useMemo(() => {
    const stats = getMonthlyStats(currentMonth)
    return {
      ...stats,
      expense: stats.expense + pendingSubscriptionAmount,
      balance: stats.income - (stats.expense + pendingSubscriptionAmount)
    }
  }, [getMonthlyStats, currentMonth, pendingSubscriptionAmount])
  // categoryStats 已移至 CategoryPieChart 內部計算
  const currentBudget = useMemo(() => getBudgetForMonth(currentMonth), [getBudgetForMonth, currentMonth])

  // 處理設定預算
  const handleSetBudget = async (month: string, amount: number) => {
    await setBudget({ month, amount })
  }

  // 下拉刷新（Firestore 已是即時同步，這裡提供視覺回饋）
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Loading 狀態
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600 dark:text-gray-400">載入中...</div>
        </div>
      </div>
    )
  }

  // 未登入顯示登入畫面
  if (!uid) {
    return <LoginScreen onSignIn={signIn} loading={authLoading} error={authError} />
  }

  // 顯示 uid 用於除錯
  console.log('uid:', uid, 'categories:', categories.length)

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onRefresh={handleRefresh}>
      {/* 日曆頁面 */}
      {activeTab === 'calendar' && (
        <>
          {catLoading ? (
            <CalendarSkeleton />
          ) : (
            <>
              {/* 預算追蹤 */}
              <div className="mb-4">
                <BudgetTracker
                  currentMonth={currentMonth}
                  budget={currentBudget}
                  spent={monthlyStats.expense}
                  onSetBudget={handleSetBudget}
                />
              </div>

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
                onUpdateTransaction={updateTransaction}
                getChildren={getChildren}
                getCategoryPath={getCategoryPath}
              />
            </>
          )}
        </>
      )}

      {/* 統計頁面 */}
      {activeTab === 'stats' && (
        catLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="space-y-4">
            <CategoryPieChart transactions={transactions} />
            <MonthlyBarChart transactions={transactions} />
          </div>
        )
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
          {/* 深色模式切換 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isDark ? '🌙' : '☀️'}</span>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">深色模式</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {isDark ? '目前為深色主題' : '目前為淺色主題'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isDark ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 分類管理 */}
          <CategoryManager
            categories={categories}
            loading={catLoading}
            buildTree={buildTree}
            addCategory={addCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
          />

          {/* 重置分類按鈕 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <button
              onClick={async () => {
                if (confirm('確定要重置所有分類嗎？這將刪除所有自訂分類並恢復預設值。')) {
                  await resetCategories()
                }
              }}
              className="w-full py-3 px-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors font-medium"
            >
              重置為預設分類
            </button>
          </div>

          {/* 登出按鈕 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <button
              onClick={signOut}
              className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
            >
              登出
            </button>
          </div>
        </div>
      )}
      {/* 快速記帳按鈕 */}
      <QuickAddButton
        categories={categories}
        onAdd={addTransaction}
        getChildren={getChildren}
        getCategoryPath={getCategoryPath}
      />
    </Layout>
  )
}

export default App
