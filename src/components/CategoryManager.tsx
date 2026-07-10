import { useState } from 'react'
import { Category, CategoryInput, TransactionType, CategoryTreeNode } from '../types'

interface CategoryManagerProps {
  categories: Category[]
  loading?: boolean
  buildTree: (type: TransactionType) => CategoryTreeNode[]
  addCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  reorderCategory?: (id: string, direction: 'up' | 'down') => Promise<void>
}

export function CategoryManager({
  categories,
  loading = false,
  buildTree,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategory
}: CategoryManagerProps) {
  const [activeType, setActiveType] = useState<TransactionType>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [addingTo, setAddingTo] = useState<{ parentId: string | null; level: 1 | 2 | 3 } | null>(null)
  const [newName, setNewName] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const tree = buildTree(activeType)

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setMenuOpenId(null)
  }

  const handleSaveEdit = async () => {
    if (editingId && editName.trim()) {
      await updateCategory(editingId, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
    }
  }

  const handleStartAdd = (parentId: string | null, level: 1 | 2 | 3) => {
    setAddingTo({ parentId, level })
    setNewName('')
    setMenuOpenId(null)
  }

  const handleSaveAdd = async () => {
    if (addingTo && newName.trim()) {
      const maxOrder = categories
        .filter(c => c.parentId === addingTo.parentId && c.type === activeType)
        .reduce((max, c) => Math.max(max, c.order), -1)

      await addCategory({
        name: newName.trim(),
        type: activeType,
        parentId: addingTo.parentId,
        level: addingTo.level,
        order: maxOrder + 1
      })
      setAddingTo(null)
      setNewName('')
    }
  }

  const handleDelete = async (cat: Category) => {
    setMenuOpenId(null)
    if (window.confirm(`確定要刪除「${cat.name}」及其所有子分類嗎？`)) {
      await deleteCategory(cat.id)
    }
  }

  const handleMoveUp = async (cat: Category) => {
    setMenuOpenId(null)
    if (reorderCategory) {
      await reorderCategory(cat.id, 'up')
    }
  }

  const handleMoveDown = async (cat: Category) => {
    setMenuOpenId(null)
    if (reorderCategory) {
      await reorderCategory(cat.id, 'down')
    }
  }

  // 檢查分類是否可以上移或下移
  const canMoveUp = (cat: Category) => {
    const siblings = categories
      .filter(c => c.parentId === cat.parentId && c.type === cat.type)
      .sort((a, b) => a.order - b.order)
    const index = siblings.findIndex(c => c.id === cat.id)
    return index > 0
  }

  const canMoveDown = (cat: Category) => {
    const siblings = categories
      .filter(c => c.parentId === cat.parentId && c.type === cat.type)
      .sort((a, b) => a.order - b.order)
    const index = siblings.findIndex(c => c.id === cat.id)
    return index < siblings.length - 1
  }

  const toggleMenu = (id: string) => {
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const renderNode = (node: CategoryTreeNode, depth: number = 0) => {
    const isEditing = editingId === node.id
    const canAddChild = node.level < 3
    const isMenuOpen = menuOpenId === node.id

    return (
      <div key={node.id}>
        <div className={`
          flex items-center gap-2 py-3 px-3 rounded-lg transition-colors
          ${depth === 0 ? 'bg-gray-50 dark:bg-gray-700/50 mb-2' : 'ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3'}
          ${isMenuOpen ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}>
          {isEditing ? (
            <>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium focus:outline-none"
              >
                儲存
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium focus:outline-none"
              >
                取消
              </button>
            </>
          ) : (
            <>
              {/* 分類名稱 */}
              <div className="flex-1 min-w-0">
                <span className={`
                  text-gray-800 dark:text-gray-200 truncate block
                  ${depth === 0 ? 'font-medium' : ''}
                `}>
                  {node.name}
                </span>
                {node.children.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {node.children.length} 個子分類
                  </span>
                )}
              </div>

              {/* 更多選單按鈕 */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu(node.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* 下拉選單 */}
                {isMenuOpen && (
                  <>
                    {/* 點擊外部關閉 */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-20 overflow-hidden">
                      <button
                        onClick={() => handleStartEdit(node)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        編輯名稱
                      </button>
                      {canAddChild && (
                        <button
                          onClick={() => handleStartAdd(node.id, (node.level + 1) as 2 | 3)}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          新增子分類
                        </button>
                      )}
                      {/* 排序按鈕 */}
                      {reorderCategory && canMoveUp(node) && (
                        <button
                          onClick={() => handleMoveUp(node)}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          上移
                        </button>
                      )}
                      {reorderCategory && canMoveDown(node) && (
                        <button
                          onClick={() => handleMoveDown(node)}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          下移
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(node)}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        刪除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* 新增子分類表單 */}
        {addingTo?.parentId === node.id && (
          <div className="ml-4 pl-3 border-l-2 border-green-300 dark:border-green-600 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAdd()}
                placeholder="輸入子分類名稱"
                className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={handleSaveAdd}
                className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium focus:outline-none"
              >
                新增
              </button>
              <button
                onClick={() => setAddingTo(null)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium focus:outline-none"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 子節點 */}
        {node.children.length > 0 && (
          <div className="mb-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors">
      {/* 類型切換 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveType('expense')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors focus:outline-none ${
            activeType === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          支出分類
        </button>
        <button
          onClick={() => setActiveType('income')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors focus:outline-none ${
            activeType === 'income'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          收入分類
        </button>
      </div>

      {/* 載入中 */}
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">載入分類中...</p>
        </div>
      )}

      {/* 空狀態 */}
      {!loading && tree.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="mb-1">尚無{activeType === 'expense' ? '支出' : '收入'}分類</p>
          <p className="text-xs">點擊下方按鈕新增分類</p>
        </div>
      )}

      {/* 分類樹 */}
      {!loading && tree.length > 0 && (
        <div className="space-y-1">
          {tree.map((node) => renderNode(node))}
        </div>
      )}

      {/* 新增大類 */}
      {!loading && (
        addingTo?.parentId === null ? (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveAdd()}
                placeholder="輸入大類名稱"
                className="flex-1 px-3 py-2.5 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={handleSaveAdd}
                className="px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium focus:outline-none"
              >
                新增
              </button>
              <button
                onClick={() => setAddingTo(null)}
                className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium focus:outline-none"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleStartAdd(null, 1)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增大類
          </button>
        )
      )}
    </div>
  )
}
