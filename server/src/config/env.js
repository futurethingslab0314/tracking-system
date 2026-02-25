import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  notionApiKey: process.env.NOTION_API_KEY || '',
  notionDbId: process.env.NOTION_DB_ID || '',
  openaiApiKey: process.env.OPENAI_API_KEY || ''
};

export function assertRequiredEnv(keys = []) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
