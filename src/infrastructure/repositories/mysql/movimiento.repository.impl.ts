import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { MovimientoRepository, FiltrosMovimiento, InventarioItem, ReportePeriodo } from '../../../application/ports/repositorios/movimiento.repository';
import { Movimiento } from '../../../domain/entities/movimiento';

export class MovimientoRepositoryImpl implements MovimientoRepository {
  async findAll(filtros?: FiltrosMovimiento): Promise<Movimiento[]> {
    let query = 'SELECT m.*, mat.nombre as material_nombre FROM movimientos m JOIN materiales mat ON m.material_id = mat.id WHERE 1=1';
    const params: any[] = [];

    if (filtros?.fechaDesde) {
      query += ' AND m.fecha >= ?';
      params.push(filtros.fechaDesde);
    }
    if (filtros?.fechaHasta) {
      query += ' AND m.fecha <= ?';
      params.push(filtros.fechaHasta);
    }
    if (filtros?.materialId) {
      query += ' AND m.material_id = ?';
      params.push(filtros.materialId);
    }
    if (filtros?.tipo) {
      query += ' AND m.tipo = ?';
      params.push(filtros.tipo);
    }
    if (filtros?.conductorId) {
      query += ' AND m.conductor_id = ?';
      params.push(filtros.conductorId);
    }
    if (filtros?.clienteId) {
      query += ' AND m.cliente_id = ?';
      params.push(filtros.clienteId);
    }
    if (filtros?.proveedorId) {
      query += ' AND m.proveedor_id = ?';
      params.push(filtros.proveedorId);
    }

    query += ' ORDER BY m.fecha DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(row => this.mapToEntity(row));
  }

  async findById(id: number): Promise<Movimiento | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT m.*, mat.nombre as material_nombre FROM movimientos m JOIN materiales mat ON m.material_id = mat.id WHERE m.id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  async save(movimiento: Omit<Movimiento, 'id' | 'createdAt' | 'updatedAt'>): Promise<Movimiento> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO movimientos 
       (tipo, fecha, material_id, cantidad, unidad, conductor_id, cliente_id, proveedor_id, precio_unitario, total, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movimiento.tipo,
        movimiento.fecha,
        movimiento.materialId,
        movimiento.cantidad,
        movimiento.unidad,
        movimiento.conductorId,
        movimiento.clienteId,
        movimiento.proveedorId,
        movimiento.precioUnitario,
        movimiento.total,
        movimiento.observaciones,
      ]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear movimiento');
    return inserted;
  }

  async update(id: number, movimiento: Partial<Movimiento>): Promise<Movimiento | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (movimiento.tipo !== undefined) { fields.push('tipo = ?'); values.push(movimiento.tipo); }
    if (movimiento.fecha !== undefined) { fields.push('fecha = ?'); values.push(movimiento.fecha); }
    if (movimiento.materialId !== undefined) { fields.push('material_id = ?'); values.push(movimiento.materialId); }
    if (movimiento.cantidad !== undefined) { fields.push('cantidad = ?'); values.push(movimiento.cantidad); }
    if (movimiento.unidad !== undefined) { fields.push('unidad = ?'); values.push(movimiento.unidad); }
    if (movimiento.conductorId !== undefined) { fields.push('conductor_id = ?'); values.push(movimiento.conductorId); }
    if (movimiento.clienteId !== undefined) { fields.push('cliente_id = ?'); values.push(movimiento.clienteId); }
    if (movimiento.proveedorId !== undefined) { fields.push('proveedor_id = ?'); values.push(movimiento.proveedorId); }
    if (movimiento.precioUnitario !== undefined) { fields.push('precio_unitario = ?'); values.push(movimiento.precioUnitario); }
    if (movimiento.total !== undefined) { fields.push('total = ?'); values.push(movimiento.total); }
    if (movimiento.observaciones !== undefined) { fields.push('observaciones = ?'); values.push(movimiento.observaciones); }

    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE movimientos SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM movimientos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async getInventarioActual(): Promise<InventarioItem[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         m.id as materialId,
         m.nombre as material,
         m.unidad,
         COALESCE(SUM(CASE WHEN mov.tipo = 'entrada' THEN mov.cantidad ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN mov.tipo = 'salida' THEN mov.cantidad ELSE 0 END), 0) as cantidad
       FROM materiales m
       LEFT JOIN movimientos mov ON m.id = mov.material_id
       GROUP BY m.id, m.nombre, m.unidad
       HAVING cantidad != 0`
    );
    return rows as InventarioItem[];
  }

  async getReportePeriodo(fechaInicio: Date, fechaFin: Date): Promise<ReportePeriodo> {
    const movimientos = await this.findAll({ fechaDesde: fechaInicio, fechaHasta: fechaFin });

    const totalEntradas = movimientos
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const totalSalidas = movimientos
      .filter(m => m.tipo === 'salida')
      .reduce((sum, m) => sum + m.cantidad, 0);

    // Agrupar por material
    const porMaterialMap = new Map<number, { materialId: number; material: string; entradas: number; salidas: number }>();

    for (const mov of movimientos) {
      // Necesitamos el nombre del material, lo obtenemos del JOIN en findAll (ya debería venir)
      // Como en findAll hicimos JOIN, cada movimiento tendrá un campo extra 'material_nombre'
      const materialId = mov.materialId;
      const materialNombre = (mov as any).material_nombre || 'Desconocido';

      if (!porMaterialMap.has(materialId)) {
        porMaterialMap.set(materialId, {
          materialId,
          material: materialNombre,
          entradas: 0,
          salidas: 0,
        });
      }
      const item = porMaterialMap.get(materialId)!;
      if (mov.tipo === 'entrada') {
        item.entradas += mov.cantidad;
      } else {
        item.salidas += mov.cantidad;
      }
    }

    const porMaterial = Array.from(porMaterialMap.values()).map(item => ({
      ...item,
      saldo: item.entradas - item.salidas,
    }));

    return {
      fechaInicio,
      fechaFin,
      movimientos,
      totalEntradas,
      totalSalidas,
      porMaterial,
    };
  }

  // Método privado para mapear fila a entidad Movimiento
  private mapToEntity(row: RowDataPacket): Movimiento {
    return {
      id: row.id,
      tipo: row.tipo,
      fecha: row.fecha,
      materialId: row.material_id,
      cantidad: row.cantidad,
      unidad: row.unidad,
      conductorId: row.conductor_id,
      clienteId: row.cliente_id,
      proveedorId: row.proveedor_id,
      precioUnitario: row.precio_unitario,
      total: row.total,
      observaciones: row.observaciones,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as Movimiento;
  }
}