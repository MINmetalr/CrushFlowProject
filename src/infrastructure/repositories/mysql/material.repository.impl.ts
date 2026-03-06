import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { MaterialRepository } from '../../../application/ports/repositorios/material.repository';
import { Material } from '../../../domain/entities/material';

export class MaterialRepositoryImpl implements MaterialRepository {
  async findAll(): Promise<Material[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM materiales ORDER BY nombre');
    return rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      unidad: row.unidad,
      descripcion: row.descripcion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(id: number): Promise<Material | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM materiales WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      unidad: row.unidad,
      descripcion: row.descripcion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO materiales (nombre, unidad, descripcion) VALUES (?, ?, ?)',
      [material.nombre, material.unidad, material.descripcion]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear material');
    return inserted;
  }

  async update(id: number, material: Partial<Material>): Promise<Material | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (material.nombre !== undefined) { fields.push('nombre = ?'); values.push(material.nombre); }
    if (material.unidad !== undefined) { fields.push('unidad = ?'); values.push(material.unidad); }
    if (material.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(material.descripcion); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE materiales SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM materiales WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}