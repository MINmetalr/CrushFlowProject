import 'express-async-errors';
import express from 'express';

// Configuración y utilidades
import { env } from './config/env';
import { testDatabaseConnection } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './interfaces/middlewares/errorHandler';

// Repositorios
import { MaterialRepositoryImpl } from './infrastructure/repositories/mysql/material.repository.impl';
import { ConductorRepositoryImpl } from './infrastructure/repositories/mysql/conductor.repository.impl';
import { ClienteRepositoryImpl } from './infrastructure/repositories/mysql/cliente.repository.impl';
import { ProveedorRepositoryImpl } from './infrastructure/repositories/mysql/proveedor.repository.impl';
import { MovimientoRepositoryImpl } from './infrastructure/repositories/mysql/movimiento.repository.impl';

// Servicios externos
import { NodemailerService } from './infrastructure/email/nodemailer.service';

// Servicios de aplicación
import { MovimientoService } from './application/services/movimiento.service';
import { ReporteService } from './application/services/reporte.service';

// Controladores
import { MovimientoController } from './interfaces/controllers/movimiento.controller';
import { ReporteController } from './interfaces/controllers/reporte.controller';
// Nuevo controlador de catálogos
import { CatalogoController } from './interfaces/controllers/catalogo.controller';

// Rutas
import { createMovimientoRoutes } from './interfaces/routes/movimiento.routes';
import { createReporteRoutes } from './interfaces/routes/reporte.routes';
// Nuevas rutas de catálogos
import { createCatalogoRoutes } from './interfaces/routes/catalogo.routes';

async function bootstrap() {
  console.log('🔵 1. Iniciando bootstrap...');
  
  await testDatabaseConnection();
  console.log('🟢 3. Conexión a DB exitosa');

  // Inicializar repositorios
  console.log('🔵 4. Inicializando repositorios...');
  const materialRepo = new MaterialRepositoryImpl();
  const conductorRepo = new ConductorRepositoryImpl();
  const clienteRepo = new ClienteRepositoryImpl();
  const proveedorRepo = new ProveedorRepositoryImpl();
  const movimientoRepo = new MovimientoRepositoryImpl();

  // Inicializar servicios externos
  console.log('🔵 5. Inicializando servicio de correo...');
  const emailService = new NodemailerService();

  // Inicializar servicios de aplicación
  console.log('🔵 6. Inicializando servicios de aplicación...');
  const movimientoService = new MovimientoService(
    movimientoRepo,
    materialRepo,
    conductorRepo,
    clienteRepo,
    proveedorRepo,
    emailService
  );
  const reporteService = new ReporteService(movimientoRepo);

  // Inicializar controladores
  console.log('🔵 7. Inicializando controladores...');
  const movimientoController = new MovimientoController(movimientoService);
  const reporteController = new ReporteController(reporteService);
  // Controlador de catálogos
  const catalogoController = new CatalogoController(
    materialRepo,
    conductorRepo,
    clienteRepo,
    proveedorRepo
  );

  // Configurar Express
  console.log('🔵 8. Configurando Express...');
  const app = express();
  app.use(express.json());

  // Montar rutas
  console.log('🔵 9. Montando rutas...');
  app.use('/api', createMovimientoRoutes(movimientoController));
  app.use('/api', createReporteRoutes(reporteController));
  app.use('/api', createCatalogoRoutes(catalogoController)); // <-- NUEVO

  // Middleware de errores
  app.use(errorHandler);

  // Iniciar servidor
  console.log(`🔵 10. Intentando iniciar servidor en puerto ${env.PORT}...`);
  app.listen(env.PORT, () => {
    console.log(`🟢 11. ✅ Servidor corriendo en http://localhost:${env.PORT}`);
    logger.info(`Servidor iniciado en puerto ${env.PORT} en modo ${env.NODE_ENV}`);
  });
}

console.log('🔵 0. Iniciando aplicación...');
bootstrap().catch((err) => {
  console.error('🔴 Error fatal en bootstrap:', err);
  logger.fatal(err, 'Error fatal al iniciar la aplicación');
  process.exit(1);
});