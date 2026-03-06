"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteController = void 0;
const logger_1 = require("../../utils/logger"); // Ruta correcta
class ReporteController {
    reporteService;
    constructor(reporteService) {
        this.reporteService = reporteService;
    }
    async obtenerInventario(req, res) {
        logger_1.logger.info('Solicitando inventario actual');
        try {
            const inventario = await this.reporteService.obtenerInventario();
            res.status(200).json({
                success: true,
                data: inventario,
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error al obtener inventario');
            throw error;
        }
    }
    async obtenerReportePeriodo(req, res) {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            res.status(400).json({
                success: false,
                error: 'Los parámetros fechaInicio y fechaFin son obligatorios',
            });
            return;
        }
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
            res.status(400).json({
                success: false,
                error: 'Formato de fecha inválido. Use YYYY-MM-DD',
            });
            return;
        }
        fin.setHours(23, 59, 59, 999);
        logger_1.logger.info({ fechaInicio: inicio, fechaFin: fin }, 'Generando reporte por período');
        try {
            const reporte = await this.reporteService.obtenerReportePeriodo(inicio, fin);
            res.status(200).json({
                success: true,
                data: reporte,
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error al generar reporte');
            throw error;
        }
    }
}
exports.ReporteController = ReporteController;
