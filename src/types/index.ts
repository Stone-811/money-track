import { Timestamp } from 'firebase/firestore'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: Date
  createdAt: Date
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  category: string
  description: string
  date: Date
}

export interface Budget {
  id: string
  month: string // 格式: "2026-07"
  amount: number
  categories?: Record<string, number>
}

export interface BudgetInput {
  month: string
  amount: number
  categories?: Record<string, number>
}

// Firestore 版本的類型 (使用 Timestamp)
export interface TransactionDoc {
  type: TransactionType
  amount: number
  category: string
  description: string
  date: Timestamp
  createdAt: Timestamp
}

export interface BudgetDoc {
  month: string
  amount: number
  categories?: Record<string, number>
}

// 預設分類
export const EXPENSE_CATEGORIES = [
  '餐飲',
  '交通',
  '購物',
  '娛樂',
  '醫療',
  '居住',
  '教育',
  '其他'
] as const

export const INCOME_CATEGORIES = [
  '薪資',
  '獎金',
  '投資',
  '副業',
  '其他'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type IncomeCategory = typeof INCOME_CATEGORIES[number]
