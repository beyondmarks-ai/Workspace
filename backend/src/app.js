import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createValidationReport } from './report.js';
import { getJson, getObject, putJson, putObject } from './storage.js';

const allowedExtensions = new Set(['.docx', '.pdf', '.png', '.jpg', '.jpeg']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_request, file, done) => {
    const allowed = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    done(allowed ? null : new Error('Only DOCX, PDF, PNG and JPG references are supported.'), allowed);
  }
});

export function createApp() {
  const app = express();
  const configuredOrigin = process.env.CORS_ORIGIN;
  const corsOrigin = !configuredOrigin || configuredOrigin === '*'
    ? true
    : configuredOrigin.split(',').map(origin => origin.trim());

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  const createJobLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.JOB_RATE_LIMIT || 20),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many document jobs. Please try again later.' }
  });

  app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'beyond-marks-document-api' });
  });

  app.post('/api/jobs', createJobLimit, upload.single('reference'), async (request, response, next) => {
    try {
      if (!request.file) return response.status(400).json({ error: 'A reference document is required.' });

      const jobId = randomUUID();
      const extension = path.extname(request.file.originalname).toLowerCase();
      const referenceKey = `jobs/${jobId}/reference${extension}`;
      const outputKey = `jobs/${jobId}/output.docx`;
      const jobKey = `jobs/${jobId}/job.json`;
      const createdAt = new Date().toISOString();

      await putObject(referenceKey, request.file.buffer, request.file.mimetype);
      await putJson(jobKey, {
        id: jobId,
        status: 'processing',
        createdAt,
        originalName: request.file.originalname,
        prompt: request.body.prompt || ''
      });

      const output = await createValidationReport({
        prompt: request.body.prompt,
        originalName: request.file.originalname,
        jobId
      });
      await putObject(outputKey, output, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      const job = {
        id: jobId,
        status: 'completed',
        createdAt,
        completedAt: new Date().toISOString(),
        originalName: request.file.originalname,
        downloadUrl: `/api/jobs/${jobId}/download`
      };
      await putJson(jobKey, job);
      response.status(201).json(job);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/jobs/:id', async (request, response) => {
    try {
      response.json(await getJson(`jobs/${request.params.id}/job.json`));
    } catch {
      response.status(404).json({ error: 'Job not found.' });
    }
  });

  app.get('/api/jobs/:id/download', async (request, response) => {
    try {
      const output = await getObject(`jobs/${request.params.id}/output.docx`);
      response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      response.setHeader('Content-Disposition', `attachment; filename="beyond-marks-${request.params.id}.docx"`);
      response.send(output);
    } catch {
      response.status(404).json({ error: 'Output not found.' });
    }
  });

  app.use((error, _request, response, _next) => {
    console.error('Document job error:', error);
    const status = error instanceof multer.MulterError || error.message?.startsWith('Only ') ? 400 : 500;
    response.status(status).json({ error: status === 500 ? 'The document job failed.' : error.message });
  });

  return app;
}
