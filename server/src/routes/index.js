import { Router } from 'express';
import { listSkills } from '../services/skillService.js';
import { writeToNotionDatabase } from '../services/notionService.js';
import { generateImage, generateText } from '../services/openaiService.js';
import { uploadImageToDrive } from '../services/googleDriveService.js';
import { runWakeupWorkflow } from '../services/wakeupWorkflowService.js';

const router = Router();

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

export default router;
