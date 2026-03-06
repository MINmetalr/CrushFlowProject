"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error({
        err,
        url: req.url,
        method: req.method,
        ip: req.ip,
    }, 'Error no controlado');
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(statusCode).json({
        error: message,
    });
};
exports.errorHandler = errorHandler;
