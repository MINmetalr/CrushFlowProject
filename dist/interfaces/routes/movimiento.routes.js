"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovimientoRoutes = createMovimientoRoutes;
const express_1 = require("express");
const validation_1 = require("../middlewares/validation"); // Ruta correcta
function createMovimientoRoutes(controller) {
    const router = (0, express_1.Router)();
    router.post('/movimientos', (0, validation_1.validateBody)(validation_1.crearMovimientoSchema), controller.crearMovimiento.bind(controller));
    router.get('/movimientos', controller.listarMovimientos.bind(controller));
    return router;
}
