"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.validateBody = validateBody;
exports.auditLog = auditLog;
const zod_1 = require("zod");
const response_1 = require("../../utils/response");
const logger_1 = require("../../utils/logger");
function errorHandler(err, req, res, _next) {
    logger_1.logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
    if (err?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' });
    }
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, message: 'No se puede eliminar: tiene registros relacionados' });
    }
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
        return (0, response_1.badRequest)(res, 'Referencia inválida: el registro relacionado no existe');
    }
    if (err instanceof zod_1.ZodError) {
        return (0, response_1.badRequest)(res, 'Datos inválidos', err.flatten().fieldErrors);
    }
    if (err?.status) {
        return res.status(err.status).json({ success: false, message: err.message });
    }
    return (0, response_1.serverError)(res);
}
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return (0, response_1.badRequest)(res, 'Datos inválidos', result.error.flatten().fieldErrors);
        }
        req.body = result.data;
        next();
    };
}
function auditLog(accion, entidad) {
    return async (req, _res, next) => {
        res.on('finish', () => {
            if (req.user && res.statusCode < 400) {
                const { query } = require('../../config/database');
                query(`INSERT INTO sesiones_audit (usuario_id, accion, entidad, detalle, ip)
           VALUES (?, ?, ?, ?, ?)`, [
                    req.user.userId, accion, entidad,
                    JSON.stringify({ body: req.body, params: req.params }),
                    req.ip,
                ]).catch(() => { });
            }
        });
        next();
    };
}
let res;
