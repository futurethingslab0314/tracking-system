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
