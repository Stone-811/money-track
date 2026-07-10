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
  { name: '飲食', icon: '🍽️', level: 1, children: [
    { name: '早餐', icon: '🥐', level: 2 },
    { name: '午餐', icon: '🍱', level: 2 },
    { name: '晚餐', icon: '🍝', level: 2 },
    { name: '飲品', icon: '🧋', level: 2 },
    { name: '點心', icon: '🍰', level: 2 },
  ]},
  { name: '市場超市', icon: '🛒', level: 1, children: [
    { name: '青菜', icon: '🥬', level: 2 },
    { name: '肉類', icon: '🥩', level: 2 },
    { name: '成菜', icon: '🥘', level: 2 },
    { name: '水果', icon: '🍎', level: 2 },
    { name: 'SOGO', icon: '🏬', level: 2 },
    { name: '全聯', icon: '🏪', level: 2 },
    { name: '棉花田', icon: '🌾', level: 2 },
    { name: '其他', icon: '📦', level: 2 },
  ]},
  { name: '會員費用', icon: '💳', level: 1 },
  { name: '交通', icon: '🚇', level: 1, children: [
    { name: 'TPass', icon: '🎫', level: 2 },
    { name: '計程車', icon: '🚕', level: 2 },
  ]},
  { name: '娛樂', icon: '🎮', level: 1, children: [
    { name: '9局職棒', icon: '⚾', level: 2 },
    { name: 'PokemonGo', icon: '🎯', level: 2 },
    { name: '門票', icon: '🎟️', level: 2 },
    { name: '其他', icon: '🎪', level: 2 },
  ]},
  { name: '醫療', icon: '🏥', level: 1 },
  { name: '球卡', icon: '⚾', level: 1, children: [
    { name: '寄件費', icon: '📮', level: 2 },
    { name: 'Y拍手續費', icon: '💰', level: 2 },
    { name: '福袋', icon: '🎁', level: 2 },
    { name: '買卡', icon: '🃏', level: 2 },
    { name: '其他', icon: '📋', level: 2 },
  ]},
  { name: '旅遊', icon: '✈️', level: 1, children: [
    { name: '住宿', icon: '🏨', level: 2 },
    { name: '機票', icon: '🎫', level: 2 },
  ]},
  { name: '衣服', icon: '👕', level: 1 },
  { name: '其他', icon: '📝', level: 1 },
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '薪資', icon: '💵', level: 1 },
  { name: '投資', icon: '📈', level: 1 },
  { name: '球卡收入', icon: '💎', level: 1 },
  { name: '其他', icon: '💰', level: 1 },
] as const

// 輔助類型
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}
