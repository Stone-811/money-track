import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // 檢查 localStorage
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      return stored === 'true'
    }
    // 檢查系統偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // 更新 DOM
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // 儲存偏好
    localStorage.setItem('darkMode', String(isDark))
  }, [isDark])

  // 監聽系統偏好變化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // 只有在沒有手動設定時才跟隨系統
      if (localStorage.getItem('darkMode') === null) {
        setIsDark(e.matches)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggle = () => setIsDark(prev => !prev)

  return { isDark, toggle, setIsDark }
}
