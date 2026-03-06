import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { ProveedorRepository } from '../../../application/ports/repositorios/proveedor.repository';
import { Proveedor } from '../../../domain/entities/proveedor';

export class ProveedorRepositoryImpl implements ProveedorRepository {
  async findAll(): Promise<Proveedor[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM proveedores ORDER BY nombre');
    return rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      direccion: row.direccion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(id: number): Promise<Proveedor | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM proveedores WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      direccion: row.direccion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByEmail(email: string): Promise<Proveedor | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM proveedores WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      direccion: row.direccion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(proveedor: Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Proveedor> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO proveedores (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
      [proveedor.nombre, proveedor.email, proveedor.telefono, proveedor.direccion]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear proveedor');
    return inserted;
  }

  async update(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (proveedor.nombre !== undefined) { fields.push('nombre = ?'); values.push(proveedor.nombre); }
    if (proveedor.email !== undefined) { fields.push('email = ?'); values.push(proveedor.email); }
    if (proveedor.telefono !== undefined) { fields.push('telefono = ?'); values.push(proveedor.telefono); }
    if (proveedor.direccion !== undefined) { fields.push('direccion = ?'); values.push(proveedor.direccion); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE proveedores SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM proveedores WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}