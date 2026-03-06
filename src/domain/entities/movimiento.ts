import { Unidad } from '../value-objects/unidad';

export type TipoMovimiento = 'entrada' | 'salida';

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  fecha: Date;
  materialId: number;
  cantidad: number;
  unidad: Unidad; // redundante pero útil
  conductorId?: number | null;
  clienteId?: number | null;
  proveedorId?: number | null;
  precioUnitario?: number | null;
  total?: number | null;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}