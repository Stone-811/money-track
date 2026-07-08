import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  onSnapshot,
  setDoc,
  doc
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Budget, BudgetInput, BudgetDoc } from '../types'

export function useBudget(uid: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const budgetsRef = collection(db, 'users', uid, 'budgets')
    const q = query(budgetsRef)

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Budget[] = snapshot.docs.map((docSnap) => {
        const docData = docSnap.data() as BudgetDoc
        return {
          id: docSnap.id,
          month: docData.month,
          amount: docData.amount,
          categories: docData.categories
        }
      })
      setBudgets(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  const setBudget = useCallback(async (input: BudgetInput) => {
    if (!uid) return

    // 使用 month 作為文檔 ID，這樣同一個月份只會有一個預算
    const docRef = doc(db, 'users', uid, 'budgets', input.month)
    const docData: BudgetDoc = {
      month: input.month,
      amount: input.amount,
      categories: input.categories
    }
    await setDoc(docRef, docData)
  }, [uid])

  const getBudgetForMonth = useCallback((month: string): Budget | undefined => {
    return budgets.find(b => b.month === month)
  }, [budgets])

  return {
    budgets,
    loading,
    setBudget,
    getBudgetForMonth
  }
}
