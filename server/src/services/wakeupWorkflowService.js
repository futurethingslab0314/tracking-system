import { generateImage, generateText } from './openaiService.js';
import { uploadImageToDrive } from './googleDriveService.js';
import { writeWakeupRecordToNotion } from './notionService.js';

const TARGET_MINUTE = 8 * 60;

const CITIES = [
  {
    city: 'Tokyo',
    city_zh: '東京',
    country: 'Japan',
    country_zh: '日本',
    timezone: 'Asia/Tokyo',
    latitude: 35.6762,
    longtitude: 139.6503,
    language: 'Japanese',
    breakfastHint: 'grilled salmon, tamagoyaki, miso soup, rice'
  },
  {
    city: 'Seoul',
    city_zh: '首爾',
    country: 'South Korea',
    country_zh: '韓國',
    timezone: 'Asia/Seoul',
    latitude: 37.5665,
    longtitude: 126.978,
    language: 'Korean',
    breakfastHint: 'kimchi, soup, rice, banchan dishes'
  },
  {
    city: 'Bangkok',
    city_zh: '曼谷',
    country: 'Thailand',
    country_zh: '泰國',
    timezone: 'Asia/Bangkok',
    latitude: 13.7563,
    longtitude: 100.5018,
    language: 'Thai',
    breakfastHint: 'jok rice porridge, fresh herbs, tropical fruit'
  },
  {
    city: 'Istanbul',
    city_zh: '伊斯坦堡',
    country: 'Turkey',
    country_zh: '土耳其',
    timezone: 'Europe/Istanbul',
    latitude: 41.0082,
    longtitude: 28.9784,
    language: 'Turkish',
    breakfastHint: 'simit, cheeses, olives, menemen, tea'
  },
  {
    city: 'Nairobi',
    city_zh: '奈洛比',
    country: 'Kenya',
    country_zh: '肯亞',
    timezone: 'Africa/Nairobi',
    latitude: -1.2921,
    longtitude: 36.8219,
    language: 'Swahili',
    breakfastHint: 'mandazi, chai, eggs, fresh fruit'
  },
  {
    city: 'Paris',
    city_zh: '巴黎',
    country: 'France',
    country_zh: '法國',
    timezone: 'Europe/Paris',
    latitude: 48.8566,
    longtitude: 2.3522,
    language: 'French',
    breakfastHint: 'croissant, butter, jam, cafe au lait'
  },
  {
    city: 'Lisbon',
    city_zh: '里斯本',
    country: 'Portugal',
    country_zh: '葡萄牙',
    timezone: 'Europe/Lisbon',
    latitude: 38.7223,
    longtitude: -9.1393,
    language: 'Portuguese',
    breakfastHint: 'pastel de nata, bread, cheese, coffee'
  },
  {
    city: 'Reykjavik',
    city_zh: '雷克雅維克',
    country: 'Iceland',
    country_zh: '冰島',
    timezone: 'Atlantic/Reykjavik',
    latitude: 64.1466,
    longtitude: -21.9426,
    language: 'Icelandic',
    breakfastHint: 'skyr, rye bread, smoked fish'
  },
  {
    city: 'Buenos Aires',
    city_zh: '布宜諾斯艾利斯',
    country: 'Argentina',
    country_zh: '阿根廷',
    timezone: 'America/Argentina/Buenos_Aires',
    latitude: -34.6037,
    longtitude: -58.3816,
    language: 'Spanish',
    breakfastHint: 'medialunas, dulce de leche, coffee'
  },
  {
    city: 'Mexico City',
    city_zh: '墨西哥城',
    country: 'Mexico',
    country_zh: '墨西哥',
    timezone: 'America/Mexico_City',
    latitude: 19.4326,
    longtitude: -99.1332,
    language: 'Spanish',
    breakfastHint: 'chilaquiles, salsa, beans, coffee'
  },
  {
    city: 'Vancouver',
    city_zh: '溫哥華',
    country: 'Canada',
    country_zh: '加拿大',
    timezone: 'America/Vancouver',
    latitude: 49.2827,
    longtitude: -123.1207,
    language: 'English',
    breakfastHint: 'sourdough toast, eggs, berries, coffee'
  },
  {
    city: 'Honolulu',
    city_zh: '檀香山',
    country: 'United States',
    country_zh: '美國',
    timezone: 'Pacific/Honolulu',
    latitude: 21.3099,
    longtitude: -157.8581,
    language: 'English',
    breakfastHint: 'tropical fruit, loco moco, coffee'
  }
];

function isValidTimeZone(timezone) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function toParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour,
    minute: value.minute,
    second: value.second
  };
}

