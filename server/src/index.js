import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import router from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRootPath = path.resolve(__dirname, '../../..');
const clientDistPath = path.resolve(__dirname, '../../../client/dist');

function ensureClientBuild() {
  if (fs.existsSync(clientDistPath)) {
    return;
  }

  console.log('client/dist not found. Attempting to build client automatically...');
  const result = spawnSync('npm', ['--workspace', 'client', 'run', 'build'], {
    cwd: repoRootPath,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    console.error('Automatic client build failed. "/" will return 503 until build succeeds.');
  }
}

ensureClientBuild();

app.use(cors());
app.use(express.json());

app.use('/api', router);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(503).send(
      'Client build not found (client/dist). Automatic build failed. Check deploy logs for npm client build errors.'
    );
  });
}

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
