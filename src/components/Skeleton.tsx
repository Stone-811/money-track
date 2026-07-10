interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} style={style} />
  )
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* 預算區塊骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-3 w-full mb-4" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>

      {/* 日曆區塊骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* 月份標題 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
            <Skeleton className="h-6 w-32 bg-white/20" />
            <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12 rounded-xl bg-white/10" />
            <Skeleton className="h-12 rounded-xl bg-white/10" />
            <Skeleton className="h-12 rounded-xl bg-white/10" />
          </div>
        </div>

        {/* 星期標題 */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 py-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-center">
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>

        {/* 日曆格子 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-r border-gray-100 dark:border-gray-700 p-1 flex flex-col items-center">
              <Skeleton className="h-6 w-6 rounded-full mb-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {/* 圓餅圖骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* 長條圖骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="h-64 flex items-end gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton className={`w-full rounded-t`} style={{ height: `${Math.random() * 60 + 20}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
