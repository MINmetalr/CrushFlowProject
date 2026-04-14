"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middlewares/auth");
const error_1 = require("../middlewares/error");
const response_1 = require("../../utils/response");
const auth_service_1 = require("../../application/services/auth.service");
const base_service_1 = require("../../application/services/base.service");
const inventario_service_1 = require("../../application/services/inventario.service");
const compras_service_1 = require("../../application/services/compras.service");
const ventas_service_1 = require("../../application/services/ventas.service");
const rrhh_service_1 = require("../../application/services/rrhh.service");
const reportes_service_1 = require("../../application/services/reportes.service");
const database_1 = require("../../config/database");
const router = (0, express_1.Router)();
const auth = new auth_service_1.AuthService();
const materiales = new base_service_1.MaterialRepository();
const conductores = new base_service_1.ConductorRepository();
const proveedores = new base_service_1.ProveedorRepository();
const clientes = new base_service_1.ClienteRepository();
const usuarios = new base_service_1.UsuarioRepository();
const roles = new base_service_1.RolRepository();
const departamentos = new base_service_1.DepartamentoRepository();
const cargos = new base_service_1.CargoRepository();
const cuentas = new base_service_1.CuentaRepository();
const inventario = new inventario_service_1.MovimientoService();
const compras = new compras_service_1.ComprasService();
const ventas = new ventas_service_1.VentasService();
const rrhh = new rrhh_service_1.RrhhService();
const reportes = new reportes_service_1.ReporteService();
function crudRoutes(prefix, repo, readPerm, writePerm) {
    const r = (0, express_1.Router)();
    r.get('/', auth_1.requireAuth, (0, auth_1.requirePermission)(readPerm), async (req, res) => { const result = await repo.findAll({}, req.query); (0, response_1.ok)(res, result.data, result.meta); });
    r.get('/:id', auth_1.requireAuth, (0, auth_1.requirePermission)(readPerm), async (req, res) => {
        const item = await repo.findById(+req.params.id);
        item ? (0, response_1.ok)(res, item) : (0, response_1.notFound)(res, prefix);
    });
    r.post('/', auth_1.requireAuth, (0, auth_1.requirePermission)(writePerm), async (req, res) => (0, response_1.created)(res, await repo.create(req.body)));
    r.put('/:id', auth_1.requireAuth, (0, auth_1.requirePermission)(writePerm), async (req, res) => {
        const item = await repo.update(+req.params.id, req.body);
        item ? (0, response_1.ok)(res, item) : (0, response_1.notFound)(res, prefix);
    });
    r.delete('/:id', auth_1.requireAuth, (0, auth_1.requirePermission)(writePerm), async (req, res) => {
        await repo.softDelete(+req.params.id);
        (0, response_1.ok)(res, { id: +req.params.id });
    });
    return r;
}
router.post('/auth/login', (0, error_1.validateBody)(zod_1.z.object({
    email: zod_1.z.string().email(), password: zod_1.z.string().min(1)
})), async (req, res) => (0, response_1.ok)(res, await auth.login(req.body)));
router.post('/auth/refresh', async (req, res) => {
    const token = req.body.refreshToken;
    if (!token)
        return (0, response_1.badRequest)(res, 'refreshToken requerido');
    (0, response_1.ok)(res, await auth.refresh(token));
});
router.post('/auth/logout', auth_1.requireAuth, async (req, res) => {
    await auth.logout(req.user.userId);
    (0, response_1.ok)(res, { message: 'Sesión cerrada' });
});
router.put('/auth/password', auth_1.requireAuth, (0, error_1.validateBody)(zod_1.z.object({
    currentPassword: zod_1.z.string(), newPassword: zod_1.z.string().min(8)
})), async (req, res) => {
    await auth.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    (0, response_1.ok)(res, { message: 'Contraseña actualizada' });
});
router.get('/auth/me', auth_1.requireAuth, async (req, res) => {
    const user = await (0, database_1.queryOne)(`SELECT u.id, u.nombre, u.email, u.departamento_id, u.activo, u.ultimo_acceso,
            r.nombre AS rol, r.permisos, d.nombre AS departamento
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     LEFT JOIN departamentos d ON d.id = u.departamento_id
     WHERE u.id = ?`, [req.user.userId]);
    (0, response_1.ok)(res, user);
});
router.use('/materiales', crudRoutes('Material', materiales, 'catalogos.read', 'catalogos.write'));
router.use('/conductores', crudRoutes('Conductor', conductores, 'catalogos.read', 'catalogos.write'));
router.use('/proveedores', crudRoutes('Proveedor', proveedores, 'proveedores.read', 'proveedores.write'));
router.use('/clientes', crudRoutes('Cliente', clientes, 'clientes.read', 'clientes.write'));
router.use('/departamentos', crudRoutes('Departamento', departamentos, 'usuarios.read', 'usuarios.write'));
router.use('/cargos', crudRoutes('Cargo', cargos, 'rrhh.read', 'rrhh.write'));
router.use('/cuentas', crudRoutes('Cuenta', cuentas, 'finanzas.read', 'finanzas.write'));
router.use('/roles', crudRoutes('Rol', roles, 'usuarios.read', 'usuarios.write'));
router.get('/usuarios', auth_1.requireAuth, (0, auth_1.requirePermission)('usuarios.read'), async (req, res) => {
    const result = await usuarios.findAll({}, req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.get('/usuarios/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('usuarios.read'), async (req, res) => {
    const u = await usuarios.findById(+req.params.id);
    u ? (0, response_1.ok)(res, u) : (0, response_1.notFound)(res, 'Usuario');
});
router.post('/usuarios', auth_1.requireAuth, (0, auth_1.requirePermission)('usuarios.write'), (0, error_1.validateBody)(zod_1.z.object({
    nombre: zod_1.z.string().min(2), email: zod_1.z.string().email(), password: zod_1.z.string().min(8),
    rol_id: zod_1.z.number().int().positive(), departamento_id: zod_1.z.number().int().positive().optional(),
})), async (req, res) => (0, response_1.created)(res, await usuarios.create(req.body)));
router.put('/usuarios/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('usuarios.write'), async (req, res) => {
    const { password, ...data } = req.body;
    if (password) {
        data.password_hash = await bcryptjs_1.default.hash(password, 10);
    }
    const u = await usuarios.update(+req.params.id, data);
    u ? (0, response_1.ok)(res, u) : (0, response_1.notFound)(res, 'Usuario');
});
router.delete('/usuarios/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('usuarios.write'), async (req, res) => {
    if (req.params.id === String(req.user.userId)) {
        return (0, response_1.badRequest)(res, 'No puedes desactivar tu propia cuenta');
    }
    await usuarios.softDelete(+req.params.id);
    (0, response_1.ok)(res, { id: +req.params.id });
});
router.get('/inventario/stock', auth_1.requireAuth, (0, auth_1.requirePermission)('inventario.read'), async (_req, res) => (0, response_1.ok)(res, await inventario.getStock()));
router.get('/movimientos', auth_1.requireAuth, (0, auth_1.requirePermission)('inventario.read'), async (req, res) => {
    const result = await inventario.findAll(req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.get('/movimientos/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('inventario.read'), async (req, res) => {
    const m = await inventario.findById(+req.params.id);
    m ? (0, response_1.ok)(res, m) : (0, response_1.notFound)(res, 'Movimiento');
});
router.post('/movimientos', auth_1.requireAuth, (0, auth_1.requirePermission)('movimientos.create'), (0, error_1.validateBody)(inventario_service_1.MovimientoSchema), async (req, res) => (0, response_1.created)(res, await inventario.create(req.body, req.user.userId)));
router.get('/compras/ordenes', auth_1.requireAuth, (0, auth_1.requirePermission)('compras.read'), async (req, res) => {
    const result = await compras.findOrdenes(req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.get('/compras/ordenes/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('compras.read'), async (req, res) => {
    const o = await compras.findOrdenById(+req.params.id);
    o ? (0, response_1.ok)(res, o) : (0, response_1.notFound)(res, 'Orden de compra');
});
router.post('/compras/ordenes', auth_1.requireAuth, (0, auth_1.requirePermission)('compras.write'), (0, error_1.validateBody)(compras_service_1.OrdenCompraSchema), async (req, res) => (0, response_1.created)(res, await compras.createOrden(req.body, req.user.userId)));
router.patch('/compras/ordenes/:id/estado', auth_1.requireAuth, (0, auth_1.requirePermission)('compras.write'), (0, error_1.validateBody)(zod_1.z.object({ estado: zod_1.z.string() })), async (req, res) => (0, response_1.ok)(res, await compras.updateEstado(+req.params.id, req.body.estado, req.user.userId)));
router.get('/ventas/ordenes', auth_1.requireAuth, (0, auth_1.requirePermission)('ventas.read'), async (req, res) => {
    const result = await ventas.findOrdenes(req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.get('/ventas/ordenes/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('ventas.read'), async (req, res) => {
    const o = await ventas.findOrdenById(+req.params.id);
    o ? (0, response_1.ok)(res, o) : (0, response_1.notFound)(res, 'Orden de venta');
});
router.post('/ventas/ordenes', auth_1.requireAuth, (0, auth_1.requirePermission)('ventas.write'), (0, error_1.validateBody)(ventas_service_1.OrdenVentaSchema), async (req, res) => (0, response_1.created)(res, await ventas.createOrden(req.body, req.user.userId)));
router.patch('/ventas/ordenes/:id/estado', auth_1.requireAuth, (0, auth_1.requirePermission)('ventas.write'), (0, error_1.validateBody)(zod_1.z.object({ estado: zod_1.z.string() })), async (req, res) => (0, response_1.ok)(res, await ventas.updateEstado(+req.params.id, req.body.estado)));
router.get('/rrhh/empleados', auth_1.requireAuth, (0, auth_1.requirePermission)('rrhh.read'), async (req, res) => {
    const result = await rrhh.findEmpleados(req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.get('/rrhh/empleados/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('rrhh.read'), async (req, res) => {
    const e = await rrhh.findEmpleadoById(+req.params.id);
    e ? (0, response_1.ok)(res, e) : (0, response_1.notFound)(res, 'Empleado');
});
router.post('/rrhh/empleados', auth_1.requireAuth, (0, auth_1.requirePermission)('rrhh.write'), async (req, res) => (0, response_1.created)(res, await rrhh.createEmpleado(req.body)));
router.put('/rrhh/empleados/:id', auth_1.requireAuth, (0, auth_1.requirePermission)('rrhh.write'), async (req, res) => (0, response_1.ok)(res, await rrhh.updateEmpleado(+req.params.id, req.body)));
router.get('/rrhh/nomina', auth_1.requireAuth, (0, auth_1.requirePermission)('nomina.read'), async (req, res) => {
    const result = await rrhh.findNomina(req.query);
    (0, response_1.ok)(res, result.data, result.meta);
});
router.post('/rrhh/nomina', auth_1.requireAuth, (0, auth_1.requirePermission)('nomina.write'), async (req, res) => (0, response_1.created)(res, await rrhh.createNomina(req.body, req.user.userId)));
router.get('/finanzas/transacciones', auth_1.requireAuth, (0, auth_1.requirePermission)('finanzas.read'), async (req, res) => {
    const { page, limit, offset } = (0, response_1.parsePageParams)(req.query);
    const data = await database_1.query(`SELECT t.*, c.nombre AS cuenta_nombre FROM transacciones t
     JOIN cuentas c ON c.id = t.cuenta_id ORDER BY t.fecha DESC LIMIT ? OFFSET ?`, [limit, offset]);
    (0, response_1.ok)(res, data);
});
router.post('/finanzas/transacciones', auth_1.requireAuth, (0, auth_1.requirePermission)('finanzas.write'), (0, error_1.validateBody)(zod_1.z.object({
    tipo: zod_1.z.enum(['ingreso', 'egreso', 'traslado']),
    cuenta_id: zod_1.z.number().int().positive(),
    fecha: zod_1.z.string(),
    monto: zod_1.z.number().positive(),
    descripcion: zod_1.z.string().min(3),
    referencia: zod_1.z.string().optional(),
    entidad: zod_1.z.string().optional(),
})), async (req, res) => {
    const numero = `TRX-${Date.now()}`;
    const result = await (0, database_1.execute)(`INSERT INTO transacciones (numero, tipo, cuenta_id, fecha, monto, descripcion, referencia, entidad, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [numero, req.body.tipo, req.body.cuenta_id, req.body.fecha, req.body.monto,
        req.body.descripcion, req.body.referencia ?? null, req.body.entidad ?? null, req.user.userId]);
    (0, response_1.created)(res, await (0, database_1.queryOne)('SELECT * FROM transacciones WHERE id = ?', [result.insertId]));
});
router.get('/reportes/dashboard', auth_1.requireAuth, async (_req, res) => (0, response_1.ok)(res, await reportes.dashboard()));
router.get('/reportes/inventario', auth_1.requireAuth, (0, auth_1.requirePermission)('reportes.*'), async (req, res) => (0, response_1.ok)(res, await reportes.inventario(req.query)));
router.get('/reportes/movimientos', auth_1.requireAuth, (0, auth_1.requirePermission)('reportes.*'), async (req, res) => {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0, 10), hasta = new Date().toISOString().slice(0, 10) } = req.query;
    (0, response_1.ok)(res, await reportes.movimientosPorPeriodo(desde, hasta));
});
router.get('/reportes/ventas-cliente', auth_1.requireAuth, (0, auth_1.requirePermission)('reportes.*'), async (req, res) => {
    const { desde, hasta } = req.query;
    if (!desde || !hasta)
        return (0, response_1.badRequest)(res, 'desde y hasta son requeridos');
    (0, response_1.ok)(res, await reportes.ventasPorCliente(desde, hasta));
});
router.get('/reportes/compras-proveedor', auth_1.requireAuth, (0, auth_1.requirePermission)('reportes.*'), async (req, res) => {
    const { desde, hasta } = req.query;
    if (!desde || !hasta)
        return (0, response_1.badRequest)(res, 'desde y hasta son requeridos');
    (0, response_1.ok)(res, await reportes.comprasPorProveedor(desde, hasta));
});
router.get('/reportes/nomina', auth_1.requireAuth, (0, auth_1.requirePermission)('reportes.*'), async (req, res) => {
    const periodo = req.query.periodo || new Date().toISOString().slice(0, 7);
    (0, response_1.ok)(res, await reportes.nominaPorPeriodo(periodo));
});
router.get('/reportes/financiero', auth_1.requireAuth, (0, auth_1.requirePermission)('finanzas.read'), async (req, res) => {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    (0, response_1.ok)(res, await reportes.financiero(anio));
});
router.get('/config', auth_1.requireAuth, (0, auth_1.requirePermission)('config.read'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, database_1.query)('SELECT clave, valor, descripcion FROM configuracion'));
});
router.put('/config', auth_1.requireAuth, (0, auth_1.requirePermission)('config.write'), (0, error_1.validateBody)(zod_1.z.object({ clave: zod_1.z.string(), valor: zod_1.z.string() })), async (req, res) => {
    await (0, database_1.execute)('UPDATE configuracion SET valor = ? WHERE clave = ?', [req.body.valor, req.body.clave]);
    (0, response_1.ok)(res, { updated: true });
});
exports.default = router;
