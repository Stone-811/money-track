import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Subscription, SubscriptionInput, SubscriptionDoc, TransactionInput } from '../types'

export function useSubscriptions(
  uid: string | undefined,
  addTransaction: (input: TransactionInput) => Promise<void>
) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingReminders, setPendingReminders] = useState<Subscription[]>([])

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const subscriptionsRef = collection(db, 'users', uid, 'subscriptions')
    const q = query(subscriptionsRef, orderBy('billingDay', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Subscription[] = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data() as SubscriptionDoc
        return {
          id: docSnap.id,
          name: docData.name,
          amount: docData.amount,
          categoryId: docData.categoryId,
          categoryPath: docData.categoryPath,
          billingDay: docData.billingDay,
          mode: docData.mode,
          isActive: docData.isActive,
          lastProcessedMonth: docData.lastProcessedMonth,
          createdAt: docData.createdAt.toDate()
        }
      })
      setSubscriptions(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  // 處理自動記帳和提醒
  useEffect(() => {
    if (!uid || subscriptions.length === 0) return

    const processSubscriptions = async () => {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const today = now.getDate()

      const reminders: Subscription[] = []

      for (const sub of subscriptions) {
        if (!sub.isActive) continue
        if (sub.lastProcessedMonth === currentMonth) continue
        if (sub.billingDay > today) continue

        if (sub.mode === 'auto') {
          // 自動記帳
          await addTransaction({
            type: 'expense',
            amount: sub.amount,
            categoryId: sub.categoryId,
            categoryPath: sub.categoryPath,
            description: `${sub.name} (自動)`,
            date: new Date(now.getFullYear(), now.getMonth(), sub.billingDay),
            subscriptionId: sub.id
          })

          // 更新 lastProcessedMonth
          const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
          await updateDoc(docRef, { lastProcessedMonth: currentMonth })
        } else {
          // 提醒模式
          reminders.push(sub)
        }
      }

      setPendingReminders(reminders)
    }

    processSubscriptions()
  }, [uid, subscriptions, addTransaction])

  // 新增訂閱
  const addSubscription = useCallback(async (input: SubscriptionInput) => {
    if (!uid) return

    const subscriptionsRef = collection(db, 'users', uid, 'subscriptions')
    const docData: SubscriptionDoc = {
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId,
      categoryPath: input.categoryPath,
      billingDay: input.billingDay,
      mode: input.mode,
      isActive: input.isActive,
      createdAt: Timestamp.now()
    }
    await addDoc(subscriptionsRef, docData)
  }, [uid])

  // 更新訂閱
  const updateSubscription = useCallback(async (id: string, input: Partial<SubscriptionInput>) => {
    if (!uid) return

    const docRef = doc(db, 'users', uid, 'subscriptions', id)
    // 過濾掉 undefined 值，避免 Firestore 錯誤
    const updateData: Record<string, any> = {}
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
      }
    })
    if (Object.keys(updateData).length > 0) {
      await updateDoc(docRef, updateData)
    }
  }, [uid])

  // 刪除訂閱
  const deleteSubscription = useCallback(async (id: string) => {
    if (!uid) return

    const docRef = doc(db, 'users', uid, 'subscriptions', id)
    await deleteDoc(docRef)
  }, [uid])

  // 確認提醒（手動記帳）
  const confirmReminder = useCallback(async (sub: Subscription) => {
    if (!uid) return

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 新增交易
    await addTransaction({
      type: 'expense',
      amount: sub.amount,
      categoryId: sub.categoryId,
      categoryPath: sub.categoryPath,
      description: sub.name,
      date: new Date(now.getFullYear(), now.getMonth(), sub.billingDay),
      subscriptionId: sub.id
    })

    // 更新 lastProcessedMonth
    const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
    await updateDoc(docRef, { lastProcessedMonth: currentMonth })

    // 從待處理列表移除
    setPendingReminders(prev => prev.filter(s => s.id !== sub.id))
  }, [uid, addTransaction])

  // 跳過提醒
  const skipReminder = useCallback(async (sub: Subscription) => {
    if (!uid) return

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 只更新 lastProcessedMonth，不記帳
    const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
    await updateDoc(docRef, { lastProcessedMonth: currentMonth })

    // 從待處理列表移除
    setPendingReminders(prev => prev.filter(s => s.id !== sub.id))
  }, [uid])

  return {
    subscriptions,
    loading,
    pendingReminders,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    confirmReminder,
    skipReminder
  }
}
