import { useState, useRef, useCallback, useEffect, ReactNode } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef(0)
  const isPullingRef = useRef(false)

  const THRESHOLD = 80 // 觸發刷新的距離

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // 只有在頁面頂部時才啟用下拉
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isRefreshing || !isPullingRef.current) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current

    // 只處理向下拉動且在頁面頂部
    if (diff > 0 && window.scrollY === 0) {
      // 防止頁面滾動
      e.preventDefault()
      // 使用阻尼效果，拉越遠越難拉
      const dampedDistance = Math.min(diff * 0.5, 120)
      setPullDistance(dampedDistance)
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(THRESHOLD)

      try {
        await onRefresh()
        // 震動回饋
        if ('vibrate' in navigator) {
          navigator.vibrate(30)
        }
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
    startYRef.current = 0
    isPullingRef.current = false
  }, [pullDistance, isRefreshing, onRefresh])

  useEffect(() => {
    // 使用 passive: false 以便能調用 preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <>
      {/* 下拉指示器 - 固定在頂部 */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 overflow-hidden bg-gradient-to-b from-blue-50 dark:from-blue-900/50 to-transparent"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <div className={`flex items-center gap-2 ${isRefreshing ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {isRefreshing ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">更新中...</span>
            </>
          ) : pullDistance >= THRESHOLD ? (
            <>
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-sm font-medium">放開以刷新</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="text-sm font-medium">下拉刷新</span>
            </>
          )}
        </div>
      </div>

      {/* 內容偏移 */}
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: pullDistance === 0 ? 'transform 0.2s' : 'none' }}>
        {children}
      </div>
    </>
  )
}
