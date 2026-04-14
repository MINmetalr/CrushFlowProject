import { query, queryOne, execute } from '../../config/database';
import { parsePageParams, paginate } from '../../utils/response';

// ─── Base de repositorio genérico ─────────────────────────────────────────────
export class BaseRepository<T> {
  constructor(protected table: string, protected pk = 'id') {}

  async findAll(filters: Record<string, any> = {}, q?: any): Promise<{ data: T[]; meta: any }> {
    const { page, limit, offset } = parsePageParams(q || {});
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.activo !== undefined) {
      conditions.push('activo = ?');
      params.push(filters.activo);
    }
    if (filters.search && q?.search) {
      conditions.push('nombre LIKE ?');
      params.push(`%${q.search}%`);
    }

    const where = conditions.join(' AND ');
    const [total] = await query<any>(`SELECT COUNT(*) AS n FROM ${this.table} WHERE ${where}`, params);
    const data = await query<T>(
      `SELECT * FROM ${this.table} WHERE ${where} ORDER BY ${this.pk} DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { data, meta: paginate(page, limit, total.n) };
  }

  async findById(id: number): Promise<T | null> {
    return queryOne<T>(`SELECT * FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
  }

  async create(data: Partial<T>): Promise<T> {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const ph     = keys.map(() => '?').join(', ');
    const result = await execute(
      `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${ph})`,
      values
    );
    return this.findById(result.insertId) as Promise<T>;
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const entries = Object.entries(data);
    if (!entries.length) return this.findById(id);
    const sets   = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = [...entries.map(([, v]) => v), id];
    await execute(`UPDATE ${this.table} SET ${sets} WHERE ${this.pk} = ?`, values);
    return this.findById(id);
  }

  async softDelete(id: number): Promise<void> {
    await execute(`UPDATE ${this.table} SET activo = FALSE WHERE ${this.pk} = ?`, [id]);
  }

  async hardDelete(id: number): Promise<void> {
    await execute(`DELETE FROM ${this.table} WHERE ${this.pk} = ?`, [id]);
  }
}

// ─── Catálogos ────────────────────────────────────────────────────────────────
export class MaterialRepository    extends BaseRepository<any> { constructor() { super('materiales'); } }
export class ConductorRepository   extends BaseRepository<any> { constructor() { super('conductores'); } }
export class ProveedorRepository   extends BaseRepository<any> { constructor() { super('proveedores'); } }
export class ClienteRepository     extends BaseRepository<any> { constructor() { super('clientes'); } }
export class DepartamentoRepository extends BaseRepository<any> { constructor() { super('departamentos'); } }
export class CargoRepository       extends BaseRepository<any> { constructor() { super('cargos'); } }
export class CuentaRepository      extends BaseRepository<any> { constructor() { super('cuentas'); } }

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export class UsuarioRepository extends BaseRepository<any> {
  constructor() { super('usuarios'); }

  async findAll(_: any, q?: any) {
    const { page, limit, offset } = parsePageParams(q || {});
    const search = q?.search ? `%${q.search}%` : null;
    const params: any[] = [];
    let where = 'u.activo = TRUE';
    if (search) { where += ' AND (u.nombre LIKE ? OR u.email LIKE ?)'; params.push(search, search); }

    const [total] = await query<any>(`SELECT COUNT(*) AS n FROM usuarios u WHERE ${where}`, params);
    const data = await query<any>(
      `SELECT u.id, u.nombre, u.email, u.activo, u.ultimo_acceso, u.creado_en,
              r.nombre AS rol, d.nombre AS departamento
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN departamentos d ON d.id = u.departamento_id
       WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return { data, meta: paginate(page, limit, total.n) };
  }

  async create(data: any): Promise<any> {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(data.password, 10);
    const { password, ...rest } = data;
    return super.create({ ...rest, password_hash: hash });
  }
}

export class RolRepository extends BaseRepository<any> {
  constructor() { super('roles'); }
  async findAll(_: any, q?: any) {
    return { data: await query<any>('SELECT r.*, d.nombre AS departamento FROM roles r LEFT JOIN departamentos d ON d.id = r.departamento_id WHERE r.activo = TRUE'), meta: {} };
  }
}
