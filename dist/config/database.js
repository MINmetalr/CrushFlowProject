"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
exports.pool = promise_1.default.createPool({
    host: env_1.env.DB_HOST,
    port: env_1.env.DB_PORT,
    user: env_1.env.DB_USER,
    password: env_1.env.DB_PASSWORD,
    database: env_1.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5, // reducir para no saturar el hosting compartido
    queueLimit: 0,
    connectTimeout: 10000, // 10 segundos
    // Algunos hosts requieren SSL, aunque Hostinger generalmente no
    ...(env_1.env.NODE_ENV === 'production' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
});
async function testDatabaseConnection() {
    try {
        const connection = await exports.pool.getConnection();
        logger_1.logger.info('✅ Conexión a base de datos establecida');
        connection.release();
    }
    catch (error) {
        logger_1.logger.error({ error }, '❌ Error al conectar a la base de datos');
        throw error;
    }
}
