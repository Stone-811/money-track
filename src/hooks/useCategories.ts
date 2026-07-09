import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  getDocs
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  Category,
  CategoryInput,
  CategoryDoc,
  CategoryTreeNode,
  TransactionType,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from '../types'

// 初始化預設分類
const initializeDefaultCategories = async (userId: string) => {
  const batch = writeBatch(db)
  const categoriesRef = collection(db, 'users', userId, 'categories')
  let order = 0

  const addCategoryTree = (
    items: readonly any[],
    type: TransactionType,
    parentId: string | null = null
  ) => {
    items.forEach((item) => {
      const docRef = doc(categoriesRef)
      const catData: CategoryDoc = {
        name: item.name,
        type,
        parentId,
        level: item.level as 1 | 2 | 3,
        order: order++
      }
      batch.set(docRef, catData)

      if (item.children) {
        addCategoryTree(item.children, type, docRef.id)
      }
    })
  }

  addCategoryTree(DEFAULT_EXPENSE_CATEGORIES, 'expense')
  addCategoryTree(DEFAULT_INCOME_CATEGORIES, 'income')

  await batch.commit()
  console.log('預設分類已建立')
}

export function useCategories(uid: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const initializingRef = useRef(false)

  // 確保分類存在
  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    console.log('useCategories: uid =', uid)
    const categoriesRef = collection(db, 'users', uid, 'categories')

    // 先檢查並初始化
    const checkAndInit = async () => {
      if (initializingRef.current) return

      try {
        console.log('檢查現有分類...')
        const snapshot = await getDocs(categoriesRef)
        console.log('現有分類數量:', snapshot.size)

        if (snapshot.empty) {
          console.log('分類為空，開始初始化...')
          initializingRef.current = true
          await initializeDefaultCategories(uid)
          console.log('初始化完成')
          initializingRef.current = false
        }
      } catch (error: any) {
        console.error('檢查/初始化分類失敗:', error.code, error.message)
        initializingRef.current = false
        setLoading(false)
      }
    }

    checkAndInit()

    // 監聽分類變化
    const q = query(categoriesRef, orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('onSnapshot: 收到', snapshot.size, '個分類')
        const data: Category[] = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data() as CategoryDoc
          return {
            id: docSnap.id,
            ...docData
          }
        })
        setCategories(data)
        setLoading(false)
      },
      (error) => {
        console.error('onSnapshot 錯誤:', error.code, error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  // 新增分類
  const addCategory = useCallback(async (input: CategoryInput) => {
    if (!uid) return

    const categoriesRef = collection(db, 'users', uid, 'categories')
    const docData: CategoryDoc = {
      name: input.name,
      type: input.type,
      parentId: input.parentId,
      level: input.level,
      order: input.order
    }
    // 只有當 icon 存在時才加入
    if (input.icon) {
      docData.icon = input.icon
    }
    await addDoc(categoriesRef, docData)
  }, [uid])

  // 更新分類
  const updateCategory = useCallback(async (id: string, input: Partial<CategoryInput>) => {
    if (!uid) return

    const docRef = doc(db, 'users', uid, 'categories', id)
    // 過濾掉 undefined 值
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

  // 刪除分類（包含子分類）
  const deleteCategory = useCallback(async (id: string) => {
    if (!uid) return

    const batch = writeBatch(db)

    // 找出所有子分類
    const childIds = findAllChildIds(id, categories)
    const allIds = [id, ...childIds]

    allIds.forEach((catId) => {
      const docRef = doc(db, 'users', uid, 'categories', catId)
      batch.delete(docRef)
    })

    await batch.commit()
  }, [uid, categories])

  // 找出所有子分類 ID
  const findAllChildIds = (parentId: string, cats: Category[]): string[] => {
    const children = cats.filter(c => c.parentId === parentId)
    const childIds = children.map(c => c.id)
    const grandchildIds = children.flatMap(c => findAllChildIds(c.id, cats))
    return [...childIds, ...grandchildIds]
  }

  // 建立樹狀結構
  const buildTree = useCallback((type: TransactionType): CategoryTreeNode[] => {
    const typeCats = categories.filter(c => c.type === type)
    const rootCats = typeCats.filter(c => c.parentId === null)

    const buildNode = (cat: Category): CategoryTreeNode => {
      const children = typeCats
        .filter(c => c.parentId === cat.id)
        .sort((a, b) => a.order - b.order)
        .map(buildNode)
      return { ...cat, children }
    }

    return rootCats.sort((a, b) => a.order - b.order).map(buildNode)
  }, [categories])

  // 取得分類路徑
  const getCategoryPath = useCallback((categoryId: string): string[] => {
    const path: string[] = []
    let current = categories.find(c => c.id === categoryId)

    while (current) {
      path.unshift(current.name)
      current = current.parentId
        ? categories.find(c => c.id === current!.parentId)
        : undefined
    }

    return path
  }, [categories])

  // 根據類型取得分類
  const getCategoriesByType = useCallback((type: TransactionType): Category[] => {
    return categories.filter(c => c.type === type)
  }, [categories])

  // 取得某分類的子分類
  const getChildren = useCallback((parentId: string | null, type: TransactionType): Category[] => {
    return categories
      .filter(c => c.parentId === parentId && c.type === type)
      .sort((a, b) => a.order - b.order)
  }, [categories])

  // 重置分類（刪除所有並重新初始化）
  const resetCategories = useCallback(async () => {
    if (!uid) return

    const categoriesRef = collection(db, 'users', uid, 'categories')
    const snapshot = await getDocs(categoriesRef)

    // 刪除所有現有分類
    const batch = writeBatch(db)
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref)
    })
    await batch.commit()

    // 重新初始化
    await initializeDefaultCategories(uid)
  }, [uid])

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategories,
    buildTree,
    getCategoryPath,
    getCategoriesByType,
    getChildren
  }
}
