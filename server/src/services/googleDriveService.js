import { Readable } from 'node:stream';
import { google } from 'googleapis';
import { env } from '../config/env.js';

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

function getDriveClient() {
  const credentials = parseServiceAccountCredentials();

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Invalid service account credentials: missing client_email or private_key');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  return google.drive({ version: 'v3', auth });
}

export async function uploadImageToDrive({ buffer, fileName = 'generated-image.png', mimeType = 'image/png' }) {
  if (!env.googleDriveFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
  }

  const drive = getDriveClient();

  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [env.googleDriveFolderId],
      mimeType
    },
    media: {
      mimeType,
      body: Readable.from(buffer)
    },
    fields: 'id,name,webViewLink,webContentLink'
  });

  const fileId = created?.data?.id;
  if (!fileId) {
    throw new Error('Failed to upload file to Google Drive');
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'anyone',
      role: 'reader'
    }
  });

  return {
    fileId,
    fileName: created?.data?.name || fileName,
    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    directUrl: `https://drive.google.com/uc?export=view&id=${fileId}`
  };
}
