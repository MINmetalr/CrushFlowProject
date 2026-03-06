"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().int()),
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().int()).default('3306'),
    DB_USER: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_NAME: zod_1.z.string(),
    SMTP_HOST: zod_1.z.string(),
    SMTP_PORT: zod_1.z.string().transform(Number).pipe(zod_1.z.number().positive().int()),
    SMTP_SECURE: zod_1.z.string().transform(val => val === 'true'),
    SMTP_USER: zod_1.z.string().email(),
    SMTP_PASS: zod_1.z.string(),
    EMAIL_FROM: zod_1.z.string().email(),
    LOG_LEVEL: zod_1.z.enum(['info', 'debug', 'error']).default('info'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Variables de entorno inválidas:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
