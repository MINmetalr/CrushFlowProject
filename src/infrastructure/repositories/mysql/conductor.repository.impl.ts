import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { ConductorRepository } from '../../../application/ports/repositorios/conductor.repository';
import { Conductor } from '../../../domain/entities/conductor';

export class ConductorRepositoryImpl implements ConductorRepository {
  async findAll(): Promise<Conductor[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM conductores ORDER BY nombre');
    return rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      licencia: row.licencia,
      telefono: row.telefono,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(id: number): Promise<Conductor | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM conductores WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      licencia: row.licencia,
      telefono: row.telefono,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByLicencia(licencia: string): Promise<Conductor | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM conductores WHERE licencia = ?', [licencia]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      licencia: row.licencia,
      telefono: row.telefono,
      email: row.email,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(conductor: Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conductor> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO conductores (nombre, licencia, telefono, email) VALUES (?, ?, ?, ?)',
      [conductor.nombre, conductor.licencia, conductor.telefono, conductor.email]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear conductor');
    return inserted;
  }

  async update(id: number, conductor: Partial<Conductor>): Promise<Conductor | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (conductor.nombre !== undefined) { fields.push('nombre = ?'); values.push(conductor.nombre); }
    if (conductor.licencia !== undefined) { fields.push('licencia = ?'); values.push(conductor.licencia); }
    if (conductor.telefono !== undefined) { fields.push('telefono = ?'); values.push(conductor.telefono); }
    if (conductor.email !== undefined) { fields.push('email = ?'); values.push(conductor.email); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE conductores SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM conductores WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}