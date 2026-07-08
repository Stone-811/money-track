import { useState, useEffect } from 'react'
import { Category, TransactionType } from '../types'

interface CategoryPickerProps {
  type: TransactionType
  categories: Category[]
  selectedId: string
  onSelect: (categoryId: string, categoryPath: string[]) => void
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function CategoryPicker({
  type,
  categories,
  selectedId,
  onSelect,
  getChildren,
  getCategoryPath
}: CategoryPickerProps) {
  const [level1, setLevel1] = useState<string>('')
  const [level2, setLevel2] = useState<string>('')
  const [level3, setLevel3] = useState<string>('')

  // 根據 selectedId 初始化選擇狀態
  useEffect(() => {
    if (selectedId) {
      const selected = categories.find(c => c.id === selectedId)

      if (selected) {
        if (selected.level === 1) {
          setLevel1(selectedId)
          setLevel2('')
          setLevel3('')
        } else if (selected.level === 2) {
          setLevel1(selected.parentId || '')
          setLevel2(selectedId)
          setLevel3('')
        } else if (selected.level === 3) {
          const parent = categories.find(c => c.id === selected.parentId)
          setLevel1(parent?.parentId || '')
          setLevel2(selected.parentId || '')
          setLevel3(selectedId)
        }
      }
    }
  }, [selectedId, categories])

  const level1Categories = getChildren(null, type)
  const level2Categories = level1 ? getChildren(level1, type) : []
  const level3Categories = level2 ? getChildren(level2, type) : []

  const handleLevel1Change = (id: string) => {
    setLevel1(id)
    setLevel2('')
    setLevel3('')

    if (id) {
      const children = getChildren(id, type)
      if (children.length === 0) {
        const path = getCategoryPath(id)
        onSelect(id, path)
      }
    }
  }

  const handleLevel2Change = (id: string) => {
    setLevel2(id)
    setLevel3('')

    if (id) {
      const children = getChildren(id, type)
      if (children.length === 0) {
        const path = getCategoryPath(id)
        onSelect(id, path)
      }
    }
  }

  const handleLevel3Change = (id: string) => {
    setLevel3(id)
    if (id) {
      const path = getCategoryPath(id)
      onSelect(id, path)
    }
  }

  const selectedPath = selectedId ? getCategoryPath(selectedId) : []

  // 沒有分類時顯示提示
  if (level1Categories.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm">正在載入分類...</p>
      </div>
    )
  }

  const selectClass = `
    w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl
    text-gray-700 text-base font-medium
    focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none
    transition-all cursor-pointer appearance-none
    bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
    bg-[length:20px] bg-[right_12px_center] bg-no-repeat
  `

  return (
    <div className="space-y-3">
      {/* 已選擇的顯示 */}
      {selectedPath.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-blue-700 font-medium">{selectedPath.join(' › ')}</span>
        </div>
      )}

      {/* 大類 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">大類</label>
        <select
          value={level1}
          onChange={(e) => handleLevel1Change(e.target.value)}
          className={selectClass}
        >
          <option value="">請選擇大類...</option>
          {level1Categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 中類 */}
      {level2Categories.length > 0 && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">中類</label>
          <select
            value={level2}
            onChange={(e) => handleLevel2Change(e.target.value)}
            className={selectClass}
          >
            <option value="">請選擇中類...</option>
            {level2Categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 小類 */}
      {level3Categories.length > 0 && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">小類</label>
          <select
            value={level3}
            onChange={(e) => handleLevel3Change(e.target.value)}
            className={selectClass}
          >
            <option value="">請選擇小類...</option>
            {level3Categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