function minuteOfDay(date, timezone) {
  const parts = toParts(date, timezone);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function nearest8amCity(now) {
  const scored = CITIES.map((item) => {
    const localMinute = minuteOfDay(now, item.timezone);
    return {
      ...item,
      diff: Math.abs(localMinute - TARGET_MINUTE)
    };
  }).sort((a, b) => a.diff - b.diff);

  return scored[0];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function generateGreeting({ city, country, language }) {
  const response = await generateText(
    [
      'Return strict JSON only. No markdown.',
      `City: ${city}`,
      `Country: ${country}`,
      `Primary language: ${language}`,
      'Output schema: {"greeting":"..."}',
      'Generate one natural local-language phrase meaning good morning.'
    ].join('\n')
  );

  const parsed = safeJsonParse(response);
  if (parsed?.greeting && typeof parsed.greeting === 'string') {
    return parsed.greeting.trim();
  }

  return 'Good morning';
}

async function generateStories({ city, country, city_zh, country_zh }) {
  const response = await generateText(
    [
      'Return strict JSON only. No markdown.',
      `City: ${city}`,
      `Country: ${country}`,
      `City zh-TW: ${city_zh}`,
      `Country zh-TW: ${country_zh}`,
      'Output schema: {"story":"...","story_zh":"..."}',
      'story requirements: English, <=150 words, start with "Today you wake up in {city}, {country}."',
      'story_zh requirements: Traditional Chinese, <=150 characters, start with "今天的你甦醒在{country_zh}的{city_zh}，"',
      'Both should include cultural routine, geography, and one less-known historical detail.'
    ].join('\n')
  );

  const parsed = safeJsonParse(response);
  if (parsed?.story && parsed?.story_zh) {
    return {
      story: String(parsed.story).trim(),
      story_zh: String(parsed.story_zh).trim()
    };
  }

  return {
    story: `Today you wake up in ${city}, ${country}. Dawn slides over the streets as local breakfast aromas drift from corner cafes. You follow a narrow lane toward a hill viewpoint and hear snippets of old stories about how this city once rebuilt itself after a forgotten fire. The morning feels like a map opening in your hands, and each step gives you one more clue about how people here learned to live with their land and seasons.`,
    story_zh: `今天的你甦醒在${country_zh}的${city_zh}，清晨的光沿著街道慢慢展開，你聞到在地早餐香氣，邊走邊聽見一段少有人提起的城市往事。地形與氣候塑造了居民的生活節奏，你像在翻開一張冒險地圖。`
  };
}

function buildImagePrompt({ city, country, breakfastHint }) {
  return [
    `Top-down photo of a single-person breakfast set inspired by authentic ${city}, ${country} food culture.`,
    `Include: ${breakfastHint}.`,
    'Only food, utensils, ceramic tableware, and tabletop texture.',
    'No people, no hands, no text, no logo, no watermark.',
    'Natural morning light, realistic details, editorial food photography.'
  ].join(' ');
}

function normalizeClientNow({ clientIsoTime }) {
  const parsed = clientIsoTime ? new Date(clientIsoTime) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

export async function runWakeupWorkflow({ userName, clientTimeZone, clientIsoTime }) {
  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    throw new Error('userName is required');
  }

  const now = normalizeClientNow({ clientIsoTime });
  const timezone = isValidTimeZone(clientTimeZone) ? clientTimeZone : 'UTC';

  const userLocal = toParts(now, timezone);
  const recordedAtDate = `${userLocal.year}-${userLocal.month}-${userLocal.day}`;
  const recordedAt = `${userLocal.hour}:${userLocal.minute}:${userLocal.second}`;

  const selected = nearest8amCity(now);

  const greeting = await generateGreeting(selected);
  const { story, story_zh } = await generateStories(selected);

  const imagePrompt = buildImagePrompt(selected);
  const image = await generateImage({ prompt: imagePrompt, size: '1024x1024' });
  const drive = await uploadImageToDrive({
    buffer: image,
    fileName: `wake-up-${selected.city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`,
    mimeType: 'image/png'
  });

  const record = {
    userName: userName.trim(),
    recordedAtDate,
    recordedAt,
    timezone,
    city: selected.city,
    city_zh: selected.city_zh,
    country: selected.country,
    country_zh: selected.country_zh,
    latitude: selected.latitude,
    longtitude: selected.longtitude,
    greeting,
    story,
    story_zh,
    imageUrl: drive.directUrl
  };

  const notion = await writeWakeupRecordToNotion(record);

  return {
    record,
    drive,
    notion
  };
}
