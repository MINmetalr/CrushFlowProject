"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimientoController = void 0;
const logger_1 = require("../../utils/logger"); // Ruta correcta
class MovimientoController {
    movimientoService;
    constructor(movimientoService) {
        this.movimientoService = movimientoService;
    }
    async crearMovimiento(req, res) {
        const dto = req.body;
        logger_1.logger.info({ dto }, 'Creando nuevo movimiento');
        try {
            const movimiento = await this.movimientoService.crearMovimiento(dto);
            // Podrías usar toMovimientoResponseDto aquí si lo deseas
            res.status(201).json({
                success: true,
                data: movimiento,
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error al crear movimiento');
            throw error; // El middleware global lo manejará
        }
    }
    async listarMovimientos(req, res) {
        try {
            // Por ahora, devolver mensaje de no implementado
            res.status(501).json({
                success: false,
                error: 'Método no implementado',
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Error al listar movimientos');
            throw error;
        }
    }
}
exports.MovimientoController = MovimientoController;
