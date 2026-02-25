import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import router from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../../client/dist');

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
}

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
