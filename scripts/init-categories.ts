/**
 * 初始化預設分類到 Firestore
 * 執行方式: npx ts-node scripts/init-categories.ts
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, writeBatch, doc, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Firebase 配置 - 從環境變數或直接填入
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'money-track-27e32.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'money-track-27e32',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'money-track-27e32.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || ''
}

// 預設支出分類
const DEFAULT_EXPENSE_CATEGORIES = [
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
]

// 預設收入分類
const DEFAULT_INCOME_CATEGORIES = [
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
]

async function initializeCategories() {
  console.log('初始化 Firebase...')
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const auth = getAuth(app)

  console.log('匿名登入中...')
  const userCredential = await signInAnonymously(auth)
  const uid = userCredential.user.uid
  console.log('登入成功，UID:', uid)

  const categoriesRef = collection(db, 'users', uid, 'categories')

  // 檢查是否已有分類
  const existing = await getDocs(categoriesRef)
  if (!existing.empty) {
    console.log(`已有 ${existing.size} 個分類，跳過初始化`)
    console.log('如需重新初始化，請先在 Firebase Console 刪除 users/' + uid + '/categories')
    process.exit(0)
  }

  console.log('建立預設分類...')
  const batch = writeBatch(db)
  let order = 0

  type CategoryItem = {
    name: string
    level: number
    children?: CategoryItem[]
  }

  const addCategoryTree = (
    items: CategoryItem[],
    type: 'expense' | 'income',
    parentId: string | null = null
  ) => {
    items.forEach((item) => {
      const docRef = doc(categoriesRef)
      batch.set(docRef, {
        name: item.name,
        type,
        parentId,
        level: item.level,
        order: order++
      })
      console.log(`  ${type} - ${'  '.repeat(item.level - 1)}${item.name}`)

      if (item.children) {
        addCategoryTree(item.children, type, docRef.id)
      }
    })
  }

  console.log('\n支出分類:')
  addCategoryTree(DEFAULT_EXPENSE_CATEGORIES, 'expense')

  console.log('\n收入分類:')
  addCategoryTree(DEFAULT_INCOME_CATEGORIES, 'income')

  await batch.commit()
  console.log('\n✅ 預設分類已建立完成！')
  console.log('總共建立了', order, '個分類')

  process.exit(0)
}

initializeCategories().catch((error) => {
  console.error('❌ 初始化失敗:', error)
  process.exit(1)
})
