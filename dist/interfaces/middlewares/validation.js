"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportePeriodoSchema = exports.shipmentIdSchema = exports.crearMovimientoSchema = exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
// Middleware para validar body
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Cuerpo de solicitud inválido',
                    details: error.errors,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
// Middleware para validar query params
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Parámetros de consulta inválidos',
                    details: error.errors,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
// Esquemas específicos
exports.crearMovimientoSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['entrada', 'salida']),
    materialId: zod_1.z.number().int().positive(),
    cantidad: zod_1.z.number().positive(),
    conductorId: zod_1.z.number().int().positive().optional(),
    clienteId: zod_1.z.number().int().positive().optional(),
    proveedorId: zod_1.z.number().int().positive().optional(),
    precioUnitario: zod_1.z.number().positive().optional(),
    observaciones: zod_1.z.string().max(500).optional(),
    fecha: zod_1.z.string().datetime().optional(),
}).refine(data => {
    if (data.tipo === 'entrada' && !data.proveedorId)
        return false;
    if (data.tipo === 'salida' && !data.clienteId)
        return false;
    return true;
}, {
    message: 'Para entrada se requiere proveedorId; para salida, clienteId',
});
exports.shipmentIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'El ID debe ser un UUID válido' }),
});
// Esquema para reporte por período
exports.reportePeriodoSchema = zod_1.z.object({
    fechaInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
    fechaFin: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
});
