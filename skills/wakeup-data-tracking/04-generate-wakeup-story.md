# Skill: generate-wakeup-story

## Goal
生成英中雙語故事，主題是「今天的你甦醒在某城市」。

## Inputs
- `city`
- `city_zh`
- `country`
- `country_zh`
- `greeting`

## Outputs
- `story` (English, <= 150 words)
- `story_zh` (繁中, <= 150 字)

## Prompt Template
"Write a short second-person adventure vignette starting with: 'Today you wake up in {city}, {country}.' Include local cultural habits, geography, and one lesser-known historical detail. Keep it vivid, grounded, and under 150 words. Also produce Traditional Chinese version under 150 Chinese characters."

## Rules
- 需含開場句意象："今天的你甦醒在{國家}的{城市}"
- 避免刻板印象與不實歷史
- 中英文內容語意一致，但非逐字翻譯
