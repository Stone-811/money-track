import { ReactNode } from 'react'
import { PullToRefresh } from './PullToRefresh'

export type TabId = 'calendar' | 'stats' | 'subscription' | 'settings'

interface LayoutProps {
  children: ReactNode
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onRefresh?: () => Promise<void>
}

export function Layout({ children, activeTab, onTabChange, onRefresh }: LayoutProps) {
  const tabs = [
    { id: 'calendar' as const, label: '日曆', icon: '📅' },
    { id: 'stats' as const, label: '統計', icon: '📊' },
    { id: 'subscription' as const, label: '訂閱', icon: '🔄' },
    { id: 'settings' as const, label: '設定', icon: '⚙️' },
  ]

  const content = (
    <main className="max-w-lg mx-auto px-4 py-4">
      {children}
    </main>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 transition-colors">
      {/* Main Content */}
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh}>
          {content}
        </PullToRefresh>
      ) : content}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-bottom transition-colors">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
