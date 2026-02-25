import { Readable } from 'node:stream';
import { google } from 'googleapis';
import { env } from '../config/env.js';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

function getOAuthClient() {
  if (!env.googleOauthClientId || !env.googleOauthClientSecret || !env.googleOauthRedirectUri) {
    throw new Error(
      'Google OAuth is not fully configured. Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REDIRECT_URI.'
    );
  }

  return new google.auth.OAuth2(
    env.googleOauthClientId,
    env.googleOauthClientSecret,
    env.googleOauthRedirectUri
  );
}

function hasOAuthRefreshToken() {
  return Boolean(env.googleOauthRefreshToken);
}

function parseServiceAccountCredentials() {
  if (env.googleServiceAccountKeyJson) {
    const creds = JSON.parse(env.googleServiceAccountKeyJson);
    creds.private_key = creds.private_key?.replace(/\\n/g, '\n');
    return creds;
  }

  if (env.googleServiceAccountKeyBase64) {
    const decoded = Buffer.from(env.googleServiceAccountKeyBase64, 'base64').toString('utf8');
    const creds = JSON.parse(decoded);
    creds.private_key = creds.private_key?.replace(/\\n/g, '\n');
    return creds;
  }

  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not configured');
}

function getDriveClientWithServiceAccount() {
  const credentials = parseServiceAccountCredentials();

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Invalid service account credentials: missing client_email or private_key');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [DRIVE_SCOPE]
  });

  return google.drive({ version: 'v3', auth });
}

function getDriveClientWithOAuthRefreshToken() {
  const oauth = getOAuthClient();
  oauth.setCredentials({ refresh_token: env.googleOauthRefreshToken });
  return google.drive({ version: 'v3', auth: oauth });
}

function getDriveClient() {
  if (hasOAuthRefreshToken()) {
    return getDriveClientWithOAuthRefreshToken();
  }
  return getDriveClientWithServiceAccount();
}

export function getGoogleOAuthConsentUrl({ state = '' } = {}) {
  const oauth = getOAuthClient();
  return oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [DRIVE_SCOPE],
    state
  });
}

export async function exchangeGoogleOAuthCode(code) {
  if (!code) {
    throw new Error('code is required');
  }

  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);
  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || '',
    expiryDate: tokens.expiry_date || null,
    scope: tokens.scope || ''
  };
}

export async function uploadImageToDrive({ buffer, fileName = 'generated-image.png', mimeType = 'image/png' }) {
  if (!env.googleDriveFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
  }

  const drive = getDriveClient();

  let created;
  try {
    created = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [env.googleDriveFolderId],
        mimeType
      },
      media: {
        mimeType,
        body: Readable.from(buffer)
      },
      fields: 'id,name,webViewLink,webContentLink',
      supportsAllDrives: true
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('Service Accounts do not have storage quota')) {
      throw new Error(
        'Google Drive upload failed: this folder is likely in My Drive. For Service Account, use a Shared Drive folder (or switch to OAuth user flow).'
      );
    }
    if (message.includes('invalid_grant') || message.includes('invalid_client')) {
      throw new Error('Google OAuth upload failed: invalid OAuth credentials or refresh token.');
    }
    throw error;
  }

  const fileId = created?.data?.id;
  if (!fileId) {
    throw new Error('Failed to upload file to Google Drive');
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'anyone',
      role: 'reader'
    },
    supportsAllDrives: true
  });

  return {
    fileId,
    fileName: created?.data?.name || fileName,
    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    directUrl: `https://drive.google.com/uc?export=view&id=${fileId}`
  };
}
