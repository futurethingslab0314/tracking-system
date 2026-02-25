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
