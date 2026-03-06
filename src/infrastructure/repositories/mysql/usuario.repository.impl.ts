import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../../config/database';
import { UsuarioRepository } from '../../../application/ports/repositorios/usuario.repository';
import { Usuario } from '../../../domain/entities/usuario';

export class UsuarioRepositoryImpl implements UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM usuarios ORDER BY nombre');
    return rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
      rol: row.rol,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findById(id: number): Promise<Usuario | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
      rol: row.rol,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
      rol: row.rol,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Usuario> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
      [usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol]
    );
    const inserted = await this.findById(result.insertId);
    if (!inserted) throw new Error('Error al crear usuario');
    return inserted;
  }

  async update(id: number, usuario: Partial<Usuario>): Promise<Usuario | null> {
    const fields: string[] = [];
    const values: any[] = [];
    if (usuario.nombre !== undefined) { fields.push('nombre = ?'); values.push(usuario.nombre); }
    if (usuario.email !== undefined) { fields.push('email = ?'); values.push(usuario.email); }
    if (usuario.passwordHash !== undefined) { fields.push('password_hash = ?'); values.push(usuario.passwordHash); }
    if (usuario.rol !== undefined) { fields.push('rol = ?'); values.push(usuario.rol); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}