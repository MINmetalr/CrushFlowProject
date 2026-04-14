import bcrypt from 'bcryptjs';
import { query, execute, queryOne } from '../../config/database';
import {
  generateTokens, verifyRefreshToken, buildAuthPayload
} from '../../interfaces/middlewares/auth';
import { logger } from '../../utils/logger';

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {

  async login(dto: LoginDTO) {
    const user = await queryOne<any>(
      `SELECT u.*, r.nombre AS rol_nombre, r.permisos
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.email = ? AND u.activo = TRUE`,
      [dto.email.toLowerCase().trim()]
    );

    if (!user) throw { status: 401, message: 'Credenciales incorrectas' };

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw { status: 401, message: 'Credenciales incorrectas' };

    const permisos = typeof user.permisos === 'string'
      ? JSON.parse(user.permisos) : user.permisos;

    const payload = {
      userId:         user.id,
      email:          user.email,
      rolId:          user.rol_id,
      rolNombre:      user.rol_nombre,
      departamentoId: user.departamento_id,
      permisos,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Guardar refresh token y actualizar último acceso
    await execute(
      'UPDATE usuarios SET refresh_token = ?, ultimo_acceso = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    logger.info({ userId: user.id, email: user.email }, 'Login exitoso');

    return {
      accessToken,
      refreshToken,
      user: {
        id:             user.id,
        nombre:         user.nombre,
        email:          user.email,
        rol:            user.rol_nombre,
        departamentoId: user.departamento_id,
        permisos,
      },
    };
  }

  async refresh(token: string) {
    let decoded: { userId: number };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw { status: 401, message: 'Refresh token inválido' };
    }

    const user = await queryOne<any>(
      'SELECT * FROM usuarios WHERE id = ? AND refresh_token = ? AND activo = TRUE',
      [decoded.userId, token]
    );
    if (!user) throw { status: 401, message: 'Sesión inválida' };

    const payload = await buildAuthPayload(user.id);
    if (!payload) throw { status: 401, message: 'Usuario no disponible' };

    const { accessToken, refreshToken } = generateTokens(payload);
    await execute('UPDATE usuarios SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    return { accessToken, refreshToken };
  }

  async logout(userId: number) {
    await execute('UPDATE usuarios SET refresh_token = NULL WHERE id = ?', [userId]);
  }

  async changePassword(userId: number, currentPwd: string, newPwd: string) {
    const user = await queryOne<any>('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    if (!user) throw { status: 404, message: 'Usuario no encontrado' };

    const valid = await bcrypt.compare(currentPwd, user.password_hash);
    if (!valid) throw { status: 400, message: 'Contraseña actual incorrecta' };

    const hash = await bcrypt.hash(newPwd, 10);
    await execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, userId]);
  }
}
