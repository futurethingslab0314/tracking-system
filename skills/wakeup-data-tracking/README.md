# Wake Up Data Tracking Skills

這組 skills 用於 `Wake Up Now` 按鈕流程，目標是把一次喚醒事件轉成完整 Notion 記錄。

## Workflow

1. `capture-user-and-local-time`
2. `find-near-8am-city`
3. `generate-local-greeting`
4. `generate-wakeup-story`
5. `generate-breakfast-image`
6. `generate-one-person-recipe-from-image`
7. `persist-to-notion`

## Canonical Output Schema

```json
{
  "userName": "string",
  "recordedAtDate": "YYYY-MM-DD",
  "recordedAt": "HH:mm:ss",
  "timezone": "IANA timezone",
  "city": "string",
  "city_zh": "string",
  "country": "string",
  "country_zh": "string",
  "latitude": 0,
  "longtitude": 0,
  "greeting": "string",
  "story": "string",
  "story_zh": "string",
  "recipe": "string",
  "imageUrl": "https://..."
}
```

## Notion Property Mapping

- `userName` -> Notion `userName` (title)
- `recordedAtDate` -> Notion `recordedAtDate` (date)
- `recordedAt` -> Notion `recordedAt` (rich_text or plain text)
- `city` -> Notion `city` (rich_text)
- `city_zh` -> Notion `city_zh` (rich_text)
- `country` -> Notion `country` (rich_text)
- `country_zh` -> Notion `country_zh` (rich_text)
- `latitude` -> Notion `latitude` (number)
- `longtitude` -> Notion `longtitude` (number)
- `greeting` -> Notion `greeting` (rich_text)
- `story` -> Notion `story` (rich_text)
- `story_zh` -> Notion `story_zh` (rich_text)
- `recipe` -> Notion `recipe` (rich_text)
- `imageUrl` -> Notion `Image URL` (url)

## Notes

- `longtitude` 依照你目前欄位命名保留原拼法。
- 城市挑選要避免重複，可用最近 7 筆紀錄去重。
- 所有生成內容預設避免刻板印象與敏感內容。
