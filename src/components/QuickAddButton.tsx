import { useState, useRef, useEffect } from 'react'
import { TransactionInput, TransactionType, Category } from '../types'
import { CategoryPicker } from './CategoryPicker'

interface QuickAddButtonProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  onAdd: (input: TransactionInput) => Promise<void>
  getChildren: (parentId: string | null, type: TransactionType) => Category[]
  getCategoryPath: (categoryId: string) => string[]
}

export function QuickAddButton({
  isOpen,
  onClose,
  categories,
  onAdd,
  getChildren,
  getCategoryPath
}: QuickAddButtonProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categoryPath, setCategoryPath] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const resetForm = () => {
    setAmount('')
    setCategoryId('')
    setCategoryPath([])
    setDescription('')
    setType('expense')
    setPhotoPreview(null)
  }

  const handleClose = () => {
    onClose()
    resetForm()
    stopListening()
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
      stopListening()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!amount || !categoryId) return

    setSubmitting(true)
    try {
      await onAdd({
        type,
        amount: parseFloat(amount),
        categoryId,
        categoryPath,
        description,
        date: new Date()
      })
      // 震動回饋
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  // 語音輸入
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的瀏覽器不支援語音輸入')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = 'zh-TW'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      parseVoiceInput(transcript)
    }

    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  // 解析語音輸入
  const parseVoiceInput = (text: string) => {
    // 嘗試提取數字金額
    const numberMatch = text.match(/(\d+)/)
    if (numberMatch) {
      setAmount(numberMatch[1])
    }

    // 嘗試匹配分類名稱（先嘗試中類，再嘗試大類）
    const expenseCategories = categories.filter(c => c.type === 'expense')
    let matchedCategory: Category | null = null
    let matchedCategoryName = ''

    // 先嘗試匹配中類（子分類），因為通常更具體
    const subCategories = expenseCategories.filter(c => c.level === 2)
    for (const cat of subCategories) {
      if (text.includes(cat.name)) {
        matchedCategory = cat
        matchedCategoryName = cat.name
        break
      }
    }

    // 如果沒有匹配中類，嘗試匹配大類
    if (!matchedCategory) {
      const mainCategories = expenseCategories.filter(c => c.level === 1)
      for (const cat of mainCategories) {
        if (text.includes(cat.name)) {
          matchedCategory = cat
          matchedCategoryName = cat.name
          break
        }
      }
    }

    // 如果匹配到分類，自動選擇
    if (matchedCategory) {
      setCategoryId(matchedCategory.id)
      setCategoryPath(getCategoryPath(matchedCategory.id))
    }

    // 移除數字、金額單位、常見詞彙和分類名稱，保留有意義的備註
    let cleanText = text
      .replace(/\d+/g, '')           // 移除數字
      .replace(/[元塊錢块圓]*/g, '') // 移除金額單位
      .replace(/花了|花|共|總共|一共/g, '') // 移除常見動詞

    // 如果有匹配到分類，也從備註中移除分類名稱
    if (matchedCategoryName) {
      cleanText = cleanText.replace(matchedCategoryName, '')
    }

    cleanText = cleanText.trim()

    if (cleanText) {
      setDescription(cleanText)
    }
  }

  // 拍照輸入
  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string)
      // 這裡可以加入 OCR 識別，目前先提示用戶手動輸入
      alert('已拍攝收據照片，請手動輸入金額。\n\n（未來版本將支援自動識別）')
    }
    reader.readAsDataURL(file)
  }

  const quickAmounts = [50, 100, 200, 500]

  if (!isOpen) return null

  return (
    <>
      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 快速記帳彈窗 */}
      <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={handleClose}>
        <div
          className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up"
          onClick={e => e.stopPropagation()}
        >
          {/* 拖曳指示 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <div className="px-5 pb-5 overflow-y-auto max-h-[calc(90vh-40px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">快速記帳</h3>

              {/* 拍照和語音按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={handlePhotoCapture}
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="拍照記帳"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="語音輸入"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 語音輸入提示 */}
            {isListening && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">正在聆聽...</span>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">說出分類和金額，例如：「午餐 120 元」</p>
              </div>
            )}

            {/* 照片預覽 */}
            {photoPreview && (
              <div className="mb-4 relative">
                <img
                  src={photoPreview}
                  alt="收據"
                  className="w-full h-32 object-cover rounded-xl"
                />
                <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* 類型切換 */}
            <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setType('expense'); setCategoryId(''); setCategoryPath([]) }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => { setType('income'); setCategoryId(''); setCategoryPath([]) }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-white dark:bg-gray-600 text-green-500 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                收入
              </button>
            </div>

            {/* 快速金額按鈕 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    amount === amt.toString()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* 金額輸入 */}
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400 dark:text-gray-500">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full pl-10 pr-4 py-4 text-2xl font-bold text-center bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 border-0 transition-all"
                />
              </div>
            </div>

            {/* 分類選擇 */}
            <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
              <CategoryPicker
                type={type}
                categories={categories}
                selectedId={categoryId}
                onSelect={(id, path) => { setCategoryId(id); setCategoryPath(path) }}
                getChildren={getChildren}
                getCategoryPath={getCategoryPath}
              />
            </div>

            {/* 備註 */}
            <div className="mb-4">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="備註（選填）"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 border-0 transition-all"
              />
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3 pb-safe">
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount || !categoryId}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
              >
                {submitting ? '儲存中...' : '記帳'}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
