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

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export async function generateRecipeFromImage({ imageUrl, city, country, city_zh, country_zh }) {
  const client = getClient();

  // Stage 1: visual detection first (what is really visible vs inferred).
  const detect = await client.responses.create({
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
              'Identify visible food items and tableware only.',
              'Output schema: {"visible_items":[],"inferred_items":[],"staple":"rice|bread|noodle|other|unknown","confidence":0-1}.',
              'Do not guess bread/toast unless clearly visible.',
              'If staple looks like white rice with meat/sauce, staple must be "rice".'
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

  const detectParsed = safeJsonParse(detect.output_text || '') || {};
  const visibleItems = asStringArray(detectParsed.visible_items);
  const inferredItems = asStringArray(detectParsed.inferred_items);
  const staple = String(detectParsed.staple || 'unknown').toLowerCase();

  // Stage 2: generate recipe constrained by detected items.
  const recipeGen = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'Return strict JSON only.',
              `City: ${city}, Country: ${country}`,
              `City zh-TW: ${city_zh}, Country zh-TW: ${country_zh}`,
              `Visible items: ${JSON.stringify(visibleItems)}`,
              `Inferred items: ${JSON.stringify(inferredItems)}`,
              `Staple: ${staple}`,
              'Output schema: {"recipe":"...","recipe_zh":"..."}',
              'Both recipes must be single-serving.',
              'recipe: English with sections Ingredients, Steps, Total Time.',
              'recipe_zh: Traditional Chinese with sections 食材、步驟、總時長.',
              'Only use visible items as primary ingredients; inferred items are optional and must be marked as inferred.',
              'If staple is rice, do not include bread/toast.'
            ].join('\n')
          }
        ]
      }
    ]
  });

  let parsed = safeJsonParse(recipeGen.output_text || '');

  // Hard guard for common failure mode: rice scene but bread recipe.
  if (
    parsed?.recipe &&
    staple === 'rice' &&
    /\b(bread|toast)\b/i.test(String(parsed.recipe))
  ) {
    const retry = await client.responses.create({
      model: 'gpt-4.1-mini',
      input:
        'Return strict JSON only: {"recipe":"...","recipe_zh":"..."}\nFix previous result: staple is rice, so remove any bread/toast references and regenerate a one-person rice-based breakfast recipe in EN/ZH.'
    });
    parsed = safeJsonParse(retry.output_text || parsed);
  }

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
