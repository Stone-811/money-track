import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useTransactions } from './hooks/useTransactions'
import { useBudget } from './hooks/useBudget'
import { useCategories } from './hooks/useCategories'
import { useSubscriptions } from './hooks/useSubscriptions'
import { useDarkMode } from './hooks/useDarkMode'
import { Layout, TabId } from './components/Layout'
import { CategoryPieChart } from './components/CategoryPieChart'
import { MonthlyBarChart } from './components/MonthlyBarChart'
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
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    title: string
    message: string
    confirmText: string
    onConfirm: () => void
    isDanger?: boolean
  } | null>(null)
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  } = useTransactions(uid)
  const { setBudget, getBudgetForMonth } = useBudget(uid)
  const {
    categories,
    loading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    batchReorderCategories,
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

  // 切換分頁時關閉彈窗
  const handleTabChange = (tab: TabId) => {
    setShowCategoryManager(false)
    setShowConfirmDialog(null)
    setActiveTab(tab)
  }


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
    <Layout activeTab={activeTab} onTabChange={handleTabChange} onRefresh={handleRefresh} onQuickAdd={() => setShowQuickAdd(true)}>
      {/* 日曆頁面 */}
      {activeTab === 'calendar' && (
        <>
          {catLoading ? (
            <CalendarSkeleton />
          ) : (
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
                getBudgetForMonth={getBudgetForMonth}
                onSetBudget={handleSetBudget}
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
          {/* 外觀設定區塊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                外觀
              </h3>
            </div>
            {/* 深色模式切換 */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {isDark ? (
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">深色模式</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isDark ? '目前為深色主題' : '目前為淺色主題'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative w-14 h-7 rounded-full transition-colors focus:outline-none ${
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
          </div>

          {/* 資料管理區塊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                資料管理
              </h3>
            </div>
            {/* 分類管理 */}
            <button
              onClick={() => setShowCategoryManager(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800 dark:text-gray-200">分類管理</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">新增、編輯或刪除分類</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 通知設定區塊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                通知
              </h3>
            </div>
            {/* 訂閱提醒 */}
            <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">訂閱到期提醒</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">在訂閱扣款日收到通知</div>
                </div>
              </div>
              <button
                className="relative w-14 h-7 rounded-full transition-colors focus:outline-none bg-blue-500"
              >
                <div className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow translate-x-7" />
              </button>
            </div>
            {/* 預算警告 */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">預算超支警告</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">支出達預算 80% 時提醒</div>
                </div>
              </div>
              <button
                className="relative w-14 h-7 rounded-full transition-colors focus:outline-none bg-blue-500"
              >
                <div className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow translate-x-7" />
              </button>
            </div>
          </div>

          {/* 帳戶區塊 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                帳戶
              </h3>
            </div>
            {/* 登出按鈕 */}
            <button
              onClick={() => setShowConfirmDialog({
                title: '登出',
                message: '確定要登出嗎？',
                confirmText: '登出',
                isDanger: true,
                onConfirm: () => {
                  signOut()
                  setShowConfirmDialog(null)
                }
              })}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-red-600 dark:text-red-400">登出</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">登出目前的帳戶</div>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* 快速記帳彈窗 */}
      <QuickAddButton
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        categories={categories}
        onAdd={addTransaction}
        getChildren={getChildren}
        getCategoryPath={getCategoryPath}
      />

      {/* 分類管理彈窗 */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
          {/* 上方空白區域（點擊關閉） */}
          <div className="flex-1 sm:flex-none sm:h-[5vh]" onClick={() => setShowCategoryManager(false)} />
          {/* 彈窗內容 */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-t-xl sm:rounded-xl sm:mx-auto sm:w-full sm:max-w-lg max-h-[85vh] sm:max-h-[85vh] flex flex-col">
            {/* 標題列 */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 px-4 py-4 flex items-center justify-between border-b dark:border-gray-700 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分類管理</h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* 內容 */}
            <div className="flex-1 overflow-y-auto p-4 pb-safe">
              <CategoryManager
                categories={categories}
                loading={catLoading}
                buildTree={buildTree}
                addCategory={addCategory}
                updateCategory={updateCategory}
                deleteCategory={deleteCategory}
                batchReorderCategories={batchReorderCategories}
              />
            </div>
          </div>
          {/* 下方空白區域（桌面版點擊關閉） */}
          <div className="hidden sm:block sm:flex-1" onClick={() => setShowCategoryManager(false)} />
        </div>
      )}

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden shadow-xl">
            {/* 圖示 */}
            <div className="pt-6 pb-2 flex justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                showConfirmDialog.isDanger
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {showConfirmDialog.isDanger ? (
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
            {/* 標題與訊息 */}
            <div className="px-6 pb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {showConfirmDialog.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {showConfirmDialog.message}
              </p>
            </div>
            {/* 按鈕 */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
              >
                取消
              </button>
              <button
                onClick={showConfirmDialog.onConfirm}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors focus:outline-none ${
                  showConfirmDialog.isDanger
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {showConfirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default App
