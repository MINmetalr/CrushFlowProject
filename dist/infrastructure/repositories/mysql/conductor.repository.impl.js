"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConductorRepositoryImpl = void 0;
const database_1 = require("../../../config/database");
class ConductorRepositoryImpl {
    async findAll() {
        const [rows] = await database_1.pool.query('SELECT * FROM conductores ORDER BY nombre');
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
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM conductores WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
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
    async findByLicencia(licencia) {
        const [rows] = await database_1.pool.query('SELECT * FROM conductores WHERE licencia = ?', [licencia]);
        if (rows.length === 0)
            return null;
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
    async save(conductor) {
        const [result] = await database_1.pool.query('INSERT INTO conductores (nombre, licencia, telefono, email) VALUES (?, ?, ?, ?)', [conductor.nombre, conductor.licencia, conductor.telefono, conductor.email]);
        const inserted = await this.findById(result.insertId);
        if (!inserted)
            throw new Error('Error al crear conductor');
        return inserted;
    }
    async update(id, conductor) {
        const fields = [];
        const values = [];
        if (conductor.nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(conductor.nombre);
        }
        if (conductor.licencia !== undefined) {
            fields.push('licencia = ?');
            values.push(conductor.licencia);
        }
        if (conductor.telefono !== undefined) {
            fields.push('telefono = ?');
            values.push(conductor.telefono);
        }
        if (conductor.email !== undefined) {
            fields.push('email = ?');
            values.push(conductor.email);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        await database_1.pool.query(`UPDATE conductores SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const [result] = await database_1.pool.query('DELETE FROM conductores WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
exports.ConductorRepositoryImpl = ConductorRepositoryImpl;
