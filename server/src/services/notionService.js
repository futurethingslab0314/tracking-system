import { Client } from '@notionhq/client';
import { env } from '../config/env.js';

function getNotionClient() {
  if (!env.notionApiKey) {
    throw new Error('NOTION_API_KEY is not configured');
  }
  return new Client({ auth: env.notionApiKey });
}

function titleProperty(content) {
  return {
    title: [{ text: { content: String(content || '') } }]
  };
}

function richTextProperty(content) {
  return {
    rich_text: [{ text: { content: String(content || '') } }]
  };
}

function numberProperty(value) {
  return {
    number: typeof value === 'number' ? value : Number(value)
  };
}

function dateProperty(dateString) {
  return {
    date: { start: dateString }
  };
}

export async function writeToNotionDatabase({ title, content, imageUrl }) {
  if (!env.notionDbId) {
    throw new Error('NOTION_DB_ID is not configured');
  }

  const notion = getNotionClient();

  const properties = {
    [env.notionTitleProperty]: titleProperty(title || 'Untitled entry')
  };

  if (imageUrl) {
    properties[env.notionImageUrlProperty] = {
      url: imageUrl
    };
  }

  const children = [];
  if (content) {
    children.push({
    