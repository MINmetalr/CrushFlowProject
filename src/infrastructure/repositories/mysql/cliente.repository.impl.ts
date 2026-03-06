import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { ClienteRepository } from '../../../application/ports/repositorios/cliente.repository';
import { Cliente } from '../../../domain/entities/cliente';

export class ClienteRepositoryImpl implements ClienteRepository {
  async findAll(): Promise<Cliente[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM clientes ORDER BY nombre');
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

  async findById(id: number): Promise<Cliente | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM clientes WHERE id = ?', [id]);
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

  async findByEmail(email: string): Promise<Cliente | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM clientes WHERE email = ?', [email]);
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

  async save(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
      [cliente.nombre, cliente.email, cliente.telefono, cliente.direccion]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear cliente');
    return inserted;
  }

  async update(id: number, cliente: Partial<Cliente>): Promise<Cliente | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (cliente.nombre !== undefined) { fields.push('nombre = ?'); values.push(cliente.nombre); }
    if (cliente.email !== undefined) { fields.push('email = ?'); values.push(cliente.email); }
    if (cliente.telefono !== undefined) { fields.push('telefono = ?'); values.push(cliente.telefono); }
    if (cliente.direccion !== undefined) { fields.push('direccion = ?'); values.push(cliente.direccion); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM clientes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}