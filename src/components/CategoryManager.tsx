import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Category, CategoryInput, TransactionType, CategoryTreeNode } from '../types'

interface CategoryManagerProps {
  categories: Category[]
  loading?: boolean
  buildTree: (type: TransactionType) => CategoryTreeNode[]
  addCategory: (input: CategoryInput) => Promise<void>
  updateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  batchReorderCategories?: (orderedIds: string[]) => Promise<void>
}

// 可排序的大類項目
function SortableMainCategory({
  node,
  isExpanded,
  isEditing,
  editName,
  setEditName,
  onToggleExpand,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onStartAdd,
  onDelete,
  children,
  addingForm
}: {
  node: CategoryTreeNode
  isExpanded: boolean
  isEditing: boolean
  editName: string
  setEditName: (name: string) => void
  onToggleExpand: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onStartAdd: () => void
  onDelete: () => void
  children: React.ReactNode
  addingForm: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto'
  }

  const hasChildren = node.children.length > 0

  return (
    <div ref={setNodeRef} style={style} className="border dark:border-gray-700 rounded-lg overflow-hidden mb-2">
      {/* 大類標題 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
              className="flex-1 px-3 py-1.5 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button
              onClick={onSaveEdit}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium focus:outline-none"
            >
              儲存
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium focus:outline-none"
            >
              取消
            </button>
          </>
        ) : (
          <>
            {/* 拖曳把手 */}
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none focus:outline-none"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
              </svg>
            </button>

            {/* 展開/收合按鈕 */}
            <button
              onClick={onToggleExpand}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 分類名稱 */}
            <button
              onClick={onToggleExpand}
              className="flex-1 text-left font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              {node.name}
              {hasChildren && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  ({node.children.length})
                </span>
              )}
            </button>

            {/* 編輯按鈕 */}
            <button
              onClick={onStartEdit}
              className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none"
              title="編輯"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* 新增中類按鈕 */}
            <button
              onClick={onStartAdd}
              className="p-2 text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none"
              title="新增中類"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* 刪除按鈕 */}
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none"
              title="刪除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* 子分類（展開時顯示） */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
          {children}
          {addingForm}
        </div>
      )}
    </div>
  )
}

// 可排序的中類項目
function SortableChildCategory({
  node,
  isEditing,
  editName,
  setEditName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: {
  node: CategoryTreeNode
  isEditing: boolean
  editName: string
  setEditName: (name: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
            className="flex-1 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            autoFocus
          />
          <button
            onClick={onSaveEdit}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium focus:outline-none"
          >
            儲存
          </button>
          <button
            onClick={onCancelEdit}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium focus:outline-none"
          >
            取消
          </button>
        </>
      ) : (
        <>
          {/* 拖曳把手 */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none focus:outline-none"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </button>

          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{node.name}</span>

          {/* 編輯按鈕 */}
          <button
            onClick={onStartEdit}
            className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-colors focus:outline-none"
            title="編輯"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* 刪除按鈕 */}
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none"
            title="刪除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

export function CategoryManager({
  categories,
  loading = false,
  buildTree,
  addCategory,
  updateCategory,
  deleteCategory,
  batchReorderCategories
}: CategoryManagerProps) {
  const [activeType, setActiveType] = useState<TransactionType>('expense')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [addingTo, setAddingTo] = useState<{ parentId: string | null; level: 1 | 2 } | null>(null)
  const [newName, setNewName] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const tree = buildTree(activeType)

  // 設定拖曳感應器（支援觸控和滑鼠）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedIds(newSet)
  }

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

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleStartAdd = (parentId: string | null, level: 1 | 2) => {
    setAddingTo({ parentId, level })
    setNewName('')
    if (parentId) {
      setExpandedIds(prev => new Set(prev).add(parentId))
    }
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
    if (window.confirm(`確定要刪除「${cat.name}」${cat.level === 1 ? '及其所有子分類' : ''}嗎？`)) {
      await deleteCategory(cat.id)
    }
  }

  // 處理大類拖曳結束
  const handleMainDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && batchReorderCategories) {
      const oldIndex = tree.findIndex(item => item.id === active.id)
      const newIndex = tree.findIndex(item => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(tree, oldIndex, newIndex)
        await batchReorderCategories(newOrder.map(item => item.id))
      }
    }
  }

  // 處理中類拖曳結束
  const handleChildDragEnd = async (parentId: string, event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && batchReorderCategories) {
      const parent = tree.find(n => n.id === parentId)
      if (!parent) return

      const oldIndex = parent.children.findIndex(item => item.id === active.id)
      const newIndex = parent.children.findIndex(item => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(parent.children, oldIndex, newIndex)
        await batchReorderCategories(newOrder.map(item => item.id))
      }
    }
  }

  return (
    <div>
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

      {/* 分類列表（可拖曳排序） */}
      {!loading && tree.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleMainDragEnd}
        >
          <SortableContext
            items={tree.map(n => n.id)}
            strategy={verticalListSortingStrategy}
          >
            {tree.map(node => (
              <SortableMainCategory
                key={node.id}
                node={node}
                isExpanded={expandedIds.has(node.id)}
                isEditing={editingId === node.id}
                editName={editName}
                setEditName={setEditName}
                onToggleExpand={() => toggleExpand(node.id)}
                onStartEdit={() => handleStartEdit(node)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onStartAdd={() => handleStartAdd(node.id, 2)}
                onDelete={() => handleDelete(node)}
                addingForm={
                  addingTo?.parentId === node.id && (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveAdd()}
                          placeholder="輸入中類名稱"
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
                  )
                }
              >
                {node.children.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleChildDragEnd(node.id, e)}
                  >
                    <SortableContext
                      items={node.children.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-2">
                        {node.children.map(child => (
                          <SortableChildCategory
                            key={child.id}
                            node={child}
                            isEditing={editingId === child.id}
                            editName={editName}
                            setEditName={setEditName}
                            onStartEdit={() => handleStartEdit(child)}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDelete={() => handleDelete(child)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">
                    尚無子分類
                  </div>
                )}
              </SortableMainCategory>
            ))}
          </SortableContext>
        </DndContext>
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
        ) : !addingTo && (
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

      {/* 拖曳提示 */}
      {!loading && tree.length > 0 && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          長按拖曳圖示可調整順序
        </p>
      )}
    </div>
  )
}
