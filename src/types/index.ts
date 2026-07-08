import { Timestamp } from 'firebase/firestore'

export type TransactionType = 'income' | 'expense'

// 分類結構
export interface Category {
  id: string
  name: string
  type: TransactionType
  parentId: string | null  // null = 大類
  level: 1 | 2 | 3         // 1=大類, 2=中類, 3=小類
  icon?: string
  order: number
}

export interface CategoryInput {
  name: string
  type: TransactionType
  parentId: string | null
  level: 1 | 2 | 3
  icon?: string
  order: number
}

// 交易記錄
export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  categoryPath: string[]  // ['食', '外食', '早餐'] 用於顯示
  description: string
  date: Date
  createdAt: Date
  subscriptionId?: string  // 如果是訂閱產生的
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  categoryId: string
  categoryPath: string[]
  description: string
  date: Date
  subscriptionId?: string
}

// 預算設定
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

// 訂閱
export interface Subscription {
  id: string
  name: string
  amount: number
  categoryId: string
  categoryPath: string[]
  billingDay: number        // 1-31
  mode: 'auto' | 'remind'
  isActive: boolean
  lastProcessedMonth?: string  // "2026-07"
  createdAt: Date
}

export interface SubscriptionInput {
  name: string
  amount: number
  categoryId: string
  categoryPath: string[]
  billingDay: number
  mode: 'auto' | 'remind'
  isActive: boolean
}

// Firestore 版本的類型 (使用 Timestamp)
export interface TransactionDoc {
  type: TransactionType
  amount: number
  categoryId: string
  categoryPath: string[]
  description: string
  date: Timestamp
  createdAt: Timestamp
  subscriptionId?: string
}

export interface CategoryDoc {
  name: string
  type: TransactionType
  parentId: string | null
  level: 1 | 2 | 3
  icon?: string
  order: number
}

export interface BudgetDoc {
  month: string
  amount: number
  categories?: Record<string, number>
}

export interface SubscriptionDoc {
  name: string
  amount: number
  categoryId: string
  categoryPath: string[]
  billingDay: number
  mode: 'auto' | 'remind'
  isActive: boolean
  lastProcessedMonth?: string
  createdAt: Timestamp
}

// 預設分類結構
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '食', level: 1, children: [
    { name: '外食', level: 2, children: [
      { name: '早餐', level: 3 },
      { name: '午餐', level: 3 },
      { name: '晚餐', level: 3 },
      { name: '宵夜', level: 3 },
    ]},
    { name: '飲料', level: 2 },
    { name: '食材', level: 2 },
  ]},
  { name: '衣', level: 1 },
  { name: '住', level: 1, children: [
    { name: '房租', level: 2 },
    { name: '水電', level: 2 },
    { name: '網路', level: 2 },
    { name: '管理費', level: 2 },
  ]},
  { name: '行', level: 1, children: [
    { name: '交通', level: 2, children: [
      { name: '捷運', level: 3 },
      { name: '公車', level: 3 },
      { name: '計程車', level: 3 },
    ]},
    { name: '油費', level: 2 },
    { name: '停車', level: 2 },
  ]},
  { name: '育', level: 1, children: [
    { name: '學費', level: 2 },
    { name: '書籍', level: 2 },
    { name: '課程', level: 2 },
  ]},
  { name: '樂', level: 1, children: [
    { name: '娛樂', level: 2 },
    { name: '訂閱', level: 2 },
    { name: '旅遊', level: 2 },
  ]},
  { name: '醫療', level: 1 },
  { name: '其他', level: 1 },
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '薪資', level: 1, children: [
    { name: '本薪', level: 2 },
    { name: '獎金', level: 2 },
    { name: '加班費', level: 2 },
  ]},
  { name: '投資', level: 1, children: [
    { name: '股票', level: 2 },
    { name: '基金', level: 2 },
    { name: '利息', level: 2 },
  ]},
  { name: '副業', level: 1 },
  { name: '其他', level: 1 },
] as const

// 輔助類型
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}
