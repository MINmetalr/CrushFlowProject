import { Router } from 'express';
import { CatalogoController } from '../controllers/catalogo.controller';

export function createCatalogoRoutes(controller: CatalogoController): Router {
  const router = Router();

  router.get('/materiales', controller.listarMateriales.bind(controller));
  router.get('/conductores', controller.listarConductores.bind(controller));
  router.get('/clientes', controller.listarClientes.bind(controller));
  router.get('/proveedores', controller.listarProveedores.bind(controller));

  return router;
}