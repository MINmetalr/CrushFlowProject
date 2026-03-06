import { Movimiento } from '../../domain/entities/movimiento';

export interface CrearMovimientoDto {
  tipo: 'entrada' | 'salida';
  materialId: number;
  cantidad: number;
  conductorId?: number;
  clienteId?: number;
  proveedorId?: number;
  precioUnitario?: number;
  observaciones?: string;
  fecha?: Date;
}

export interface MovimientoResponseDto {
  id: number;
  tipo: string;
  fecha: string;
  material: string;
  cantidad: number;
  unidad: string;
  conductor?: string;
  cliente?: string;
  proveedor?: string;
  precioUnitario?: number;
  total?: number;
  observaciones?: string;
}

export function toMovimientoResponseDto(
  movimiento: Movimiento,
  materialNombre: string,
  conductorNombre?: string,
  clienteNombre?: string,
  proveedorNombre?: string
): MovimientoResponseDto {
  return {
    id: movimiento.id,
    tipo: movimiento.tipo,
    fecha: movimiento.fecha.toISOString(),
    material: materialNombre,
    cantidad: movimiento.cantidad,
    unidad: movimiento.unidad,
    conductor: conductorNombre,
    cliente: clienteNombre,
    proveedor: proveedorNombre,
    precioUnitario: movimiento.precioUnitario ?? undefined,
    total: movimiento.total ?? undefined,
    observaciones: movimiento.observaciones,
  };
}