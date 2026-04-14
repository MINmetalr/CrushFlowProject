"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VentasService = exports.OrdenVentaSchema = void 0;
const zod_1 = require("zod");
const database_1 = require("../../config/database");
const response_1 = require("../../utils/response");
exports.OrdenVentaSchema = zod_1.z.object({
    cliente_id: zod_1.z.number().int().positive(),
    fecha_orden: zod_1.z.string(),
    fecha_entrega: zod_1.z.string().optional(),
    conductor_id: zod_1.z.number().int().positive().optional(),
    notas: zod_1.z.string().optional(),
    detalles: zod_1.z.array(zod_1.z.object({
        material_id: zod_1.z.number().int().positive(),
        cantidad: zod_1.z.number().positive(),
        precio_unitario: zod_1.z.number().positive(),
        descuento_pct: zod_1.z.number().min(0).max(100).optional().default(0),
    })).min(1),
});
function nextNumero(prefix) {
    const now = new Date();
    return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
}
class VentasService {
    async createOrden(dto, userId) {
        return (0, database_1.transaction)(async (conn) => {
            const subtotal = dto.detalles.reduce((s, d) => s + d.cantidad * d.precio_unitario * (1 - (d.descuento_pct ?? 0) / 100), 0);
            const impuestos = subtotal * 0.19;
            const total = subtotal + impuestos;
            const [res] = await conn.execute(`INSERT INTO ordenes_venta (numero, cliente_id, fecha_orden, fecha_entrega, conductor_id, subtotal, impuestos, total, notas, creado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nextNumero('OV'), dto.cliente_id, dto.fecha_orden, dto.fecha_entrega ?? null,
                dto.conductor_id ?? null, subtotal, impuestos, total, dto.notas ?? null, userId]);
            const ordenId = res.insertId;
            for (const d of dto.detalles) {
                await conn.execute(`INSERT INTO detalles_orden_venta (orden_id, material_id, cantidad, precio_unitario, descuento_pct)
           VALUES (?, ?, ?, ?, ?)`, [ordenId, d.material_id, d.cantidad, d.precio_unitario, d.descuento_pct ?? 0]);
            }
            return this.findOrdenById(ordenId);
        });
    }
    async findOrdenById(id) {
        const orden = await (0, database_1.queryOne)(`SELECT ov.*, cl.nombre AS cliente_nombre, c.nombre AS conductor_nombre, u.nombre AS creado_por_nombre
       FROM ordenes_venta ov
       JOIN clientes cl ON cl.id = ov.cliente_id
       LEFT JOIN conductores c ON c.id = ov.conductor_id
       JOIN usuarios u ON u.id = ov.creado_por
       WHERE ov.id = ?`, [id]);
        if (!orden)
            return null;
        orden.detalles = await (0, database_1.query)(`SELECT dov.*, m.nombre AS material_nombre, m.unidad
       FROM detalles_orden_venta dov JOIN materiales m ON m.id = dov.material_id
       WHERE dov.orden_id = ?`, [id]);
        return orden;
    }
    async findOrdenes(q = {}) {
        const { page, limit, offset } = (0, response_1.parsePageParams)(q);
        const cond = ['1=1'];
        const p = [];
        if (q.estado) {
            cond.push('ov.estado = ?');
            p.push(q.estado);
        }
        if (q.cliente_id) {
            cond.push('ov.cliente_id = ?');
            p.push(q.cliente_id);
        }
        if (q.desde) {
            cond.push('ov.fecha_orden >= ?');
            p.push(q.desde);
        }
        if (q.hasta) {
            cond.push('ov.fecha_orden <= ?');
            p.push(q.hasta);
        }
        const where = cond.join(' AND ');
        const [total] = await (0, database_1.query)(`SELECT COUNT(*) AS n FROM ordenes_venta ov WHERE ${where}`, p);
        const data = await (0, database_1.query)(`SELECT ov.*, cl.nombre AS cliente_nombre
       FROM ordenes_venta ov JOIN clientes cl ON cl.id = ov.cliente_id
       WHERE ${where} ORDER BY ov.creado_en DESC LIMIT ? OFFSET ?`, [...p, limit, offset]);
        return { data, meta: (0, response_1.paginate)(page, limit, total.n) };
    }
    async updateEstado(id, estado) {
        const transitions = {
            borrador: ['confirmada', 'cancelada'],
            confirmada: ['en_proceso', 'cancelada'],
            en_proceso: ['despachada'],
            despachada: ['facturada'],
        };
        const orden = await (0, database_1.queryOne)('SELECT * FROM ordenes_venta WHERE id = ?', [id]);
        if (!orden)
            throw { status: 404, message: 'Orden no encontrada' };
        if (!(transitions[orden.estado] ?? []).includes(estado)) {
            throw { status: 400, message: `Transición inválida: '${orden.estado}' → '${estado}'` };
        }
        await (0, database_1.execute)('UPDATE ordenes_venta SET estado = ? WHERE id = ?', [estado, id]);
        return this.findOrdenById(id);
    }
}
exports.VentasService = VentasService;
