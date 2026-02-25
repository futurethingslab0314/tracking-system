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
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content
            }
          }
        ]
      }
    });
  }

  const response = await notion.pages.create({
    parent: { database_id: env.notionDbId },
    properties,
    children
  });

  return {
    id: response.id,
    url: response.url
  };
}

export async function writeWakeupRecordToNotion(record) {
  if (!env.notionDbId) {
    throw new Error('NOTION_DB_ID is not configured');
  }

  const notion = getNotionClient();

  const properties = {
    userName: titleProperty(record.userName),
    recordedAtDate: dateProperty(record.recordedAtDate),
    recordedAt: richTextProperty(record.recordedAt),
    city: richTextProperty(record.city),
    city_zh: richTextProperty(record.city_zh),
    country: richTextProperty(record.country),
    country_zh: richTextProperty(record.country_zh),
    localTime: richTextProperty(record.localTime),
    latitude: numberProperty(record.latitude),
    longtitude: numberProperty(record.longtitude),
    greeting: richTextProperty(record.greeting),
    story: richTextProperty(record.story),
    story_zh: richTextProperty(record.story_zh),
    recipe: richTextProperty(record.recipe),
    recipe_zh: richTextProperty(record.recipe_zh),
    'Image URL': {
      url: record.imageUrl || null
    }
  };

  const response = await notion.pages.create({
    parent: { database_id: env.notionDbId },
    properties
  });

  return {
    id: response.id,
    url: response.url
  };
}
