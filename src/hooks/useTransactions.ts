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
import { Transaction, TransactionInput, TransactionDoc } from '../types'

export function useTransactions(uid: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const transactionsRef = collection(db, 'users', uid, 'transactions')
    const q = query(transactionsRef, orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Transaction[] = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data() as TransactionDoc
        return {
          id: docSnap.id,
          type: docData.type,
          amount: docData.amount,
          categoryId: docData.categoryId || '',
          categoryPath: docData.categoryPath || [],
          description: docData.description,
          date: docData.date.toDate(),
          createdAt: docData.createdAt.toDate(),
          subscriptionId: docData.subscriptionId
        }
      })
      setTransactions(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  const addTransaction = useCallback(async (input: TransactionInput) => {
    if (!uid) return

    const transactionsRef = collection(db, 'users', uid, 'transactions')
    const docData: TransactionDoc = {
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      categoryPath: input.categoryPath,
      description: input.description,
      date: Timestamp.fromDate(input.date),
      createdAt: Timestamp.now(),
      subscriptionId: input.subscriptionId
    }
    await addDoc(transactionsRef, docData)
  }, [uid])

  const updateTransaction = useCallback(async (id: string, input: Partial<TransactionInput>) => {
    if (!uid) return

    const docRef = doc(db, 'users', uid, 'transactions', id)
    const updateData: Partial<TransactionDoc> = {}

    if (input.type !== undefined) updateData.type = input.type
    if (input.amount !== undefined) updateData.amount = input.amount
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId
    if (input.categoryPath !== undefined) updateData.categoryPath = input.categoryPath
    if (input.description !== undefined) updateData.description = input.description
    if (input.date !== undefined) updateData.date = Timestamp.fromDate(input.date)

    await updateDoc(docRef, updateData)
  }, [uid])

  const deleteTransaction = useCallback(async (id: string) => {
    if (!uid) return
    const docRef = doc(db, 'users', uid, 'transactions', id)
    await deleteDoc(docRef)
  }, [uid])

  // 統計資料
  const getMonthlyStats = useCallback((month: string) => {
    const filtered = transactions.filter(t => {
      const transMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      return transMonth === month
    })

    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return { income, expense, balance: income - expense }
  }, [transactions])

  const getCategoryStats = useCallback((month: string) => {
    const filtered = transactions.filter(t => {
      const transMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      return transMonth === month && t.type === 'expense'
    })

    const categoryMap: Record<string, number> = {}
    filtered.forEach(t => {
      // 使用大類作為統計
      const mainCategory = t.categoryPath[0] || '其他'
      categoryMap[mainCategory] = (categoryMap[mainCategory] || 0) + t.amount
    })

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  }, [transactions])

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyStats,
    getCategoryStats
  }
}
