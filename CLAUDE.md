# 記帳小工具

## 技術棧
- React 18 + Vite + TypeScript
- Tailwind CSS
- Recharts (圖表)
- Firebase (Firestore + Auth + Hosting)

## 開發指令
```bash
npm install     # 安裝依賴
npm run dev     # 啟動開發伺服器
npm run build   # 建置生產版本
npm run preview # 預覽建置結果
```

## Firebase 設定
1. 建立 Firebase 專案
2. 啟用 Firestore 和 Anonymous Authentication
3. 複製 `.env.example` 為 `.env.local` 並填入 Firebase 配置
4. 部署 Firestore 規則: `firebase deploy --only firestore:rules`
5. 部署網站: `firebase deploy --only hosting`

## 專案結構
```
src/
├── components/     # UI 組件
├── hooks/          # React Hooks
├── lib/            # Firebase 初始化
├── types/          # TypeScript 類型
├── App.tsx         # 主應用
└── main.tsx        # 入口點
```
