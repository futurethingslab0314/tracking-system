# Skill: generate-local-greeting

## Goal
根據城市與國家判斷主要語言，生成「早安」問候。

## Inputs
- `city`
- `country`

## Outputs
- `greeting` (當地主要語言)
- `language` (English name, e.g. `Japanese`)

## Prompt Template
"You are a localization assistant. Given city={city}, country={country}, determine the most widely used local language for everyday greeting, then return one short natural morning greeting in that language."

## Rules
- `greeting` 限制在 3 到 20 字（含空白）
- 不要翻譯附註，只回傳原語句
