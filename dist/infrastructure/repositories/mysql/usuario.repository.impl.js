"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioRepositoryImpl = void 0;
const database_1 = require("../../../config/database");
class UsuarioRepositoryImpl {
    async findAll() {
        const [rows] = await database_1.pool.query('SELECT * FROM usuarios ORDER BY nombre');
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
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
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
    async findByEmail(email) {
        const [rows] = await database_1.pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0)
            return null;
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
    async save(usuario) {
        const [result] = await database_1.pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)', [usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol]);
        const inserted = await this.findById(result.insertId);
        if (!inserted)
            throw new Error('Error al crear usuario');
        return inserted;
    }
    async update(id, usuario) {
        const fields = [];
        const values = [];
        if (usuario.nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(usuario.nombre);
        }
        if (usuario.email !== undefined) {
            fields.push('email = ?');
            values.push(usuario.email);
        }
        if (usuario.passwordHash !== undefined) {
            fields.push('password_hash = ?');
            values.push(usuario.passwordHash);
        }
        if (usuario.rol !== undefined) {
            fields.push('rol = ?');
            values.push(usuario.rol);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        await database_1.pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const [result] = await database_1.pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
exports.UsuarioRepositoryImpl = UsuarioRepositoryImpl;
