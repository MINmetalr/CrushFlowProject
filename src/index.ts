import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { testConnection } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './interfaces/middlewares/error';
import apiRouter from './interfaces/routes/index';

async function bootstrap() {
  logger.info('🚀 Iniciando CrushFlow V2...');

  // ── Conexión BD ──────────────────────────────────────────────────────────
  await testConnection();

  const app = express();

  // ── Seguridad ─────────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
        styleSrc:   ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
        imgSrc:     ["'self'", "data:", "blob:"],
        fontSrc:    ["'self'", "cdnjs.cloudflare.com"],
        connectSrc: ["'self'"],
      },
    },
  }));
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 20,
    message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' }
  }));
  app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 300 }));

  // ── API ───────────────────────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', version: '2.0.0', ts: new Date().toISOString() })
  );

  // ── Frontend estático ─────────────────────────────────────────────────────
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));

  // SPA fallback — para rutas de frontend que no son /api
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicDir, 'index.html'));
    }
  });

  // ── Error handler (siempre al final) ──────────────────────────────────────
  app.use(errorHandler);

  // ── Iniciar servidor ──────────────────────────────────────────────────────
  app.listen(env.PORT, () => {
    logger.info(`✅ CrushFlow V2 en http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch(err => {
  logger.fatal(err, '❌ Error fatal al iniciar');
  process.exit(1);
});
