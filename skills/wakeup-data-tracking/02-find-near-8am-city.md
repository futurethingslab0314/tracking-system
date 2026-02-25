# Skill: find-near-8am-city

## Goal
找出「當下最接近早上 08:00」的城市與國家資訊。

## Inputs
- `nowUtc` (ISO datetime)
- `timezone` (user local timezone)

## Outputs
- `city` (English)
- `city_zh` (繁中)
- `country` (English)
- `country_zh` (繁中)
- `latitude` (number)
- `longtitude` (number)
- `targetTimeZone` (IANA)

## Rules
- 在全球城市資料中，計算每個候選城市當地時間與 `08:00` 的分鐘差。
- 取差距最小者；若同分，優先人口較高城市。
- 盡量避免連續多次使用同一城市（建議最近 7 筆去重）。
