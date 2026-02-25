import { Client } from '@notionhq/client';
import { env } from '../config/env.js';

function getNotionClient() {
  if (!env.notionApiKey) {
    throw new Error('NOTION_API_KEY is not configured');
  }
  return new Client({ auth: env.notionApiKey });
}

export async function writeToNotionDatabase({ title, content }) {
  if (!env.notionDbId) {
    throw new Error('NOTION_DB_ID is not configured');
  }

  const notion = getNotionClient();

  const response = await notion.pages.create({
    parent: { database_id: env.notionDbId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: title || 'Untitled entry'
            }
          }
        ]
      }
    },
    children: content
      ? [
          {
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
          }
        ]
      : []
  });

  return {
    id: response.id,
    url: response.url
  };
}
