# Skill: generate-breakfast-image

## Goal
根據 recipe 定義的重點食材生成一張早餐俯視圖，並可供上傳至 Google Drive。

## Inputs
- `city`
- `country`
- `highlightIngredients` (array of string)
- `recipe` (string)
- `recipe_zh` (string)
- `styleHint` (optional)

## Outputs
- `imagePrompt`
- `imageBinary` (png bytes)

## Prompt Template
"Top-down photo of a single-person breakfast set inspired by authentic {city}, {country} food culture. Must include these ingredients from recipe: {highlightIngredients}. Match recipe plating style and portions. Show only food, utensils, and tabletop. No humans, no hands, no text, no logo. Natural light, realistic textures, editorial composition."

## Rules
- 固定 top view
- 單人份
- 食材要與 `highlightIngredients` / `recipe` 一致
- 畫面不能有人物
- 禁止浮水印與文字
