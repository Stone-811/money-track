# 記帳小工具

## 技術棧
- React 18 + Vite + TypeScript
- Tailwind CSS
- Recharts (圖表)
- Firebase (Firestore + Auth + Hosting)
- Web Speech API (語音輸入)
- PWA (vite-plugin-pwa)

## 開發指令
```bash
npm install     # 安裝依賴
npm run dev     # 啟動開發伺服器
npm run build   # 建置生產版本
npm run preview # 預覽建置結果
```

## Firebase 設定
1. 建立 Firebase 專案
2. 啟用 Firestore 和 Google Authentication
3. 複製 `.env.example` 為 `.env.local` 並填入 Firebase 配置
4. 部署 Firestore 規則: `firebase deploy --only firestore:rules`
5. 部署網站: `firebase deploy --only hosting`

## 專案結構
```
src/
├── components/     # UI 組件
│   ├── CalendarView.tsx      # 日曆視圖
│   ├── CategoryPieChart.tsx  # 分類圓餅圖（可互動鑽取）
│   ├── MonthlyBarChart.tsx   # 月度長條圖
│   ├── BudgetTracker.tsx     # 預算追蹤
│   ├── QuickAddButton.tsx    # 快速記帳（語音/拍照）
│   ├── CategoryPicker.tsx    # 分類選擇器
│   ├── CategoryManager.tsx   # 分類管理
│   ├── SubscriptionManager.tsx # 訂閱管理
│   └── ...
├── hooks/          # React Hooks
│   ├── useAuth.ts         # 認證（Google 登入 + Email 白名單）
│   ├── useTransactions.ts # 交易記錄 CRUD
│   ├── useCategories.ts   # 分類管理（2 層架構）
│   ├── useBudget.ts       # 預算設定
│   └── useSubscriptions.ts # 訂閱管理
├── lib/            # Firebase 初始化
├── types/          # TypeScript 類型
├── App.tsx         # 主應用
└── main.tsx        # 入口點
```

## 主要功能
- **Google 登入**：Email 白名單控制存取權限
- **日曆記帳**：點擊日期新增/編輯交易
- **快速記帳**：浮動按鈕 + 語音輸入 + 拍照
- **語音辨識**：自動解析金額、分類、備註
- **預算追蹤**：設定月預算，顯示剩餘/超支
- **分類管理**：2 層分類架構（大類 > 中類）
- **統計圖表**：圓餅圖（可鑽取）、長條圖
- **訂閱管理**：自動記帳或到期提醒

## 注意事項
- Firestore 不接受 `undefined` 值，寫入前需過濾
- 語音輸入使用 Web Speech API（瀏覽器原生）
