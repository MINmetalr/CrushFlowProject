"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.generateTokens = generateTokens;
exports.verifyRefreshToken = verifyRefreshToken;
exports.buildAuthPayload = buildAuthPayload;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const response_1 = require("../../utils/response");
const database_1 = require("../../config/database");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
        return (0, response_1.unauthorized)(res);
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        return (0, response_1.unauthorized)(res, 'Token inválido o expirado');
    }
}
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        const { permisos } = req.user;
        if (permisos.includes('*'))
            return next();
        const hasAll = permissions.every(p => {
            const [module, action] = p.split('.');
            return (permisos.includes(p) ||
                permisos.includes(`${module}.*`) ||
                permisos.includes('*'));
        });
        if (!hasAll)
            return (0, response_1.forbidden)(res, `Requiere permiso: ${permissions.join(', ')}`);
        next();
    };
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        if (!roles.includes(req.user.rolNombre)) {
            return (0, response_1.forbidden)(res, `Requiere rol: ${roles.join(' o ')}`);
        }
        next();
    };
}
function generateTokens(payload) {
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES });
    return { accessToken, refreshToken };
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
}
async function buildAuthPayload(userId) {
    const rows = await (0, database_1.query)(`SELECT u.id, u.email, u.nombre, u.departamento_id,
            r.id AS rol_id, r.nombre AS rol_nombre, r.permisos
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ? AND u.activo = TRUE`, [userId]);
    if (!rows[0])
        return null;
    const u = rows[0];
    return {
        userId: u.id,
        email: u.email,
        rolId: u.rol_id,
        rolNombre: u.rol_nombre,
        departamentoId: u.departamento_id,
        permisos: typeof u.permisos === 'string' ? JSON.parse(u.permisos) : u.permisos,
    };
}
