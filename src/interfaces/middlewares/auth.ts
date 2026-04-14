import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { unauthorized, forbidden } from '../../utils/response';
import { query } from '../../config/database';

export interface AuthPayload {
  userId: number;
  email: string;
  rolId: number;
  rolNombre: string;
  departamentoId: number | null;
  permisos: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ── Verificar JWT ─────────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return unauthorized(res);

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return unauthorized(res, 'Token inválido o expirado');
  }
}

// ── Verificar permiso específico ──────────────────────────────────────────────
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    const { permisos } = req.user;

    // Superadmin tiene todo
    if (permisos.includes('*')) return next();

    const hasAll = permissions.every(p => {
      const [module, action] = p.split('.');
      return (
        permisos.includes(p) ||
        permisos.includes(`${module}.*`) ||
        permisos.includes('*')
      );
    });

    if (!hasAll) return forbidden(res, `Requiere permiso: ${permissions.join(', ')}`);
    next();
  };
}

// ── Verificar rol ─────────────────────────────────────────────────────────────
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.rolNombre)) {
      return forbidden(res, `Requiere rol: ${roles.join(' o ')}`);
    }
    next();
  };
}

// ── Generar tokens ────────────────────────────────────────────────────────────
export function generateTokens(payload: AuthPayload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES as any,
  });
  const refreshToken = jwt.sign(
    { userId: payload.userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES as any }
  );
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { userId: number } {
  return jwt.verify(token, env.JWT_SECRET) as { userId: number };
}

// ── Cargar permisos del usuario desde BD ──────────────────────────────────────
export async function buildAuthPayload(userId: number): Promise<AuthPayload | null> {
  const rows = await query<any>(
    `SELECT u.id, u.email, u.nombre, u.departamento_id,
            r.id AS rol_id, r.nombre AS rol_nombre, r.permisos
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ? AND u.activo = TRUE`,
    [userId]
  );
  if (!rows[0]) return null;
  const u = rows[0];
  return {
    userId:         u.id,
    email:          u.email,
    rolId:          u.rol_id,
    rolNombre:      u.rol_nombre,
    departamentoId: u.departamento_id,
    permisos:       typeof u.permisos === 'string' ? JSON.parse(u.permisos) : u.permisos,
  };
}
