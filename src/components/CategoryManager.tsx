import { useState } from 'react'
import { Category, CategoryInput, TransactionType, CategoryTreeNode } from '../types'

interface CategoryManagerProps {
  categories: Category[]
  loading?: boolean
  buildTree: (type: TransactionType) => CategoryTreeNode[]
  addCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export function CategoryManager({
  categories,
  loading = false,
  buildTree,
  addCategory,
  updateCategory,
  deleteCategory
}: CategoryManagerProps) {
  const [activeType, setActiveType] = useState<TransactionType>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [addingTo, setAddingTo] = useState<{ parentId: string | null; level: 1 | 2 | 3 } | null>(null)
  const [newName, setNewName] = useState('')

  const tree = buildTree(activeType)

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
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
    if (window.confirm(`確定要刪除「${cat.name}」及其所有子分類嗎？`)) {
      await deleteCategory(cat.id)
    }
  }

  const renderNode = (node: CategoryTreeNode, depth: number = 0) => {
    const isEditing = editingId === node.id
    const canAddChild = node.level < 3

    return (
      <div key={node.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-600 pl-3' : ''}`}>
        <div className="flex items-center gap-2 py-2 group">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs focus:outline-none"
              >
                儲存
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-300 rounded text-xs focus:outline-none"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-gray-800 dark:text-gray-200">{node.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">L{node.level}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => handleStartEdit(node)}
                  className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
                  title="編輯"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {canAddChild && (
                  <button
                    onClick={() => handleStartAdd(node.id, (node.level + 1) as 2 | 3)}
                    className="p-1 text-gray-400 hover:text-green-500 dark:hover:text-green-400 focus:outline-none"
                    title="新增子分類"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(node)}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                  title="刪除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* 新增子分類表單 */}
        {addingTo?.parentId === node.id && (
          <div className="ml-6 flex items-center gap-2 py-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="輸入分類名稱"
              className="flex-1 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={handleSaveAdd}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs focus:outline-none"
            >
              新增
            </button>
            <button
              onClick={() => setAddingTo(null)}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-300 rounded text-xs focus:outline-none"
            >
              取消
            </button>
          </div>
        )}

        {/* 子節點 */}
        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">分類管理</h2>

      {/* 類型切換 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveType('expense')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors focus:outline-none ${
            activeType === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          支出分類
        </button>
        <button
          onClick={() => setActiveType('income')}
          className={`flex-1 py-2 rounded-lg font-medium transition-colors focus:outline-none ${
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
          <p className="mb-2">尚無{activeType === 'expense' ? '支出' : '收入'}分類</p>
          <p className="text-xs">分類數量: {categories.length}</p>
          <p className="text-xs">請使用下方按鈕新增分類</p>
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
          <div className="flex items-center gap-2 mt-4 pt-4 border-t dark:border-gray-700">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="輸入大類名稱"
              className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={handleSaveAdd}
              className="px-4 py-2 bg-green-500 text-white rounded-lg focus:outline-none"
            >
              新增
            </button>
            <button
              onClick={() => setAddingTo(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-300 rounded-lg focus:outline-none"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleStartAdd(null, 1)}
            className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none"
          >
            + 新增大類
          </button>
        )
      )}
    </div>
  )
}
