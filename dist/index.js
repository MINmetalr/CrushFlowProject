"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
// Configuración y utilidades
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./interfaces/middlewares/errorHandler");
// Repositorios (infraestructura)
const material_repository_impl_1 = require("./infrastructure/repositories/mysql/material.repository.impl");
const conductor_repository_impl_1 = require("./infrastructure/repositories/mysql/conductor.repository.impl");
const cliente_repository_impl_1 = require("./infrastructure/repositories/mysql/cliente.repository.impl");
const proveedor_repository_impl_1 = require("./infrastructure/repositories/mysql/proveedor.repository.impl");
const movimiento_repository_impl_1 = require("./infrastructure/repositories/mysql/movimiento.repository.impl");
// Si tienes UsuarioRepositoryImpl, impórtalo también
// import { UsuarioRepositoryImpl } from './infrastructure/repositories/mysql/usuario.repository.impl';
// Servicios externos
const nodemailer_service_1 = require("./infrastructure/email/nodemailer.service");
// Servicios de aplicación
const movimiento_service_1 = require("./application/services/movimiento.service");
const reporte_service_1 = require("./application/services/reporte.service");
// Controladores
const movimiento_controller_1 = require("./interfaces/controllers/movimiento.controller");
const reporte_controller_1 = require("./interfaces/controllers/reporte.controller");
// Rutas
const movimiento_routes_1 = require("./interfaces/routes/movimiento.routes");
const reporte_routes_1 = require("./interfaces/routes/reporte.routes");
async function bootstrap() {
    console.log('🔵 1. Iniciando bootstrap...');
    // 1. Verificar conexión a base de datos
    console.log('🔵 2. Probando conexión a base de datos...');
    await (0, database_1.testDatabaseConnection)();
    console.log('🟢 3. Conexión a DB exitosa');
    // 2. Inicializar repositorios
    console.log('🔵 4. Inicializando repositorios...');
    const materialRepo = new material_repository_impl_1.MaterialRepositoryImpl();
    const conductorRepo = new conductor_repository_impl_1.ConductorRepositoryImpl();
    const clienteRepo = new cliente_repository_impl_1.ClienteRepositoryImpl();
    const proveedorRepo = new proveedor_repository_impl_1.ProveedorRepositoryImpl();
    const movimientoRepo = new movimiento_repository_impl_1.MovimientoRepositoryImpl();
    // 3. Inicializar servicios externos
    console.log('🔵 5. Inicializando servicio de correo...');
    const emailService = new nodemailer_service_1.NodemailerService();
    // 4. Inicializar servicios de aplicación
    console.log('🔵 6. Inicializando servicios de aplicación...');
    const movimientoService = new movimiento_service_1.MovimientoService(movimientoRepo, materialRepo, conductorRepo, clienteRepo, proveedorRepo, emailService);
    const reporteService = new reporte_service_1.ReporteService(movimientoRepo);
    // 5. Inicializar controladores
    console.log('🔵 7. Inicializando controladores...');
    const movimientoController = new movimiento_controller_1.MovimientoController(movimientoService);
    const reporteController = new reporte_controller_1.ReporteController(reporteService);
    // 6. Configurar Express
    console.log('🔵 8. Configurando Express...');
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // 7. Montar rutas
    console.log('🔵 9. Montando rutas...');
    app.use('/api', (0, movimiento_routes_1.createMovimientoRoutes)(movimientoController));
    app.use('/api/reportes', (0, reporte_routes_1.createReporteRoutes)(reporteController));
    // 8. Middleware de errores (debe ir después de las rutas)
    app.use(errorHandler_1.errorHandler);
    // 9. Iniciar servidor
    console.log(`🔵 10. Intentando iniciar servidor en puerto ${env_1.env.PORT}...`);
    app.listen(env_1.env.PORT, () => {
        console.log(`🟢 11. ✅ Servidor corriendo en http://localhost:${env_1.env.PORT}`);
        logger_1.logger.info(`Servidor iniciado en puerto ${env_1.env.PORT} en modo ${env_1.env.NODE_ENV}`);
    });
}
// Punto de entrada
console.log('🔵 0. Iniciando aplicación...');
bootstrap().catch((err) => {
    console.error('🔴 Error fatal en bootstrap:', err);
    logger_1.logger.fatal(err, 'Error fatal al iniciar la aplicación');
    process.exit(1);
});
