"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProveedorRepositoryImpl = void 0;
const database_1 = require("../../../config/database");
class ProveedorRepositoryImpl {
    async findAll() {
        const [rows] = await database_1.pool.query('SELECT * FROM proveedores ORDER BY nombre');
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
        const [rows] = await database_1.pool.query('SELECT * FROM proveedores WHERE id = ?', [id]);
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
        const [rows] = await database_1.pool.query('SELECT * FROM proveedores WHERE email = ?', [email]);
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
    async save(proveedor) {
        const [result] = await database_1.pool.query('INSERT INTO proveedores (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)', [proveedor.nombre, proveedor.email, proveedor.telefono, proveedor.direccion]);
        const inserted = await this.findById(result.insertId);
        if (!inserted)
            throw new Error('Error al crear proveedor');
        return inserted;
    }
    async update(id, proveedor) {
        const fields = [];
        const values = [];
        if (proveedor.nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(proveedor.nombre);
        }
        if (proveedor.email !== undefined) {
            fields.push('email = ?');
            values.push(proveedor.email);
        }
        if (proveedor.telefono !== undefined) {
            fields.push('telefono = ?');
            values.push(proveedor.telefono);
        }
        if (proveedor.direccion !== undefined) {
            fields.push('direccion = ?');
            values.push(proveedor.direccion);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        await database_1.pool.query(`UPDATE proveedores SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const [result] = await database_1.pool.query('DELETE FROM proveedores WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
exports.ProveedorRepositoryImpl = ProveedorRepositoryImpl;
