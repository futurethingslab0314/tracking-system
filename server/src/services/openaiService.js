import OpenAI from 'openai';
import { env } from '../config/env.js';

function getClient() {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: env.openaiApiKey });
}

export async function generateText(prompt) {
  const client = getClient();

  const result = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt
  });

  return result.output_text || '';
}

export async function generateImage({ prompt, size = '1024x1024' }) {
  const client = getClient();

  const result = await client.images.generate({
    model: env.openaiImageModel,
    prompt,
    size
  });

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI image generation did not return base64 image data');
  }

  return Buffer.from(b64, 'base64');
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function generateRecipeFromImage({ imageUrl, city, country, city_zh, country_zh }) {
  const client = getClient();

  const result = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Return strict JSON only.',
              `Image is a breakfast from ${city}, ${country}.`,
              `City zh-TW: ${city_zh}`,
              `Country zh-TW: ${country_zh}`,
              'Output schema: {"recipe":"...","recipe_zh":"..."}',
              'recipe: English single-serving recipe with sections Ingredients, Steps, Total Time.',
              'recipe_zh: Traditional Chinese single-serving recipe with 食材/步驟/總時長.',
              'If some ingredients are uncertain from image, mark them as inferred.'
            ].join('\n')
          },
          {
            type: 'input_image',
            image_url: imageUrl
          }
        ]
      }
    ]
  });

  const parsed = safeJsonParse(result.output_text || '');
  if (parsed?.recipe && parsed?.recipe_zh) {
    return {
      recipe: String(parsed.recipe).trim(),
      recipe_zh: String(parsed.recipe_zh).trim()
    };
  }

  return {
    recipe:
      'Ingredients (1 serving): 2 eggs, 1 slice bread, 1 small fruit, 1 tsp butter, pinch of salt. Steps: Toast bread. Cook eggs in butter over medium heat until set. Plate with sliced fruit. Total Time: 10-12 minutes.',
    recipe_zh:
      '食材（一人份）：雞蛋2顆、吐司1片、小份水果、奶油1茶匙、少許鹽。步驟：先烤吐司；中火用奶油煎蛋至熟；與水果一起裝盤。總時長：約10-12分鐘。'
  };
}
