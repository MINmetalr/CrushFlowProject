"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../config/database");
const auth_1 = require("../../interfaces/middlewares/auth");
const logger_1 = require("../../utils/logger");
class AuthService {
    async login(dto) {
        const user = await (0, database_1.queryOne)(`SELECT u.*, r.nombre AS rol_nombre, r.permisos
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.email = ? AND u.activo = TRUE`, [dto.email.toLowerCase().trim()]);
        if (!user)
            throw { status: 401, message: 'Credenciales incorrectas' };
        const valid = await bcryptjs_1.default.compare(dto.password, user.password_hash);
        if (!valid)
            throw { status: 401, message: 'Credenciales incorrectas' };
        const permisos = typeof user.permisos === 'string'
            ? JSON.parse(user.permisos) : user.permisos;
        const payload = {
            userId: user.id,
            email: user.email,
            rolId: user.rol_id,
            rolNombre: user.rol_nombre,
            departamentoId: user.departamento_id,
            permisos,
        };
        const { accessToken, refreshToken } = (0, auth_1.generateTokens)(payload);
        await (0, database_1.execute)('UPDATE usuarios SET refresh_token = ?, ultimo_acceso = NOW() WHERE id = ?', [refreshToken, user.id]);
        logger_1.logger.info({ userId: user.id, email: user.email }, 'Login exitoso');
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol_nombre,
                departamentoId: user.departamento_id,
                permisos,
            },
        };
    }
    async refresh(token) {
        let decoded;
        try {
            decoded = (0, auth_1.verifyRefreshToken)(token);
        }
        catch {
            throw { status: 401, message: 'Refresh token inválido' };
        }
        const user = await (0, database_1.queryOne)('SELECT * FROM usuarios WHERE id = ? AND refresh_token = ? AND activo = TRUE', [decoded.userId, token]);
        if (!user)
            throw { status: 401, message: 'Sesión inválida' };
        const payload = await (0, auth_1.buildAuthPayload)(user.id);
        if (!payload)
            throw { status: 401, message: 'Usuario no disponible' };
        const { accessToken, refreshToken } = (0, auth_1.generateTokens)(payload);
        await (0, database_1.execute)('UPDATE usuarios SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);
        return { accessToken, refreshToken };
    }
    async logout(userId) {
        await (0, database_1.execute)('UPDATE usuarios SET refresh_token = NULL WHERE id = ?', [userId]);
    }
    async changePassword(userId, currentPwd, newPwd) {
        const user = await (0, database_1.queryOne)('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
        if (!user)
            throw { status: 404, message: 'Usuario no encontrado' };
        const valid = await bcryptjs_1.default.compare(currentPwd, user.password_hash);
        if (!valid)
            throw { status: 400, message: 'Contraseña actual incorrecta' };
        const hash = await bcryptjs_1.default.hash(newPwd, 10);
        await (0, database_1.execute)('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, userId]);
    }
}
exports.AuthService = AuthService;
