import { Router } from 'express';
import { listSkills } from '../services/skillService.js';
import { writeToNotionDatabase } from '../services/notionService.js';
import { generateText } from '../services/openaiService.js';

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
    const { title, content } = req.body || {};
    const data = await writeToNotionDatabase({ title, content });
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

export default router;
