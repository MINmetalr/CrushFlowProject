"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverError = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.noContent = exports.created = exports.ok = void 0;
exports.paginate = paginate;
exports.parsePageParams = parsePageParams;
const ok = (res, data, meta) => res.status(200).json({ success: true, data, ...(meta && { meta }) });
exports.ok = ok;
const created = (res, data) => res.status(201).json({ success: true, data });
exports.created = created;
const noContent = (res) => res.status(204).send();
exports.noContent = noContent;
const badRequest = (res, message, errors) => res.status(400).json({ success: false, message, ...(errors && { errors }) });
exports.badRequest = badRequest;
const unauthorized = (res, message = 'No autorizado') => res.status(401).json({ success: false, message });
exports.unauthorized = unauthorized;
const forbidden = (res, message = 'Acceso denegado') => res.status(403).json({ success: false, message });
exports.forbidden = forbidden;
const notFound = (res, entity = 'Recurso') => res.status(404).json({ success: false, message: `${entity} no encontrado` });
exports.notFound = notFound;
const conflict = (res, message) => res.status(409).json({ success: false, message });
exports.conflict = conflict;
const serverError = (res, message = 'Error interno del servidor') => res.status(500).json({ success: false, message });
exports.serverError = serverError;
function paginate(page, limit, total) {
    return {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
    };
}
function parsePageParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    return { page, limit, offset: (page - 1) * limit };
}
