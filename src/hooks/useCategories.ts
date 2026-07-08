import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch
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

export function useCategories(uid: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const categoriesRef = collection(db, 'users', uid, 'categories')
    const q = query(categoriesRef, orderBy('order', 'asc'))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // 初始化預設分類
        await initializeDefaultCategories(uid)
      } else {
        const data: Category[] = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data() as CategoryDoc
          return {
            id: docSnap.id,
            ...docData
          }
        })
        setCategories(data)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

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
          // 遞迴新增子分類
          addCategoryTree(item.children, type, docRef.id)
        }
      })
    }

    addCategoryTree(DEFAULT_EXPENSE_CATEGORIES, 'expense')
    addCategoryTree(DEFAULT_INCOME_CATEGORIES, 'income')

    await batch.commit()
  }

  // 新增分類
  const addCategory = useCallback(async (input: CategoryInput) => {
    if (!uid) return

    const categoriesRef = collection(db, 'users', uid, 'categories')
    const docData: CategoryDoc = {
      name: input.name,
      type: input.type,
      parentId: input.parentId,
      level: input.level,
      icon: input.icon,
      order: input.order
    }
    await addDoc(categoriesRef, docData)
  }, [uid])

  // 更新分類
  const updateCategory = useCallback(async (id: string, input: Partial<CategoryInput>) => {
    if (!uid) return

    const docRef = doc(db, 'users', uid, 'categories', id)
    await updateDoc(docRef, input)
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

  // 重置為預設分類
  const resetToDefaults = useCallback(async () => {
    if (!uid) return

    // 刪除所有現有分類
    const batch = writeBatch(db)
    categories.forEach((cat) => {
      const docRef = doc(db, 'users', uid, 'categories', cat.id)
      batch.delete(docRef)
    })
    await batch.commit()

    // 重新初始化預設分類
    await initializeDefaultCategories(uid)
  }, [uid, categories])

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    buildTree,
    getCategoryPath,
    getCategoriesByType,
    getChildren,
    resetToDefaults
  }
}
