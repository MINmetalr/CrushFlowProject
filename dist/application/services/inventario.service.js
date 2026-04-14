"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimientoService = exports.MovimientoSchema = void 0;
const zod_1 = require("zod");
const database_1 = require("../../config/database");
const response_1 = require("../../utils/response");
exports.MovimientoSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['entrada', 'salida', 'traslado', 'ajuste']),
    fecha: zod_1.z.string().datetime().optional(),
    material_id: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
    conductor_id: zod_1.z.number().int().positive().optional(),
    cliente_id: zod_1.z.number().int().positive().optional(),
    proveedor_id: zod_1.z.number().int().positive().optional(),
    orden_venta_id: zod_1.z.number().int().positive().optional(),
    orden_compra_id: zod_1.z.number().int().positive().optional(),
    precio_unitario: zod_1.z.number().nonnegative().optional(),
    placa_vehiculo: zod_1.z.string().max(20).optional(),
    guia_despacho: zod_1.z.string().max(50).optional(),
    observaciones: zod_1.z.string().max(1000).optional(),
});
class MovimientoService {
    async create(dto, userId) {
        const material = await (0, database_1.queryOne)('SELECT * FROM materiales WHERE id = ? AND activo = TRUE', [dto.material_id]);
        if (!material)
            throw { status: 404, message: 'Material no encontrado' };
        if (dto.tipo === 'salida') {
            const [stock] = await (0, database_1.query)(`SELECT COALESCE(SUM(CASE WHEN tipo='entrada' THEN cantidad WHEN tipo='salida' THEN -cantidad ELSE cantidad END),0) AS disponible
         FROM movimientos WHERE material_id = ?`, [dto.material_id]);
            if ((stock?.disponible ?? 0) < dto.cantidad) {
                throw { status: 400, message: `Stock insuficiente. Disponible: ${stock?.disponible ?? 0} ${material.unidad}` };
            }
        }
        const total = dto.precio_unitario ? dto.cantidad * dto.precio_unitario : null;
        const result = await (0, database_1.execute)(`INSERT INTO movimientos
        (tipo, fecha, material_id, cantidad, unidad, conductor_id, cliente_id, proveedor_id,
         orden_venta_id, orden_compra_id, precio_unitario, total, placa_vehiculo, guia_despacho, observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            dto.tipo, dto.fecha ?? new Date(), dto.material_id, dto.cantidad, material.unidad,
            dto.conductor_id ?? null, dto.cliente_id ?? null, dto.proveedor_id ?? null,
            dto.orden_venta_id ?? null, dto.orden_compra_id ?? null,
            dto.precio_unitario ?? null, total, dto.placa_vehiculo ?? null,
            dto.guia_despacho ?? null, dto.observaciones ?? null, userId,
        ]);
        return this.findById(result.insertId);
    }
    async findById(id) {
        return (0, database_1.queryOne)(`SELECT m.*,
              mat.nombre AS material_nombre, mat.unidad,
              c.nombre AS conductor_nombre,
              cl.nombre AS cliente_nombre,
              p.nombre AS proveedor_nombre,
              u.nombre AS creado_por_nombre
       FROM movimientos m
       JOIN materiales mat ON mat.id = m.material_id
       LEFT JOIN conductores c ON c.id = m.conductor_id
       LEFT JOIN clientes cl ON cl.id = m.cliente_id
       LEFT JOIN proveedores p ON p.id = m.proveedor_id
       LEFT JOIN usuarios u ON u.id = m.creado_por
       WHERE m.id = ?`, [id]);
    }
    async findAll(q = {}) {
        const { page, limit, offset } = (0, response_1.parsePageParams)(q);
        const conditions = ['1=1'];
        const params = [];
        if (q.tipo) {
            conditions.push('m.tipo = ?');
            params.push(q.tipo);
        }
        if (q.material_id) {
            conditions.push('m.material_id = ?');
            params.push(q.material_id);
        }
        if (q.desde) {
            conditions.push('m.fecha >= ?');
            params.push(q.desde);
        }
        if (q.hasta) {
            conditions.push('m.fecha <= ?');
            params.push(q.hasta + ' 23:59:59');
        }
        const where = conditions.join(' AND ');
        const [total] = await (0, database_1.query)(`SELECT COUNT(*) AS n FROM movimientos m WHERE ${where}`, params);
        const data = await (0, database_1.query)(`SELECT m.*, mat.nombre AS material_nombre, mat.unidad,
              c.nombre AS conductor_nombre, cl.nombre AS cliente_nombre,
              p.nombre AS proveedor_nombre, u.nombre AS creado_por_nombre
       FROM movimientos m
       JOIN materiales mat ON mat.id = m.material_id
       LEFT JOIN conductores c ON c.id = m.conductor_id
       LEFT JOIN clientes cl ON cl.id = m.cliente_id
       LEFT JOIN proveedores p ON p.id = m.proveedor_id
       LEFT JOIN usuarios u ON u.id = m.creado_por
       WHERE ${where} ORDER BY m.fecha DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        return { data, meta: (0, response_1.paginate)(page, limit, total.n) };
    }
    async getStock() {
        return (0, database_1.query)('SELECT * FROM stock_actual ORDER BY nombre');
    }
    async getStockById(materialId) {
        return (0, database_1.queryOne)('SELECT * FROM stock_actual WHERE id = ?', [materialId]);
    }
}
exports.MovimientoService = MovimientoService;
