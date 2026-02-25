# Skill: capture-user-and-local-time

## Goal
記錄使用者名稱、按鈕點擊當下本地時區與時間。

## Inputs
- `userName` (string)
- `clientTimeZone` (IANA, e.g. `Asia/Taipei`)
- `clientIsoTime` (ISO datetime string)

## Outputs
- `userName`
- `timezone`
- `recordedAtDate` (`YYYY-MM-DD`)
- `recordedAt` (`HH:mm:ss`)

## Rules
- `userName` 不可空白。
- 優先採用前端提供的 `clientTimeZone` 與 `clientIsoTime`。
- 若前端沒給，後端 fallback 用 UTC 並標註 timezone=`UTC`。
