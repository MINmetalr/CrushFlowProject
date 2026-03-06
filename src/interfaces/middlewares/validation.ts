import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Middleware para validar body
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

// Middleware para validar query params
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

// Esquemas específicos
export const crearMovimientoSchema = z.object({
  tipo: z.enum(['entrada', 'salida']),
  materialId: z.number().int().positive(),
  cantidad: z.number().positive(),
  conductorId: z.number().int().positive().optional(),
  clienteId: z.number().int().positive().optional(),
  proveedorId: z.number().int().positive().optional(),
  precioUnitario: z.number().positive().optional(),
  observaciones: z.string().max(500).optional(),
  fecha: z.string().datetime().optional(),
}).refine(data => {
  if (data.tipo === 'entrada' && !data.proveedorId) return false;
  if (data.tipo === 'salida' && !data.clienteId) return false;
  return true;
}, {
  message: 'Para entrada se requiere proveedorId; para salida, clienteId',
});

export const shipmentIdSchema = z.object({
  id: z.string().uuid({ message: 'El ID debe ser un UUID válido' }),
});

// Esquema para reporte por período
export const reportePeriodoSchema = z.object({
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato debe ser YYYY-MM-DD'),
});