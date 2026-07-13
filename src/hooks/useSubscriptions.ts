import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Subscription, SubscriptionInput, SubscriptionDoc, TransactionInput, Transaction } from '../types'

export function useSubscriptions(
  uid: string | undefined,
  addTransaction: (input: TransactionInput) => Promise<void>,
  deleteTransaction: (id: string) => void,
  transactions?: Transaction[]
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

  // 追蹤已處理的訂閱，避免重複執行
  const processingRef = useRef<Set<string>>(new Set())

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

        // 檢查是否正在處理中，避免重複
        const processingKey = `${sub.id}-${currentMonth}`
        if (processingRef.current.has(processingKey)) continue

        // 檢查是否已經有該月份的交易記錄
        if (transactions) {
          const existingTransaction = transactions.find(t =>
            t.subscriptionId === sub.id &&
            t.date.getFullYear() === now.getFullYear() &&
            t.date.getMonth() === now.getMonth()
          )
          if (existingTransaction) {
            // 已有交易但 lastProcessedMonth 未更新，修正它
            const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
            await updateDoc(docRef, { lastProcessedMonth: currentMonth })
            continue
          }
        }

        if (sub.mode === 'auto') {
          // 標記為處理中
          processingRef.current.add(processingKey)

          try {
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

            // 只有成功才更新 lastProcessedMonth
            const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
            await updateDoc(docRef, { lastProcessedMonth: currentMonth })
            console.log(`✅ 自動記帳成功: ${sub.name} $${sub.amount}`)
          } catch (error) {
            console.error(`❌ 自動記帳失敗: ${sub.name}`, error)
            // 移除處理中標記，允許下次重試
            processingRef.current.delete(processingKey)
          }
        } else {
          // 提醒模式
          reminders.push(sub)
        }
      }

      setPendingReminders(reminders)
    }

    processSubscriptions()
  }, [uid, subscriptions, addTransaction, transactions])

  // 新增訂閱（若已過扣款日，自動記帳模式會立即寫入交易）
  const addSubscription = useCallback(async (input: SubscriptionInput) => {
    if (!uid) return

    const now = new Date()
    const today = now.getDate()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const shouldProcessNow = input.isActive && input.billingDay <= today

    const subscriptionsRef = collection(db, 'users', uid, 'subscriptions')
    const docData: SubscriptionDoc = {
      name: input.name,
      amount: input.amount,
      categoryId: input.categoryId,
      categoryPath: input.categoryPath,
      billingDay: input.billingDay,
      mode: input.mode,
      isActive: input.isActive,
      createdAt: Timestamp.now(),
      // 若已過扣款日，設定 lastProcessedMonth 避免重複處理
      ...(shouldProcessNow && { lastProcessedMonth: currentMonth })
    }
    const docRef = await addDoc(subscriptionsRef, docData)

    // 若已過扣款日且為自動模式，立即寫入交易
    if (shouldProcessNow && input.mode === 'auto') {
      await addTransaction({
        type: 'expense',
        amount: input.amount,
        categoryId: input.categoryId,
        categoryPath: input.categoryPath,
        description: `${input.name} (自動)`,
        date: new Date(now.getFullYear(), now.getMonth(), input.billingDay),
        subscriptionId: docRef.id
      })
      console.log(`✅ 新增訂閱並自動記帳: ${input.name} $${input.amount}`)
    }
  }, [uid, addTransaction])

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

  // 檢查訂閱是否有本月交易
  const hasCurrentMonthTransaction = useCallback((id: string): boolean => {
    if (!transactions) return false
    const now = new Date()
    return transactions.some(t =>
      t.subscriptionId === id &&
      t.date.getFullYear() === now.getFullYear() &&
      t.date.getMonth() === now.getMonth()
    )
  }, [transactions])

  // 刪除訂閱（可選是否刪除本月交易）
  const deleteSubscription = useCallback(async (id: string, deleteCurrentMonthTx: boolean = false) => {
    if (!uid) return

    // 如果要刪除本月交易
    if (deleteCurrentMonthTx && transactions) {
      const now = new Date()
      const currentMonthTransactions = transactions.filter(t =>
        t.subscriptionId === id &&
        t.date.getFullYear() === now.getFullYear() &&
        t.date.getMonth() === now.getMonth()
      )
      for (const t of currentMonthTransactions) {
        deleteTransaction(t.id)
      }
    }

    const docRef = doc(db, 'users', uid, 'subscriptions', id)
    await deleteDoc(docRef)
  }, [uid, transactions, deleteTransaction])

  // 確認提醒（手動記帳）
  const confirmReminder = useCallback(async (sub: Subscription) => {
    if (!uid) return

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    try {
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

      // 只有成功才更新 lastProcessedMonth
      const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
      await updateDoc(docRef, { lastProcessedMonth: currentMonth })

      // 從待處理列表移除
      setPendingReminders(prev => prev.filter(s => s.id !== sub.id))
      console.log(`✅ 手動記帳成功: ${sub.name} $${sub.amount}`)
    } catch (error) {
      console.error(`❌ 手動記帳失敗: ${sub.name}`, error)
      throw error  // 重新拋出讓 UI 可以處理
    }
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

  // 手動補記訂閱（用於修復漏記的情況）
  const retrySubscription = useCallback(async (sub: Subscription) => {
    if (!uid) return

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    try {
      // 新增交易
      await addTransaction({
        type: 'expense',
        amount: sub.amount,
        categoryId: sub.categoryId,
        categoryPath: sub.categoryPath,
        description: `${sub.name} (補記)`,
        date: new Date(now.getFullYear(), now.getMonth(), sub.billingDay),
        subscriptionId: sub.id
      })

      // 更新 lastProcessedMonth
      const docRef = doc(db, 'users', uid, 'subscriptions', sub.id)
      await updateDoc(docRef, { lastProcessedMonth: currentMonth })

      console.log(`✅ 補記成功: ${sub.name} $${sub.amount}`)
      return true
    } catch (error) {
      console.error(`❌ 補記失敗: ${sub.name}`, error)
      throw error
    }
  }, [uid, addTransaction])

  return {
    subscriptions,
    loading,
    pendingReminders,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    hasCurrentMonthTransaction,
    confirmReminder,
    skipReminder,
    retrySubscription
  }
}
