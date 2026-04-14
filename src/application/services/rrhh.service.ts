import { query, queryOne, execute } from '../../config/database';
import { parsePageParams, paginate } from '../../utils/response';

export class RrhhService {
  async findEmpleados(q: any = {}) {
    const { page, limit, offset } = parsePageParams(q);
    const cond: string[] = ["e.estado != 'retirado'"];
    const p: any[] = [];
    if (q.departamento_id) { cond.push('e.departamento_id = ?'); p.push(q.departamento_id); }
    if (q.estado)          { cond.push('e.estado = ?');          p.push(q.estado); }
    if (q.search) {
      cond.push('(e.nombre LIKE ? OR e.apellido LIKE ? OR e.documento LIKE ?)');
      const s = `%${q.search}%`;
      p.push(s, s, s);
    }
    const where = cond.join(' AND ');
    const [total] = await query<any>(`SELECT COUNT(*) AS n FROM empleados e WHERE ${where}`, p);
    const data = await query<any>(
      `SELECT e.*, c.nombre AS cargo_nombre, d.nombre AS departamento_nombre
       FROM empleados e
       LEFT JOIN cargos c ON c.id = e.cargo_id
       LEFT JOIN departamentos d ON d.id = e.departamento_id
       WHERE ${where} ORDER BY e.apellido, e.nombre LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return { data, meta: paginate(page, limit, total.n) };
  }

  async findEmpleadoById(id: number) {
    return queryOne<any>(
      `SELECT e.*, c.nombre AS cargo_nombre, d.nombre AS departamento_nombre
       FROM empleados e
       LEFT JOIN cargos c ON c.id = e.cargo_id
       LEFT JOIN departamentos d ON d.id = e.departamento_id
       WHERE e.id = ?`, [id]
    );
  }

  async createEmpleado(data: any) {
    const codigo = `EMP-${Date.now().toString().slice(-6)}`;
    const result = await execute(
      `INSERT INTO empleados (codigo, nombre, apellido, documento, tipo_documento, email, telefono,
        celular, direccion, ciudad, cargo_id, departamento_id, fecha_ingreso, tipo_contrato, salario,
        banco, cuenta_bancaria, tipo_cuenta, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, data.nombre, data.apellido, data.documento, data.tipo_documento ?? 'CC',
       data.email ?? null, data.telefono ?? null, data.celular ?? null,
       data.direccion ?? null, data.ciudad ?? null, data.cargo_id ?? null,
       data.departamento_id ?? null, data.fecha_ingreso, data.tipo_contrato ?? 'indefinido',
       data.salario, data.banco ?? null, data.cuenta_bancaria ?? null,
       data.tipo_cuenta ?? 'ahorros', data.notas ?? null]
    );
    return this.findEmpleadoById(result.insertId);
  }

  async updateEmpleado(id: number, data: any) {
    const allowed = ['nombre','apellido','email','telefono','celular','direccion','ciudad',
                     'cargo_id','departamento_id','tipo_contrato','salario','estado',
                     'banco','cuenta_bancaria','tipo_cuenta','notas'];
    const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
    if (!entries.length) return this.findEmpleadoById(id);
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    await execute(`UPDATE empleados SET ${sets}, actualizado_en = NOW() WHERE id = ?`,
      [...entries.map(([,v]) => v), id]);
    return this.findEmpleadoById(id);
  }

  // Nómina básica
  async createNomina(data: any, userId: number) {
    const empleado = await queryOne<any>('SELECT * FROM empleados WHERE id = ?', [data.empleado_id]);
    if (!empleado) throw { status: 404, message: 'Empleado no encontrado' };
    const total = (empleado.salario + (data.bonificaciones ?? 0) + (data.horas_extra ?? 0) * (empleado.salario / 240))
                - (data.deducciones ?? 0);
    const result = await execute(
      `INSERT INTO nomina (empleado_id, periodo, salario_base, horas_extra, bonificaciones, deducciones, total_pagar, notas, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE horas_extra=VALUES(horas_extra), bonificaciones=VALUES(bonificaciones),
         deducciones=VALUES(deducciones), total_pagar=VALUES(total_pagar)`,
      [data.empleado_id, data.periodo, empleado.salario, data.horas_extra ?? 0,
       data.bonificaciones ?? 0, data.deducciones ?? 0, total, data.notas ?? null, userId]
    );
    return queryOne<any>(
      `SELECT n.*, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido
       FROM nomina n JOIN empleados e ON e.id = n.empleado_id WHERE n.id = ?`,
      [result.insertId]
    );
  }

  async findNomina(q: any = {}) {
    const { page, limit, offset } = parsePageParams(q);
    const cond: string[] = ['1=1'];
    const p: any[] = [];
    if (q.periodo)      { cond.push('n.periodo = ?');      p.push(q.periodo); }
    if (q.empleado_id)  { cond.push('n.empleado_id = ?');  p.push(q.empleado_id); }
    if (q.estado)       { cond.push('n.estado = ?');       p.push(q.estado); }
    const where = cond.join(' AND ');
    const [total] = await query<any>(`SELECT COUNT(*) AS n FROM nomina n WHERE ${where}`, p);
    const data = await query<any>(
      `SELECT n.*, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, c.nombre AS cargo_nombre
       FROM nomina n
       JOIN empleados e ON e.id = n.empleado_id
       LEFT JOIN cargos c ON c.id = e.cargo_id
       WHERE ${where} ORDER BY n.periodo DESC, e.apellido LIMIT ? OFFSET ?`,
      [...p, limit, offset]
    );
    return { data, meta: paginate(page, limit, total.n) };
  }
}
