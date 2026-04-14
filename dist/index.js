"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const error_1 = require("./interfaces/middlewares/error");
const index_1 = __importDefault(require("./interfaces/routes/index"));
async function bootstrap() {
    logger_1.logger.info('🚀 Iniciando CrushFlow V2...');
    await (0, database_1.testConnection)();
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:"],
                fontSrc: ["'self'", "cdnjs.cloudflare.com"],
                connectSrc: ["'self'"],
            },
        },
    }));
    app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN, credentials: true }));
    app.use(express_1.default.json({ limit: '5mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/api/auth/login', (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, max: 20,
        message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' }
    }));
    app.use('/api/', (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 300 }));
    app.use('/api', index_1.default);
    app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0', ts: new Date().toISOString() }));
    const publicDir = path_1.default.join(__dirname, '../public');
    app.use(express_1.default.static(publicDir));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path_1.default.join(publicDir, 'index.html'));
        }
    });
    app.use(error_1.errorHandler);
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`✅ CrushFlow V2 en http://localhost:${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
    });
}
bootstrap().catch(err => {
    logger_1.logger.fatal(err, '❌ Error fatal al iniciar');
    process.exit(1);
});
