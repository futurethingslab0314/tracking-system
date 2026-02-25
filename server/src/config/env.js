import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  notionApiKey: process.env.NOTION_API_KEY || '',
  notionDbId: process.env.NOTION_DB_ID || '',
  notionTitleProperty: process.env.NOTION_TITLE_PROPERTY || 'Name',
  notionImageUrlProperty: process.env.NOTION_IMAGE_URL_PROPERTY || 'Image URL',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  g