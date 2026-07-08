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
  const [level1, setLevel1] = useState<string | null>(null)
  const [level2, setLevel2] = useState<string | null>(null)
  const [level3, setLevel3] = useState<string | null>(null)

  // 根據 selectedId 初始化選擇狀態
  useEffect(() => {
    if (selectedId) {
      const selected = categories.find(c => c.id === selectedId)

      if (selected) {
        // 找到對應的層級
        if (selected.level === 1) {
          setLevel1(selectedId)
          setLevel2(null)
          setLevel3(null)
        } else if (selected.level === 2) {
          setLevel1(selected.parentId)
          setLevel2(selectedId)
          setLevel3(null)
        } else if (selected.level === 3) {
          const parent = categories.find(c => c.id === selected.parentId)
          setLevel1(parent?.parentId || null)
          setLevel2(selected.parentId)
          setLevel3(selectedId)
        }
      }
    }
  }, [selectedId, categories, getCategoryPath])

  const level1Categories = getChildren(null, type)
  const level2Categories = level1 ? getChildren(level1, type) : []
  const level3Categories = level2 ? getChildren(level2, type) : []

  const handleLevel1Select = (id: string) => {
    setLevel1(id)
    setLevel2(null)
    setLevel3(null)

    const children = getChildren(id, type)
    if (children.length === 0) {
      // 沒有子分類，直接選中
      const path = getCategoryPath(id)
      onSelect(id, path)
    }
  }

  const handleLevel2Select = (id: string) => {
    setLevel2(id)
    setLevel3(null)

    const children = getChildren(id, type)
    if (children.length === 0) {
      // 沒有子分類，直接選中
      const path = getCategoryPath(id)
      onSelect(id, path)
    }
  }

  const handleLevel3Select = (id: string) => {
    setLevel3(id)
    const path = getCategoryPath(id)
    onSelect(id, path)
  }

  const selectedPath = selectedId ? getCategoryPath(selectedId) : []

  // 沒有分類時顯示提示
  if (level1Categories.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">尚無{type === 'expense' ? '支出' : '收入'}分類</p>
        <p className="text-xs mt-1">請到「設定」頁面點擊「重置為預設分類」</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 已選擇的顯示 */}
      {selectedPath.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 rounded-lg text-blue-700 text-sm">
          已選擇: {selectedPath.join(' > ')}
        </div>
      )}

      {/* 大類 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">大類</label>
        <div className="flex flex-wrap gap-2">
          {level1Categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleLevel1Select(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                level1 === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 中類 */}
      {level2Categories.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">中類</label>
          <div className="flex flex-wrap gap-2">
            {level2Categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleLevel2Select(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  level2 === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 小類 */}
      {level3Categories.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">小類</label>
          <div className="flex flex-wrap gap-2">
            {level3Categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleLevel3Select(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  level3 === cat.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
