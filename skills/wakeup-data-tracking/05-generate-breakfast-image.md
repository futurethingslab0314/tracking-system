# Skill: generate-breakfast-image

## Goal
生成一張符合當地飲食特色的早餐俯視圖，並可供上傳至 Google Drive。

## Inputs
- `city`
- `country`
- `styleHint` (optional)

## Outputs
- `imagePrompt`
- `imageBinary` (png bytes)

## Prompt Template
"Top-down photo of a single-person breakfast set inspired by authentic {city}, {country} food culture. Show only food, utensils, and tabletop. No humans, no hands, no text, no logo. Natural light, realistic textures, editorial composition."

## Rules
- 固定 top view
- 單人份
- 畫面不能有人物
- 禁止浮水印與文字
