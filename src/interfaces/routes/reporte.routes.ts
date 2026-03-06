import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
import { validateQuery, reportePeriodoSchema } from '../middlewares/validation';

export function createReporteRoutes(controller: ReporteController): Router {
  const router = Router();

  router.get('/inventario', controller.obtenerInventario.bind(controller));

  router.get(
    '/periodo',
    validateQuery(reportePeriodoSchema),
    controller.obtenerReportePeriodo.bind(controller)
  );

  return router;
}