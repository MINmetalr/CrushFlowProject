import { MovimientoRepository } from '../ports/repositorios/movimiento.repository';
import { ReportePeriodoDto, InventarioDto } from '../dtos/reporte.dto';

export class ReporteService {
  constructor(private movimientoRepo: MovimientoRepository) {}

  async obtenerInventario(): Promise<InventarioDto[]> {
    return this.movimientoRepo.getInventarioActual();
  }

  async obtenerReportePeriodo(fechaInicio: Date, fechaFin: Date): Promise<ReportePeriodoDto> {
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