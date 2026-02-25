# Skill: generate-one-person-recipe-from-image

## Goal
根據早餐圖片內容，生成一份「一人份」可執行食譜。

## Inputs
- `imageUrl` (string)
- `city` (string)
- `country` (string)
- `dietaryConstraints` (optional string)

## Outputs
- `recipe` (string, markdown/plain text)

## Prompt Template
"Analyze the breakfast image at {imageUrl}. Infer plausible ingredients and produce one practical single-serving recipe inspired by {city}, {country}. Return concise cooking steps, estimated time, and ingredient quantities for one person."

## Rules
- 僅輸出一人份（single serving）
- 包含：食材與份量、步驟、總時長
- 不可要求稀有設備或難取得食材
- 若圖片資訊不足，需明確標示「推測」食材
