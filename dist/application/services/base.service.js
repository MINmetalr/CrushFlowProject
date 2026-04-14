"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolRepository = exports.UsuarioRepository = exports.CuentaRepository = exports.CargoRepository = exports.DepartamentoRepository = exports.ClienteRepository = exports.ProveedorRepository = exports.ConductorRepository = exports.MaterialRepository = exports.BaseRepository = void 0;
const database_1 = require("../../config/database");
const response_1 = require("../../utils/response");
class BaseRepository {
    table;
    pk;
    constructor(table, pk = 'id') {
        this.table = table;
        this.pk = pk;
    }
    async findAll(filters = {}, q) {
        const { page, limit, offset } = (0, response_1.parsePageParams)(q || {});
        const conditions = ['1=1'];
        const params = [];
        if (filters.activo !== undefined) {
            conditions.push('activo = ?');
            params.push(filters.activo);
        }
        if (filters.search && q?.search) {
            conditions.push('nombre LIKE ?');
            params.push(`%${q.search}%`);
        }
        const where = conditions.join(' AND ');
        const [total] = await (0, database_1.query)(`SELECT COUNT(*) AS n FROM ${this.table} WHERE ${where}`, params);
        const data = await (0, database_1.query)(`SELECT * FROM ${this.table} WHERE ${where} ORDER BY ${this.pk} DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        return { data, meta: (0, response_1.paginate)(page, limit, total.n) };
    }
    async findById(id) {
        return (0, database_1.queryOne)(`SELECT * FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
    }
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const ph = keys.map(() => '?').join(', ');
        const result = await (0, database_1.execute)(`INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${ph})`, values);
        return this.findById(result.insertId);
    }
    async update(id, data) {
        const entries = Object.entries(data);
        if (!entries.length)
            return this.findById(id);
        const sets = entries.map(([k]) => `${k} = ?`).join(', ');
        const values = [...entries.map(([, v]) => v), id];
        await (0, database_1.execute)(`UPDATE ${this.table} SET ${sets} WHERE ${this.pk} = ?`, values);
        return this.findById(id);
    }
    async softDelete(id) {
        await (0, database_1.execute)(`UPDATE ${this.table} SET activo = FALSE WHERE ${this.pk} = ?`, [id]);
    }
    async hardDelete(id) {
        await (0, database_1.execute)(`DELETE FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
    }
}
exports.BaseRepository = BaseRepository;
class MaterialRepository extends BaseRepository {
    constructor() { super('materiales'); }
}
exports.MaterialRepository = MaterialRepository;
class ConductorRepository extends BaseRepository {
    constructor() { super('conductores'); }
}
exports.ConductorRepository = ConductorRepository;
class ProveedorRepository extends BaseRepository {
    constructor() { super('proveedores'); }
}
exports.ProveedorRepository = ProveedorRepository;
class ClienteRepository extends BaseRepository {
    constructor() { super('clientes'); }
}
exports.ClienteRepository = ClienteRepository;
class DepartamentoRepository extends BaseRepository {
    constructor() { super('departamentos'); }
}
exports.DepartamentoRepository = DepartamentoRepository;
class CargoRepository extends BaseRepository {
    constructor() { super('cargos'); }
}
exports.CargoRepository = CargoRepository;
class CuentaRepository extends BaseRepository {
    constructor() { super('cuentas'); }
}
exports.CuentaRepository = CuentaRepository;
class UsuarioRepository extends BaseRepository {
    constructor() { super('usuarios'); }
    async findAll(_, q) {
        const { page, limit, offset } = (0, response_1.parsePageParams)(q || {});
        const search = q?.search ? `%${q.search}%` : null;
        const params = [];
        let where = 'u.activo = TRUE';
        if (search) {
            where += ' AND (u.nombre LIKE ? OR u.email LIKE ?)';
            params.push(search, search);
        }
        const [total] = await (0, database_1.query)(`SELECT COUNT(*) AS n FROM usuarios u WHERE ${where}`, params);
        const data = await (0, database_1.query)(`SELECT u.id, u.nombre, u.email, u.activo, u.ultimo_acceso, u.creado_en,
              r.nombre AS rol, d.nombre AS departamento
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
        return { data, meta: (0, response_1.paginate)(page, limit, total.n) };
    }
    async create(data) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(data.password, 10);
        const { password, ...rest } = data;
        return super.create({ ...rest, password_hash: hash });
    }
}
exports.UsuarioRepository = UsuarioRepository;
class RolRepository extends BaseRepository {
    constructor() { super('roles'); }
    async findAll(_, q) {
        return { data: await (0, database_1.query)('SELECT r.*, d.nombre AS departamento FROM roles r LEFT JOIN departamentos d ON d.id = r.departamento_id WHERE r.activo = TRUE'), meta: {} };
    }
}
exports.RolRepository = RolRepository;
