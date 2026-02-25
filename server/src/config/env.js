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
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
  googleOauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  googleOauthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
  googleOauthRefreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN || '',
  googleServiceAccountKeyJson: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON || '',
  googleServiceAccountKeyBase64: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || ''
};

export function assertRequiredEnv(keys = []) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
