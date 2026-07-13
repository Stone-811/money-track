import { ReactNode } from 'react'
import { PullToRefresh } from './PullToRefresh'

export type TabId = 'calendar' | 'stats' | 'subscription' | 'settings'

interface LayoutProps {
  children: ReactNode
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onRefresh?: () => Promise<void>
  onQuickAdd?: () => void
}

export function Layout({ children, activeTab, onTabChange, onRefresh, onQuickAdd }: LayoutProps) {
  const leftTabs = [
    { id: 'calendar' as const, label: '日曆', icon: '📅' },
    { id: 'stats' as const, label: '統計', icon: '📊' },
  ]
  const rightTabs = [
    { id: 'subscription' as const, label: '訂閱', icon: '🔄' },
    { id: 'settings' as const, label: '設定', icon: '⚙️' },
  ]

  const content = (
    <main className="max-w-lg mx-auto px-3 py-3">
      {children}
    </main>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
      {/* Main Content */}
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh}>
          {content}
        </PullToRefresh>
      ) : content}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom transition-colors">
        <div className="max-w-lg mx-auto flex items-end relative">
          {/* Left tabs */}
          {leftTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 text-center transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className="text-xl mb-0.5">{tab.icon}</div>
              <div className="text-xs font-medium">{tab.label}</div>
            </button>
          ))}

          {/* Center Add Button */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={onQuickAdd}
              className="absolute -top-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="py-3 text-center">
              <div className="text-xl mb-0.5 opacity-0">➕</div>
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500">記帳</div>
            </div>
          </div>

          {/* Right tabs */}
          {rightTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 text-center transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className="text-xl mb-0.5">{tab.icon}</div>
              <div className="text-xs font-medium">{tab.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
