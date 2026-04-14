import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth, requirePermission, generateTokens, buildAuthPayload } from '../middlewares/auth';
import { validateBody } from '../middlewares/error';
import { ok, created, notFound, badRequest, unauthorized, parsePageParams } from '../../utils/response';

import { AuthService } from '../../application/services/auth.service';
import {
  MaterialRepository, ConductorRepository, ProveedorRepository,
  ClienteRepository, UsuarioRepository, RolRepository,
  DepartamentoRepository, CargoRepository, CuentaRepository
} from '../../application/services/base.service';
import { MovimientoService, MovimientoSchema } from '../../application/services/inventario.service';
import { ComprasService, OrdenCompraSchema } from '../../application/services/compras.service';
import { VentasService, OrdenVentaSchema } from '../../application/services/ventas.service';
import { RrhhService } from '../../application/services/rrhh.service';
import { ReporteService } from '../../application/services/reportes.service';
import { execute, queryOne, query } from '../../config/database';

const router = Router();

// Singletons
const auth        = new AuthService();
const materiales  = new MaterialRepository();
const conductores = new ConductorRepository();
const proveedores = new ProveedorRepository();
const clientes    = new ClienteRepository();
const usuarios    = new UsuarioRepository();
const roles       = new RolRepository();
const departamentos = new DepartamentoRepository();
const cargos      = new CargoRepository();
const cuentas     = new CuentaRepository();
const inventario  = new MovimientoService();
const compras     = new ComprasService();
const ventas      = new VentasService();
const rrhh        = new RrhhService();
const reportes    = new ReporteService();

