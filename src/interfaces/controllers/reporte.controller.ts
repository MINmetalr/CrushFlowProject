import { Request, Response } from 'express';
import { ReporteService } from '../../application/services/reporte.service'; // Ruta corregida
import { logger } from '../../utils/logger'; // Ruta correcta

export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  async obtenerInventario(req: Request, res: Response): Promise<void> {
    logger.info('Solicitando inventario actual');
    
    try {
      const inventario = await this.reporteService.obtenerInventario();
      res.status(200).json({
        success: true,
        data: inventario,
      });
    } catch (error) {
      logger.error({ error }, 'Error al obtener inventario');
      throw error;
    }
  }

  async obtenerReportePeriodo(req: Request, res: Response): Promise<void> {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      res.status(400).json({
        success: false,
        error: 'Los parámetros fechaInicio y fechaFin son obligatorios',
      });
      return;
    }

    const inicio = new Date(fechaInicio as string);
    const fin = new Date(fechaFin as string);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido. Use YYYY-MM-DD',
      });
      return;
    }

    fin.setHours(23, 59, 59, 999);

    logger.info({ fechaInicio: inicio, fechaFin: fin }, 'Generando reporte por período');

    try {
      const reporte = await this.reporteService.obtenerReportePeriodo(inicio, fin);
      res.status(200).json({
        success: true,
        data: reporte,
      });
    } catch (error) {
      logger.error({ error }, 'Error al generar reporte');
      throw error;
    }
  }
}