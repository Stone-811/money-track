import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  activeTab: 'record' | 'stats' | 'budget'
  onTabChange: (tab: 'record' | 'stats' | 'budget') => void
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const tabs = [
    { id: 'record' as const, label: '記帳', icon: '📝' },
    { id: 'stats' as const, label: '統計', icon: '📊' },
    { id: 'budget' as const, label: '預算', icon: '💰' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            記帳小工具
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="text-xl mb-1">{tab.icon}</div>
              <div className="text-xs font-medium">{tab.label}</div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
