import { useState, useEffect, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User
} from 'firebase/auth'
import { auth } from '../lib/firebase'

// 白名單 - 只允許這些 Email 登入
// 請將你的 Gmail 加入此處
const ALLOWED_EMAILS = [
  'stone870811@gmail.com',
  'tingo8320@gmail.com',
]

const googleProvider = new GoogleAuthProvider()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 檢查是否在白名單中（不區分大小寫）
        const email = (currentUser.email || '').toLowerCase()
        const isInWhitelist = ALLOWED_EMAILS.some(
          allowed => allowed.toLowerCase() === email
        )
        if (isInWhitelist) {
          setUser(currentUser)
          setIsAllowed(true)
          setError(null)
        } else {
          // 不在白名單，登出
          setUser(null)
          setIsAllowed(false)
          setError(`此帳號 (${currentUser.email}) 沒有使用權限`)
          firebaseSignOut(auth)
        }
      } else {
        setUser(null)
        setIsAllowed(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Google 登入
  const signIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: any) {
      console.error('登入失敗:', err)
      setError(err.message || '登入失敗')
      setLoading(false)
    }
  }, [])

  // 登出
  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth)
    } catch (err: any) {
      console.error('登出失敗:', err)
    }
  }, [])

  return {
    user,
    loading,
    uid: isAllowed ? user?.uid : undefined,
    isAllowed,
    error,
    signIn,
    signOut
  }
}
