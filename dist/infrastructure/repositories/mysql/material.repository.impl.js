"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRepositoryImpl = void 0;
const database_1 = require("../../../config/database");
class MaterialRepositoryImpl {
    async findAll() {
        const [rows] = await database_1.pool.query('SELECT * FROM materiales ORDER BY nombre');
        return rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            unidad: row.unidad,
            descripcion: row.descripcion,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    }
    async findById(id) {
        const [rows] = await database_1.pool.query('SELECT * FROM materiales WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
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
    async save(material) {
        const [result] = await database_1.pool.query('INSERT INTO materiales (nombre, unidad, descripcion) VALUES (?, ?, ?)', [material.nombre, material.unidad, material.descripcion]);
        const inserted = await this.findById(result.insertId);
        if (!inserted)
            throw new Error('Error al crear material');
        return inserted;
    }
    async update(id, material) {
        const fields = [];
        const values = [];
        if (material.nombre !== undefined) {
            fields.push('nombre = ?');
            values.push(material.nombre);
        }
        if (material.unidad !== undefined) {
            fields.push('unidad = ?');
            values.push(material.unidad);
        }
        if (material.descripcion !== undefined) {
            fields.push('descripcion = ?');
            values.push(material.descripcion);
        }
        if (fields.length === 0)
            return this.findById(id);
        values.push(id);
        await database_1.pool.query(`UPDATE materiales SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    async delete(id) {
        const [result] = await database_1.pool.query('DELETE FROM materiales WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
exports.MaterialRepositoryImpl = MaterialRepositoryImpl;
