# Tracking System Agent Skeleton

這是一個 React + Node.js 的 agent 骨架，包含：

- `skills/`：放置 agent skills（純文字、JSON、程式模組都可）
- `server/`：後端 API（Notion 寫入、OpenAI 生成、Google Drive 上傳）
- `client/`：前端 React 介面（Wake Up Now UI）

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

## Railway 設定

在 `agent-server` 設定：

- `PORT`
- `NOTION_API_KEY`
- `NOTION_DB_ID`
- `NOTION_TITLE_PROPERTY`（預設 `Name`）
- `NOTION_IMAGE_URL_PROPERTY`（預設 `Image URL`）
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`（預設 `gpt-image-1`）
- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY_JSON`（整段 JSON，private_key 保留 `\n`）

在 `agent-client` 設定：

- `VITE_API_BASE_URL=https://<your-agent-server-url>`

## API

- `GET /api/health`
- `GET /api/skills`
- `POST /api/notion/write`
- `POST /api/openai/generate`
- `POST /api/workflow/generate-image-to-drive-notion`
- `POST /api/wakeup/run`

### Wake Up Workflow API

`POST /api/wakeup/run`

Request body:

```json
{
  "userName": "Ada",
  "clientTimeZone": "Asia/Taipei",
  "clientIsoTime": "2026-02-25T10:30:12.000Z"
}
```

This endpoint will:

1. 記錄 `userName` 與本地時間
2. 找出全球接近早上 08:00 的城市
3. 生成當地語言早安
4. 生成英中冒險故事
5. 生成早餐圖，存到 Drive，寫入 Notion（`Image URL`）

Response returns full record, Drive links, and Notion page info.

## Notion Database 欄位需求（wakeup）

請建立以下欄位名稱與型別：

- `userName` (title)
- `recordedAtDate` (date)
- `recordedAt` (rich_text)
- `city` (rich_text)
- `city_zh` (rich_text)
- `country` (rich_text)
- `country_zh` (rich_text)
- `latitude` (number)
- `longtitude` (number)
- `greeting` (rich_text)
- `story` (rich_text)
- `story_zh` (rich_text)
- `Image URL` (url)
