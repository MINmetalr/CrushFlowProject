import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { badRequest, serverError } from '../../utils/response';
import { logger } from '../../utils/logger';

// ── Global error handler ──────────────────────────────────────────────────────
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos' });
  }
  if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ success: false, message: 'No se puede eliminar: tiene registros relacionados' });
  }
  if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
    return badRequest(res, 'Referencia inválida: el registro relacionado no existe');
  }
  if (err instanceof ZodError) {
    return badRequest(res, 'Datos inválidos', err.flatten().fieldErrors);
  }
  if (err?.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  return serverError(res);
}

// ── Zod body validation ───────────────────────────────────────────────────────
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return badRequest(res, 'Datos inválidos', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

// ── Audit logger middleware ────────────────────────────────────────────────────
export function auditLog(accion: string, entidad: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Fire-and-forget audit log after response
    res.on('finish', () => {
      if (req.user && res.statusCode < 400) {
        const { query } = require('../../config/database');
        query(
          `INSERT INTO sesiones_audit (usuario_id, accion, entidad, detalle, ip)
           VALUES (?, ?, ?, ?, ?)`,
          [
            req.user.userId, accion, entidad,
            JSON.stringify({ body: req.body, params: req.params }),
            req.ip,
          ]
        ).catch(() => {});
      }
    });
    next();
  };
}

// Keep reference for usage in auditLog closure
let res: any;
