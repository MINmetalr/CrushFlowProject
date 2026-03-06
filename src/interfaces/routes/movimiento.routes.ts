import { Router } from 'express';
import { MovimientoController } from '../controllers/movimiento.controller';
import { validateBody, crearMovimientoSchema } from '../middlewares/validation'; // Ruta correcta

export function createMovimientoRoutes(controller: MovimientoController): Router {
  const router = Router();

  router.post(
    '/movimientos',
    validateBody(crearMovimientoSchema),
    controller.crearMovimiento.bind(controller)
  );

  router.get('/movimientos', controller.listarMovimientos.bind(controller));

  return router;
}