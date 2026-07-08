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

// 預設分類結構（只有大類和中類）
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: '飲食', level: 1, children: [
    { name: '早餐', level: 2 },
    { name: '午餐', level: 2 },
    { name: '晚餐', level: 2 },
    { name: '飲品', level: 2 },
    { name: '點心', level: 2 },
  ]},
  { name: '市場超市', level: 1, children: [
    { name: '青菜', level: 2 },
    { name: '肉類', level: 2 },
    { name: '成菜', level: 2 },
    { name: '水果', level: 2 },
    { name: 'SOGO', level: 2 },
    { name: '全聯', level: 2 },
    { name: '棉花田', level: 2 },
    { name: '其他', level: 2 },
  ]},
  { name: '會員費用', level: 1 },
  { name: '交通', level: 1, children: [
    { name: 'TPass', level: 2 },
    { name: '計程車', level: 2 },
  ]},
  { name: '娛樂', level: 1, children: [
    { name: '9局職棒', level: 2 },
    { name: 'PokemonGo', level: 2 },
    { name: '門票', level: 2 },
    { name: '其他', level: 2 },
  ]},
  { name: '醫療', level: 1 },
  { name: '球卡', level: 1, children: [
    { name: '寄件費', level: 2 },
    { name: 'Y拍手續費', level: 2 },
    { name: '福袋', level: 2 },
    { name: '買卡', level: 2 },
    { name: '其他', level: 2 },
  ]},
  { name: '旅遊', level: 1, children: [
    { name: '住宿', level: 2 },
    { name: '機票', level: 2 },
  ]},
  { name: '衣服', level: 1 },
  { name: '其他', level: 1 },
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '薪資', level: 1 },
  { name: '投資', level: 1 },
  { name: '球卡收入', level: 1 },
  { name: '其他', level: 1 },
] as const

// 輔助類型
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}
