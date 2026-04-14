import { Response } from 'express';

export const ok = (res: Response, data: any, meta?: any) =>
  res.status(200).json({ success: true, data, ...(meta && { meta }) });

export const created = (res: Response, data: any) =>
  res.status(201).json({ success: true, data });

export const noContent = (res: Response) =>
  res.status(204).send();

export const badRequest = (res: Response, message: string, errors?: any) =>
  res.status(400).json({ success: false, message, ...(errors && { errors }) });

export const unauthorized = (res: Response, message = 'No autorizado') =>
  res.status(401).json({ success: false, message });

export const forbidden = (res: Response, message = 'Acceso denegado') =>
  res.status(403).json({ success: false, message });

export const notFound = (res: Response, entity = 'Recurso') =>
  res.status(404).json({ success: false, message: `${entity} no encontrado` });

export const conflict = (res: Response, message: string) =>
  res.status(409).json({ success: false, message });

export const serverError = (res: Response, message = 'Error interno del servidor') =>
  res.status(500).json({ success: false, message });

export function paginate(page: number, limit: number, total: number) {
  return {
    page, limit, total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

export function parsePageParams(query: any): { page: number; limit: number; offset: number } {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  return { page, limit, offset: (page - 1) * limit };
}
