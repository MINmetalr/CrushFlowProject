"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteService = void 0;
const database_1 = require("../../config/database");
class ReporteService {
    async dashboard() {
        const [ventas30, compras30, movimientos7, stockCritico, facturasPendientes] = await Promise.all([
            (0, database_1.queryOne)(`SELECT COUNT(*) AS ordenes, COALESCE(SUM(total),0) AS total
                     FROM ordenes_venta WHERE fecha_orden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND estado != 'cancelada'`),
            (0, database_1.queryOne)(`SELECT COUNT(*) AS ordenes, COALESCE(SUM(total),0) AS total
                     FROM ordenes_compra WHERE fecha_orden >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND estado != 'cancelada'`),
            (0, database_1.queryOne)(`SELECT COUNT(*) AS total, SUM(tipo='entrada') AS entradas, SUM(tipo='salida') AS salidas
                     FROM movimientos WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
            (0, database_1.queryOne)(`SELECT COUNT(*) AS total FROM stock_actual WHERE estado_stock IN ('critico','bajo')`),
            (0, database_1.queryOne)(`SELECT COUNT(*) AS total, COALESCE(SUM(total),0) AS monto FROM facturas WHERE estado='pendiente'`),
        ]);
        const ventasMes = await (0, database_1.query)(`SELECT DATE_FORMAT(fecha_orden,'%Y-%m') AS mes, COUNT(*) AS ordenes, COALESCE(SUM(total),0) AS total
       FROM ordenes_venta WHERE fecha_orden >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND estado != 'cancelada'
       GROUP BY mes ORDER BY mes`);
        const topMateriales = await (0, database_1.query)(`SELECT mat.nombre, SUM(m.cantidad) AS cantidad_total, mat.unidad
       FROM movimientos m JOIN materiales mat ON mat.id = m.material_id
       WHERE m.tipo = 'salida' AND m.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY mat.id, mat.nombre, mat.unidad ORDER BY cantidad_total DESC LIMIT 5`);
        return {
            ventas30: ventas30 ?? { ordenes: 0, total: 0 },
            compras30: compras30 ?? { ordenes: 0, total: 0 },
            movimientos7: movimientos7 ?? { total: 0, entradas: 0, salidas: 0 },
            stockCritico: stockCritico?.total ?? 0,
            facturasPendientes: facturasPendientes ?? { total: 0, monto: 0 },
            ventasMes,
            topMateriales,
        };
    }
    async inventario(q = {}) {
        let where = '1=1';
        const p = [];
        if (q.categoria) {
            where += ' AND categoria = ?';
            p.push(q.categoria);
        }
        if (q.estado) {
            where += ' AND estado_stock = ?';
            p.push(q.estado);
        }
        return (0, database_1.query)(`SELECT * FROM stock_actual WHERE ${where} ORDER BY nombre`, p);
    }
    async movimientosPorPeriodo(desde, hasta) {
        return (0, database_1.query)(`SELECT m.tipo, DATE(m.fecha) AS dia, mat.nombre AS material,
              SUM(m.cantidad) AS cantidad_total, COALESCE(SUM(m.total),0) AS valor_total
       FROM movimientos m JOIN materiales mat ON mat.id = m.material_id
       WHERE m.fecha BETWEEN ? AND ?
       GROUP BY m.tipo, dia, mat.id, mat.nombre ORDER BY dia, mat.nombre`, [desde, hasta + ' 23:59:59']);
    }
    async ventasPorCliente(desde, hasta) {
        return (0, database_1.query)(`SELECT cl.nombre AS cliente, cl.ciudad,
              COUNT(ov.id) AS ordenes, COALESCE(SUM(ov.total),0) AS total
       FROM ordenes_venta ov JOIN clientes cl ON cl.id = ov.cliente_id
       WHERE ov.fecha_orden BETWEEN ? AND ? AND ov.estado != 'cancelada'
       GROUP BY cl.id, cl.nombre, cl.ciudad ORDER BY total DESC`, [desde, hasta]);
    }
    async comprasPorProveedor(desde, hasta) {
        return (0, database_1.query)(`SELECT p.nombre AS proveedor,
              COUNT(oc.id) AS ordenes, COALESCE(SUM(oc.total),0) AS total
       FROM ordenes_compra oc JOIN proveedores p ON p.id = oc.proveedor_id
       WHERE oc.fecha_orden BETWEEN ? AND ? AND oc.estado != 'cancelada'
       GROUP BY p.id, p.nombre ORDER BY total DESC`, [desde, hasta]);
    }
    async nominaPorPeriodo(periodo) {
        return (0, database_1.query)(`SELECT d.nombre AS departamento, COUNT(n.id) AS empleados,
              SUM(n.total_pagar) AS total_nomina
       FROM nomina n
       JOIN empleados e ON e.id = n.empleado_id
       JOIN departamentos d ON d.id = e.departamento_id
       WHERE n.periodo = ?
       GROUP BY d.id, d.nombre ORDER BY total_nomina DESC`, [periodo]);
    }
    async financiero(anio) {
        const [ingresos, egresos] = await Promise.all([
            (0, database_1.query)(`SELECT DATE_FORMAT(fecha,'%Y-%m') AS mes, SUM(monto) AS total
         FROM transacciones WHERE tipo='ingreso' AND YEAR(fecha)=? AND estado='completada'
         GROUP BY mes ORDER BY mes`, [anio]),
            (0, database_1.query)(`SELECT DATE_FORMAT(fecha,'%Y-%m') AS mes, SUM(monto) AS total
         FROM transacciones WHERE tipo='egreso' AND YEAR(fecha)=? AND estado='completada'
         GROUP BY mes ORDER BY mes`, [anio]),
        ]);
        return { ingresos, egresos };
    }
}
exports.ReporteService = ReporteService;
