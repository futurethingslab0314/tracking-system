# Skill: persist-to-notion

## Goal
把完整紀錄寫入 Notion DB，圖片先上傳 Drive，再寫入公開 URL。

## Inputs
- Full canonical output schema

## Outputs
- `notionPageId`
- `notionPageUrl`
- `imageUrl`

## Rules
- 先上傳 Google Drive 並設 `anyone=reader`
- 優先寫入 `directUrl`: `https://drive.google.com/uc?export=view&id=<FILE_ID>`
- Notion 欄位不存在時回傳可讀錯誤訊息，避免靜默失敗
