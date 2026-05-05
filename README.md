# Solopreneur Radar Dashboard (v2 - Pure JS)

携帯向けダッシュボード。Next.js 14 + Tailwind CSS。

## ファイル構成

```
.
├── app/
│   ├── api/items/route.js
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   └── Dashboard.jsx
├── lib/
│   └── sheets.js
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── tailwind.config.mjs
```

## デプロイ

1. GitHub に Public リポジトリ作成
2. zipの中身全部をアップロード（フォルダ階層保つ）
3. Vercel で Import → Environment Variables 設定:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `GOOGLE_SHEET_ID`
4. Deploy
