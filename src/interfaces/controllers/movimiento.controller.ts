import { Request, Response } from 'express';
import { MovimientoService } from '../../application/services/movimiento.service'; // Ruta corregida
import { CrearMovimientoDto } from '../../application/dtos/movimiento.dto'; // Ruta corregida
import { logger } from '../../utils/logger'; // Ruta correcta

export class MovimientoController {
  constructor(private movimientoService: MovimientoService) {}

  async crearMovimiento(req: Request, res: Response): Promise<void> {
    const dto: CrearMovimientoDto = req.body;
    logger.info({ dto }, 'Creando nuevo movimiento');

    try {
      const movimiento = await this.movimientoService.crearMovimiento(dto);
      // Podrías usar toMovimientoResponseDto aquí si lo deseas
      res.status(201).json({
        success: true,
        data: movimiento,
      });
    } catch (error) {
      logger.error({ error }, 'Error al crear movimiento');
      throw error; // El middleware global lo manejará
    }
  }

  async listarMovimientos(req: Request, res: Response): Promise<void> {
    try {
      // Por ahora, devolver mensaje de no implementado
      res.status(501).json({
        success: false,
        error: 'Método no implementado',
      });
    } catch (error) {
      logger.error({ error }, 'Error al listar movimientos');
      throw error;
    }
  }
}