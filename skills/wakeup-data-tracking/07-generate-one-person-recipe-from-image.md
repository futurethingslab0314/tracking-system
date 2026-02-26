# Skill: generate-one-person-recipe

## Goal
根據城市與國家的早餐文化特色，先生成一份「一人份」可執行食譜，並輸出重點食材供後續圖片生成。

## Inputs
- `city` (string)
- `country` (string)
- `city_zh` (string)
- `country_zh` (string)
- `breakfastHint` (string)
- `dietaryConstraints` (optional string)

## Outputs
- `highlightIngredients` (array of string)
- `recipe` (string, markdown/plain text)
- `recipe_zh` (string, markdown/plain text)
- `imagePrompt` (string)

## Prompt Template
"Generate a practical single-serving breakfast recipe inspired by {city}, {country}. First list key local ingredients, then produce bilingual recipe (EN + ZH), and finally provide an image prompt that matches exactly the same ingredients and plating style."

## Rules
- 僅輸出一人份（single serving）
- 食譜包含：食材與份量、步驟、總時長
- 食材內容可以反映當地飲食文化
- `recipe` / `recipe_zh` 必須與 `highlightIngredients` 一致
- `imagePrompt` 必須與食譜食材一致（避免圖文不一致）
