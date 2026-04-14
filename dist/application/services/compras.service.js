"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprasService = exports.OrdenCompraSchema = void 0;
const zod_1 = require("zod");
const database_1 = require("../../config/database");
const response_1 = require("../../utils/response");
exports.OrdenCompraSchema = zod_1.z.object({
    proveedor_id: zod_1.z.number().int().positive(),
    fecha_orden: zod_1.z.string(),
    fecha_entrega: zod_1.z.string().optional(),
    notas: zod_1.z.string().optional(),
    detalles: zod_1.z.array(zod_1.z.object({
        material_id: zod_1.z.number().int().positive(),
        cantidad: zod_1.z.number().positive(),
        precio_unitario: zod_1.z.number().positive(),
    })).min(1),
});
function nextNumero(prefix) {
    const now = new Date();
    return `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
}
class ComprasService {
    async createOrden(dto, userId) {
        return (0, database_1.transaction)(async (conn) => {
            const subtotal = dto.detalles.reduce((s, d) => s + d.cantidad * d.precio_unitario, 0);
            const impuestos = subtotal * 0.19;
            const total = subtotal + impuestos;
            const [res] = await conn.execute(`INSERT INTO ordenes_compra (numero, proveedor_id, fecha_orden, fecha_entrega, subtotal, impuestos, total, notas, creado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [nextNumero('OC'), dto.proveedor_id, dto.fecha_orden, dto.fecha_entrega ?? null, subtotal, impuestos, total, dto.notas ?? null, userId]);
            const ordenId = res.insertId;
            for (const d of dto.detalles) {
                await conn.execute(`INSERT INTO detalles_orden_compra (orden_id, material_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`, [ordenId, d.material_id, d.cantidad, d.precio_unitario]);
            }
            return this.findOrdenById(ordenId);
        });
    }
    async findOrdenById(id) {
        const orden = await (0, database_1.queryOne)(`SELECT oc.*, p.nombre AS proveedor_nombre, u.nombre AS creado_por_nombre
       FROM ordenes_compra oc
       JOIN proveedores p ON p.id = oc.proveedor_id
       JOIN usuarios u ON u.id = oc.creado_por
       WHERE oc.id = ?`, [id]);
        if (!orden)
            return null;
        orden.detalles = await (0, database_1.query)(`SELECT doc.*, m.nombre AS material_nombre, m.unidad
       FROM detalles_orden_compra doc
       JOIN materiales m ON m.id = doc.material_id
       WHERE doc.orden_id = ?`, [id]);
        return orden;
    }
    async findOrdenes(q = {}) {
        const { page, limit, offset } = (0, response_1.parsePageParams)(q);
        const cond = ['1=1'];
        const p = [];
        if (q.estado) {
            cond.push('oc.estado = ?');
            p.push(q.estado);
        }
        if (q.proveedor_id) {
            cond.push('oc.proveedor_id = ?');
            p.push(q.proveedor_id);
        }
        if (q.desde) {
            cond.push('oc.fecha_orden >= ?');
            p.push(q.desde);
        }
        if (q.hasta) {
            cond.push('oc.fecha_orden <= ?');
            p.push(q.hasta);
        }
        const where = cond.join(' AND ');
        const [total] = await (0, database_1.query)(`SELECT COUNT(*) AS n FROM ordenes_compra oc WHERE ${where}`, p);
        const data = await (0, database_1.query)(`SELECT oc.*, p.nombre AS proveedor_nombre
       FROM ordenes_compra oc JOIN proveedores p ON p.id = oc.proveedor_id
       WHERE ${where} ORDER BY oc.creado_en DESC LIMIT ? OFFSET ?`, [...p, limit, offset]);
        return { data, meta: (0, response_1.paginate)(page, limit, total.n) };
    }
    async updateEstado(id, estado, userId) {
        const orden = await (0, database_1.queryOne)('SELECT * FROM ordenes_compra WHERE id = ?', [id]);
        if (!orden)
            throw { status: 404, message: 'Orden no encontrada' };
        const transitions = {
            borrador: ['enviada', 'cancelada'],
            enviada: ['confirmada', 'cancelada'],
            confirmada: ['parcial', 'recibida', 'cancelada'],
            parcial: ['recibida', 'cancelada'],
        };
        const allowed = transitions[orden.estado] ?? [];
        if (!allowed.includes(estado)) {
            throw { status: 400, message: `No se puede pasar de '${orden.estado}' a '${estado}'` };
        }
        if (estado === 'recibida') {
            await (0, database_1.execute)('UPDATE ordenes_compra SET aprobado_por = ? WHERE id = ?', [userId, id]);
        }
        await (0, database_1.execute)('UPDATE ordenes_compra SET estado = ? WHERE id = ?', [estado, id]);
        return this.findOrdenById(id);
    }
}
exports.ComprasService = ComprasService;
