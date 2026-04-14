import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV:     z.enum(['development','production','test']).default('production'),
  PORT:         z.coerce.number().default(3000),
  DB_HOST:      z.string().default('localhost'),
  DB_PORT:      z.coerce.number().default(3306),
  DB_USER:      z.string(),
  DB_PASSWORD:  z.string(),
  DB_NAME:      z.string(),
  JWT_SECRET:   z.string().min(32),
  JWT_EXPIRES:  z.string().default('8h'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  SMTP_HOST:    z.string().optional(),
  SMTP_PORT:    z.coerce.number().default(465),
  SMTP_SECURE:  z.string().transform(v => v === 'true').default('true'),
  SMTP_USER:    z.string().optional(),
  SMTP_PASS:    z.string().optional(),
  EMAIL_FROM:   z.string().optional(),
  LOG_LEVEL:    z.enum(['trace','debug','info','warn','error']).default('info'),
  BCRYPT_ROUNDS: z.coerce.number().default(10),
  CORS_ORIGIN:  z.string().default('*'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
