import { Router } from 'express';
import crypto from 'node:crypto';
import { listSkills } from '../services/skillService.js';
import { writeToNotionDatabase } from '../services/notionService.js';
import { generateImage, generateText } from '../services/openaiService.js';
import {
  exchangeGoogleOAuthCode,
  getGoogleOAuthConsentUrl,
  uploadImageToDrive
} from '../services/googleDriveService.js';
import { completeWakeupDraft, createWakeupDraft, runWakeupWorkflow } from '../services/wakeupWorkflowService.js';

const router = Router();
const wakeupJobs = new Map();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'agent-server' });
});

router.get('/skills', async (_req, res, next) => {
  try {
    const skills = await listSkills();
    res.json({ skills });
  } catch (error) {
    next(error);
  }
});

router.get('/google/oauth/url', (req, res, next) => {
  try {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const url = getGoogleOAuthConsentUrl({ state });
    res.json({ ok: true, url });
  } catch (error) {
    next(error);
  }
});

router.get('/google/oauth/callback', async (req, res, next) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      return res.status(400).json({ ok: false, error: 'code is required' });
    }

    const tokens = await exchangeGoogleOAuthCode(code);
    return res.json({
      ok: true,
      message:
        'OAuth code exchanged. Save refreshToken to GOOGLE_OAUTH_REFRESH_TOKEN in Railway (if present).',
      tokens
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/notion/write', async (req, res, next) => {
  try {
    const { title, content, imageUrl } = req.body || {};
    const data = await writeToNotionDatabase({ title, content, imageUrl });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.post('/openai/generate', async (req, res, next) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'prompt is required' });
    }

    const text = await generateText(prompt);
    return res.json({ ok: true, text });
  } catch (error) {
    return next(error);
  }
});

router.post('/workflow/generate-image-to-drive-notion', async (req, res, next) => {
  try {
    const {
      prompt,
      title,
      content,
      size = '1024x1024',
      fileName = `generated-${Date.now()}.png`
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'prompt is required' });
    }

    const imageBuffer = await generateImage({ prompt, size });
    const drive = await uploadImageToDrive({
      buffer: imageBuffer,
      fileName,
      mimeType: 'image/png'
    });

    const notion = await writeToNotionDatabase({
      title: title || prompt.slice(0, 80),
      content: content || `Generated from prompt: ${prompt}`,
      imageUrl: drive.directUrl
    });

    return res.json({
      ok: true,
      data: {
        drive,
        notion
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/wakeup/run', async (req, res, next) => {
  try {
    const { userName, clientTimeZone, clientIsoTime } = req.body || {};

    if (!userName || typeof userName !== 'string') {
      return res.status(400).json({ ok: false, error: 'userName is required' });
    }

    const data = await runWakeupWorkflow({
      userName,
      clientTimeZone,
      clientIsoTime
    });

    return res.json({ ok: true, data });
  } catch (error) {
    return next(error);
  }
});

router.post('/wakeup/start', async (req, res, next) => {
  try {
    const { userName, clientTimeZone, clientIsoTime } = req.body || {};

    if (!userName || typeof userName !== 'string') {
      return res.status(400).json({ ok: false, error: 'userName is required' });
    }

    const draft = createWakeupDraft({ userName, clientTimeZone, clientIsoTime });
    const jobId = crypto.randomUUID();

    wakeupJobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: 20,
      message: 'Basic wake-up profile ready.',
      storyReady: false,
      imageReady: false,
      record: draft.record,
      drive: null,
      notion: null,
      error: null,
      createdAt: Date.now()
    });

    void completeWakeupDraft({
      draft,
      onProgress: (update) => {
        const current = wakeupJobs.get(jobId);
        if (!current) {
          return;
        }

        wakeupJobs.set(jobId, {
          ...current,
          progress: update.progress ?? current.progress,
          message: update.message ?? current.message,
          storyReady: update.storyReady ?? current.storyReady,
          imageReady: update.imageReady ?? current.imageReady,
          record: update.stories
            ? {
                ...current.record,
                story: update.stories.story,
                story_zh: update.stories.story_zh
              }
            : current.record,
          drive: update.drive || current.drive
        });
      }
    })
      .then((finalData) => {
        const current = wakeupJobs.get(jobId);
        if (!current) {
          return;
        }
        wakeupJobs.set(jobId, {
          ...current,
          status: 'completed',
          progress: 100,
          message: 'Completed and synced to Notion.',
          storyReady: true,
          imageReady: true,
          record: finalData.record,
          drive: finalData.drive,
          notion: finalData.notion
        });
      })
      .catch((error) => {
        const current = wakeupJobs.get(jobId);
        if (!current) {
          return;
        }
        wakeupJobs.set(jobId, {
          ...current,
          status: 'failed',
          message: 'Generation failed',
          error: error.message || 'Unknown error'
        });
      });

    return res.json({
      ok: true,
      data: {
        jobId,
        status: 'running',
        progress: 20,
        message: 'Basic wake-up profile ready.',
        record: draft.record,
        storyReady: false,
        imageReady: false
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/wakeup/status/:jobId', (req, res) => {
  const job = wakeupJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ ok: false, error: 'job not found' });
  }

  return res.json({ ok: true, data: job });
});

export default router;
