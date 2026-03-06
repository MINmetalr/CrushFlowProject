import mysql from 'mysql2/promise';
import { env } from './env';
import { logger } from '../utils/logger';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // reducir para no saturar el hosting compartido
  queueLimit: 0,
  connectTimeout: 10000, // 10 segundos
  // Algunos hosts requieren SSL, aunque Hostinger generalmente no
  ...(env.NODE_ENV === 'production' && {
    ssl: {
      rejectUnauthorized: false
    }
  })
});

export async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Conexión a base de datos establecida');
    connection.release();
  } catch (error) {
    logger.error({ error }, '❌ Error al conectar a la base de datos');
    throw error;
  }
}