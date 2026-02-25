# Tracking System Agent Skeleton

這是一個 React + Node.js 的 agent 骨架，包含：

- `skills/`：放置 agent skills（純文字、JSON、程式模組都可）
- `server/`：後端 API（Notion 寫入、OpenAI 生成、skills 掃描）
- `client/`：前端 React 介面

## 專案結構

```text
.
├── client/
├── server/
├── skills/
├── package.json
└── README.md
```

## 快速開始

1. 安裝依賴

```bash
npm install
```

2. 設定環境變數

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. 啟動後端

```bash
npm run dev:server
```

4. 啟動前端（新終端）

```bash
npm run dev:client
```

## Railway 建議

- 在 Railway 服務中設定 `server` 作為 root 或指定 start command: `npm run start`
- 加入環境變數：
  - `PORT`
  - `NOTION_API_KEY`
  - `NOTION_DB_ID`
  - `OPENAI_API_KEY`
- 前端可另外部署，並設定 `VITE_API_BASE_URL` 指向後端 URL

## API（骨架）

- `GET /api/health`
- `GET /api/skills`
- `POST /api/notion/write`
- `POST /api/openai/generate`
