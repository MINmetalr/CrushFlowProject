"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClienteRepositoryImpl = void 0;
const database_1 = require("../../../config/database");
class ClienteRepositoryImpl {
    async findAll() {
        const [rows] = await database_1.pool.query('SELECT * FROM clientes ORDER BY nombre');
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
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
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
    async findByEmail(email) {
        const [rows] = await database_1.pool.query('SELECT * FROM clientes WHERE email = ?', [email]);
        if (rows.length === 0)
            return null;
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
    async save(cliente) {
        const [result] = await database_1.pool.query('INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)', [cliente.nombre, cliente.email, cliente.telefono, cliente.direccion]);
        const inserted = await this.findById(result.insertId);
        if (!inserted)
            throw new Error('Error al crear cliente');
        return inserted;
    }
    async update(id, cliente) {
        const fields = [];
        const values = [];
        if (cliente.nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(cliente.nombre);
        }
        if (cliente.email !== undefined) {
            fields.push('email = ?');
            values.push(cliente.email);
        }
        if (cliente.telefono !== undefined) {
            fields.push('telefono = ?');
            values.push(cliente.telefono);
        }
        if (cliente.direccion !== undefined) {
            fields.push('direccion = ?');
            values.push(cliente.direccion);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        await database_1.pool.query(`UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const [result] = await database_1.pool.query('DELETE FROM clientes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
exports.ClienteRepositoryImpl = ClienteRepositoryImpl;
