"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteService = void 0;
class ReporteService {
    movimientoRepo;
    constructor(movimientoRepo) {
        this.movimientoRepo = movimientoRepo;
    }
    async obtenerInventario() {
        return this.movimientoRepo.getInventarioActual();
    }
    async obtenerReportePeriodo(fechaInicio, fechaFin) {
        // El repositorio devuelve un objeto con movimientos y agregados
        const reporte = await this.movimientoRepo.getReportePeriodo(fechaInicio, fechaFin);
        // Mapear al DTO de respuesta
        return {
            fechaInicio,
            fechaFin,
            movimientos: reporte.movimientos, // esto es un array
            totalEntradas: reporte.totalEntradas,
            totalSalidas: reporte.totalSalidas,
            porMaterial: reporte.porMaterial,
        };
    }
}
exports.ReporteService = ReporteService;
