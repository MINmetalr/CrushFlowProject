import { z } from 'zod';
import { query, queryOne, execute, transaction } from '../../config/database';
import { parsePageParams, paginate } from '../../utils/response';

export const OrdenCompraSchema = z.object({
  proveedor_id:   z.number().int().positive(),
  fecha_orden:    z.string(),
  fecha_entrega:  z.string().optional(),
  notas:          z.string().optional(),
  detalles: z.array(z.object({
    material_id:     z.number().int().positive(),
    cantidad:        z.number().positive(),
    precio_unitario: z.number().positive(),
  })).min(1),
});

function nextNumero(prefix: string): string {
  const now = new Date();
  return `${prefix}-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${Date.now().toString().slice(-5)}`;
}

export class ComprasService {

  async createOrden(dto: z.infer<typeof OrdenCompraSchema>, userId: number) {
    return transaction(async (conn) => {
      const subtotal = dto.detalles.reduce((s, d) => s + d.cantidad * d.precio_unitario, 0);
      const impuestos = subtotal * 0.19;
      const total = subtotal + impuestos;

      const [res] = await conn.execute(
        `INSERT INTO ordenes_compra (numero, proveedor_id, fecha_orden, fecha_entrega, subtotal, impuestos, total, notas, creado_por)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextNumero('OC'), dto.proveedor_id, dto.fecha_orden, dto.fecha_entrega ?? null, subtotal, impuestos, total, dto.notas ?? null, userId]
      ) as any;

      const ordenId = res.insertId;
      for (const d of dto.detalles) {
        await conn.execute(
          `INSERT INTO detalles_orden_compra (orden_id, material_id, cantidad, precio_unitario)
           VALUES (?, ?, ?, ?)`,
          [ordenId, d.material_id, d.cantidad, d.precio_unitario]
        );
      }
      return this.findOrdenById(ordenId);
    });
  }

  async findOrdenById(id: number) {
    const orden = await queryOne<any>(
      `SELECT oc.*, p.nombre AS proveedor_nombre, u.nombre AS creado_por_nombre
       FROM ordenes_compra oc
       JOIN proveedores p ON p.id = oc.proveedor_id
       JOIN usuarios u ON u.id = oc.creado_por
       WHERE oc.id = ?`, [id]
    );
    if (!orden) return null;
    orden.detalles = await query<any>(
      `SELECT doc.*, m.nombre AS material_nombre, m.unidad
       FROM detalles_orden_compra doc
       JOIN materiales m ON m.id = doc.material_id
       WHERE doc.orden_id = ?`, [id]
    );
    return orden;
  }

  async findOrdenes(q: any = {}) {
    const { page, limit, offset } = parsePageParams(q);
    const cond: string[] = ['1=1'];
    const p: any[] = [];
    if (q.estado)       { cond.push('oc.estado = ?');       p.push(q.estado); }
    if (q.proveedor_id) { cond.push('oc.proveedor_id = ?'); p.push(q.proveedor_id); }
    if (q.desde)        { cond.push('oc.fecha_orden >= ?'); p.push(q.desde); }
    if (q.hasta)        { cond.push('oc.fecha_orden <= ?'); p.push(q.hasta); }
    const where = cond.join(' AND ');
    const [total] = await query<any>(`SELECT COUNT(*) AS n FROM ordenes_compra oc WHERE ${where}`, p);
    const data = await query<any>(
      `SELECT oc.*, p.nombre AS proveedor_nombre
       FROM ordenes_compra oc JOIN proveedores p ON p.id = oc.proveedor_id
       WHERE ${where} ORDER BY oc.creado_en DESC LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return { data, meta: paginate(page, limit, total.n) };
  }

  async updateEstado(id: number, estado: string, userId: number) {
    const orden = await queryOne<any>('SELECT * FROM ordenes_compra WHERE id = ?', [id]);
    if (!orden) throw { status: 404, message: 'Orden no encontrada' };
    const transitions: Record<string, string[]> = {
      borrador: ['enviada','cancelada'],
      enviada: ['confirmada','cancelada'],
      confirmada: ['parcial','recibida','cancelada'],
      parcial: ['recibida','cancelada'],
    };
    const allowed = transitions[orden.estado] ?? [];
    if (!allowed.includes(estado)) {
      throw { status: 400, message: `No se puede pasar de '${orden.estado}' a '${estado}'` };
    }
    if (estado === 'recibida') {
      await execute('UPDATE ordenes_compra SET aprobado_por = ? WHERE id = ?', [userId, id]);
    }
    await execute('UPDATE ordenes_compra SET estado = ? WHERE id = ?', [estado, id]);
    return this.findOrdenById(id);
  }
}
