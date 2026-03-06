"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReporteRoutes = createReporteRoutes;
const express_1 = require("express");
const validation_1 = require("../middlewares/validation");
function createReporteRoutes(controller) {
    const router = (0, express_1.Router)();
    router.get('/inventario', controller.obtenerInventario.bind(controller));
    router.get('/periodo', (0, validation_1.validateQuery)(validation_1.reportePeriodoSchema), controller.obtenerReportePeriodo.bind(controller));
    return router;
}
