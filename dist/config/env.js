"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('production'),
    PORT: zod_1.z.coerce.number().default(3000),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.coerce.number().default(3306),
    DB_USER: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_NAME: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES: zod_1.z.string().default('8h'),
    JWT_REFRESH_EXPIRES: zod_1.z.string().default('7d'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().default(465),
    SMTP_SECURE: zod_1.z.string().transform(v => v === 'true').default('true'),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().default(10),
    CORS_ORIGIN: zod_1.z.string().default('*'),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Variables de entorno inválidas:\n', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