// ── Helper CRUD genérico ──────────────────────────────────────────────────────
function crudRoutes(prefix: string, repo: any, readPerm: string, writePerm: string) {
  const r = Router();
  r.get('/',     requireAuth, requirePermission(readPerm),  async (req, res) => { const result = await repo.findAll({}, req.query); ok(res, result.data, result.meta); });
  r.get('/:id',  requireAuth, requirePermission(readPerm),  async (req, res) => {
    const item = await repo.findById(+req.params.id);
    item ? ok(res, item) : notFound(res, prefix);
  });
  r.post('/',    requireAuth, requirePermission(writePerm), async (req, res) => created(res, await repo.create(req.body)));
  r.put('/:id',  requireAuth, requirePermission(writePerm), async (req, res) => {
    const item = await repo.update(+req.params.id, req.body);
    item ? ok(res, item) : notFound(res, prefix);
  });
  r.delete('/:id', requireAuth, requirePermission(writePerm), async (req, res) => {
    await repo.softDelete(+req.params.id);
    ok(res, { id: +req.params.id });
  });
  return r;
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
router.post('/auth/login', validateBody(z.object({
  email: z.string().email(), password: z.string().min(1)
})), async (req, res) => ok(res, await auth.login(req.body)));

router.post('/auth/refresh', async (req, res) => {
  const token = req.body.refreshToken;
  if (!token) return badRequest(res, 'refreshToken requerido');
  ok(res, await auth.refresh(token));
});

router.post('/auth/logout', requireAuth, async (req, res) => {
  await auth.logout(req.user!.userId);
  ok(res, { message: 'Sesión cerrada' });
});

router.put('/auth/password', requireAuth, validateBody(z.object({
  currentPassword: z.string(), newPassword: z.string().min(8)
})), async (req, res) => {
  await auth.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  ok(res, { message: 'Contraseña actualizada' });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await queryOne<any>(
    `SELECT u.id, u.nombre, u.email, u.departamento_id, u.activo, u.ultimo_acceso,
            r.nombre AS rol, r.permisos, d.nombre AS departamento
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     LEFT JOIN departamentos d ON d.id = u.departamento_id
     WHERE u.id = ?`, [req.user!.userId]
  );
  ok(res, user);
});

// ── CATÁLOGOS ─────────────────────────────────────────────────────────────────
router.use('/materiales',     crudRoutes('Material',     materiales,     'catalogos.read', 'catalogos.write'));
router.use('/conductores',    crudRoutes('Conductor',    conductores,    'catalogos.read', 'catalogos.write'));
router.use('/proveedores',    crudRoutes('Proveedor',    proveedores,    'proveedores.read', 'proveedores.write'));
router.use('/clientes',       crudRoutes('Cliente',      clientes,       'clientes.read',  'clientes.write'));
router.use('/departamentos',  crudRoutes('Departamento', departamentos,  'usuarios.read',  'usuarios.write'));
router.use('/cargos',         crudRoutes('Cargo',        cargos,         'rrhh.read',      'rrhh.write'));
router.use('/cuentas',        crudRoutes('Cuenta',       cuentas,        'finanzas.read',  'finanzas.write'));
router.use('/roles',          crudRoutes('Rol',          roles,          'usuarios.read',  'usuarios.write'));

// ── USUARIOS ──────────────────────────────────────────────────────────────────
router.get('/usuarios', requireAuth, requirePermission('usuarios.read'), async (req, res) => {
  const result = await usuarios.findAll({}, req.query);
  ok(res, result.data, result.meta);
});
router.get('/usuarios/:id', requireAuth, requirePermission('usuarios.read'), async (req, res) => {
  const u = await usuarios.findById(+req.params.id);
  u ? ok(res, u) : notFound(res, 'Usuario');
});
router.post('/usuarios', requireAuth, requirePermission('usuarios.write'), validateBody(z.object({
  nombre: z.string().min(2), email: z.string().email(), password: z.string().min(8),
  rol_id: z.number().int().positive(), departamento_id: z.number().int().positive().optional(),
})), async (req, res) => created(res, await usuarios.create(req.body)));
router.put('/usuarios/:id', requireAuth, requirePermission('usuarios.write'), async (req, res) => {
  const { password, ...data } = req.body;
  if (password) {
    data.password_hash = await bcrypt.hash(password, 10);
  }
  const u = await usuarios.update(+req.params.id, data);
  u ? ok(res, u) : notFound(res, 'Usuario');
});
router.delete('/usuarios/:id', requireAuth, requirePermission('usuarios.write'), async (req, res) => {
  if (req.params.id === String(req.user!.userId)) {
    return badRequest(res, 'No puedes desactivar tu propia cuenta');
  }
  await usuarios.softDelete(+req.params.id);
  ok(res, { id: +req.params.id });
});

// ── INVENTARIO / MOVIMIENTOS ──────────────────────────────────────────────────
router.get('/inventario/stock', requireAuth, requirePermission('inventario.read'), async (_req, res) =>
  ok(res, await inventario.getStock())
);
router.get('/movimientos', requireAuth, requirePermission('inventario.read'), async (req, res) => {
  const result = await inventario.findAll(req.query);
  ok(res, result.data, result.meta);
});
router.get('/movimientos/:id', requireAuth, requirePermission('inventario.read'), async (req, res) => {
  const m = await inventario.findById(+req.params.id);
  m ? ok(res, m) : notFound(res, 'Movimiento');
});
router.post('/movimientos', requireAuth, requirePermission('movimientos.create'),
  validateBody(MovimientoSchema), async (req, res) =>
    created(res, await inventario.create(req.body, req.user!.userId))
);

// ── COMPRAS ───────────────────────────────────────────────────────────────────
router.get('/compras/ordenes', requireAuth, requirePermission('compras.read'), async (req, res) => {
  const result = await compras.findOrdenes(req.query);
  ok(res, result.data, result.meta);
});
router.get('/compras/ordenes/:id', requireAuth, requirePermission('compras.read'), async (req, res) => {
  const o = await compras.findOrdenById(+req.params.id);
  o ? ok(res, o) : notFound(res, 'Orden de compra');
});
router.post('/compras/ordenes', requireAuth, requirePermission('compras.write'),
  validateBody(OrdenCompraSchema), async (req, res) =>
    created(res, await compras.createOrden(req.body, req.user!.userId))
);
router.patch('/compras/ordenes/:id/estado', requireAuth, requirePermission('compras.write'),
  validateBody(z.object({ estado: z.string() })), async (req, res) =>
    ok(res, await compras.updateEstado(+req.params.id, req.body.estado, req.user!.userId))
);

// ── VENTAS ────────────────────────────────────────────────────────────────────
router.get('/ventas/ordenes', requireAuth, requirePermission('ventas.read'), async (req, res) => {
  const result = await ventas.findOrdenes(req.query);
  ok(res, result.data, result.meta);
});
router.get('/ventas/ordenes/:id', requireAuth, requirePermission('ventas.read'), async (req, res) => {
  const o = await ventas.findOrdenById(+req.params.id);
  o ? ok(res, o) : notFound(res, 'Orden de venta');
});
router.post('/ventas/ordenes', requireAuth, requirePermission('ventas.write'),
  validateBody(OrdenVentaSchema), async (req, res) =>
    created(res, await ventas.createOrden(req.body, req.user!.userId))
);
router.patch('/ventas/ordenes/:id/estado', requireAuth, requirePermission('ventas.write'),
  validateBody(z.object({ estado: z.string() })), async (req, res) =>
    ok(res, await ventas.updateEstado(+req.params.id, req.body.estado))
);

// ── RRHH ──────────────────────────────────────────────────────────────────────
router.get('/rrhh/empleados', requireAuth, requirePermission('rrhh.read'), async (req, res) => {
  const result = await rrhh.findEmpleados(req.query);
  ok(res, result.data, result.meta);
});
router.get('/rrhh/empleados/:id', requireAuth, requirePermission('rrhh.read'), async (req, res) => {
  const e = await rrhh.findEmpleadoById(+req.params.id);
  e ? ok(res, e) : notFound(res, 'Empleado');
});
router.post('/rrhh/empleados', requireAuth, requirePermission('rrhh.write'), async (req, res) =>
  created(res, await rrhh.createEmpleado(req.body))
);
router.put('/rrhh/empleados/:id', requireAuth, requirePermission('rrhh.write'), async (req, res) =>
  ok(res, await rrhh.updateEmpleado(+req.params.id, req.body))
);
router.get('/rrhh/nomina', requireAuth, requirePermission('nomina.read'), async (req, res) => {
  const result = await rrhh.findNomina(req.query);
  ok(res, result.data, result.meta);
});
router.post('/rrhh/nomina', requireAuth, requirePermission('nomina.write'), async (req, res) =>
  created(res, await rrhh.createNomina(req.body, req.user!.userId))
);

// ── FINANZAS ──────────────────────────────────────────────────────────────────
router.get('/finanzas/transacciones', requireAuth, requirePermission('finanzas.read'), async (req, res) => {
  const { page, limit, offset } = parsePageParams(req.query);
  const data = await (query as Function)(
    `SELECT t.*, c.nombre AS cuenta_nombre FROM transacciones t
     JOIN cuentas c ON c.id = t.cuenta_id ORDER BY t.fecha DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  ok(res, data);
});
router.post('/finanzas/transacciones', requireAuth, requirePermission('finanzas.write'),
  validateBody(z.object({
    tipo: z.enum(['ingreso','egreso','traslado']),
    cuenta_id: z.number().int().positive(),
    fecha: z.string(),
    monto: z.number().positive(),
    descripcion: z.string().min(3),
    referencia: z.string().optional(),
    entidad: z.string().optional(),
  })), async (req, res) => {
    const numero = `TRX-${Date.now()}`;
    const result = await execute(
      `INSERT INTO transacciones (numero, tipo, cuenta_id, fecha, monto, descripcion, referencia, entidad, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, req.body.tipo, req.body.cuenta_id, req.body.fecha, req.body.monto,
       req.body.descripcion, req.body.referencia ?? null, req.body.entidad ?? null, req.user!.userId]
    );
    created(res, await queryOne('SELECT * FROM transacciones WHERE id = ?', [result.insertId]));
  }
);

// ── REPORTES ─────────────────────────────────────────────────────────────────
router.get('/reportes/dashboard', requireAuth, async (_req, res) =>
  ok(res, await reportes.dashboard())
);
router.get('/reportes/inventario', requireAuth, requirePermission('reportes.*'), async (req, res) =>
  ok(res, await reportes.inventario(req.query))
);
router.get('/reportes/movimientos', requireAuth, requirePermission('reportes.*'), async (req, res) => {
  const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10), hasta = new Date().toISOString().slice(0,10) } = req.query as any;
  ok(res, await reportes.movimientosPorPeriodo(desde, hasta));
});
router.get('/reportes/ventas-cliente', requireAuth, requirePermission('reportes.*'), async (req, res) => {
  const { desde, hasta } = req.query as any;
  if (!desde || !hasta) return badRequest(res, 'desde y hasta son requeridos');
  ok(res, await reportes.ventasPorCliente(desde, hasta));
});
router.get('/reportes/compras-proveedor', requireAuth, requirePermission('reportes.*'), async (req, res) => {
  const { desde, hasta } = req.query as any;
  if (!desde || !hasta) return badRequest(res, 'desde y hasta son requeridos');
  ok(res, await reportes.comprasPorProveedor(desde, hasta));
});
router.get('/reportes/nomina', requireAuth, requirePermission('reportes.*'), async (req, res) => {
  const periodo = (req.query.periodo as string) || new Date().toISOString().slice(0,7);
  ok(res, await reportes.nominaPorPeriodo(periodo));
});
router.get('/reportes/financiero', requireAuth, requirePermission('finanzas.read'), async (req, res) => {
  const anio = parseInt(req.query.anio as string) || new Date().getFullYear();
  ok(res, await reportes.financiero(anio));
});

// ── CONFIG ────────────────────────────────────────────────────────────────────
router.get('/config', requireAuth, requirePermission('config.read'), async (_req, res) => {
  ok(res, await query('SELECT clave, valor, descripcion FROM configuracion'));
});
router.put('/config', requireAuth, requirePermission('config.write'),
  validateBody(z.object({ clave: z.string(), valor: z.string() })),
  async (req, res) => {
    await execute(
      'UPDATE configuracion SET valor = ? WHERE clave = ?',
      [req.body.valor, req.body.clave]
    );
    ok(res, { updated: true });
  }
);

export default router;
