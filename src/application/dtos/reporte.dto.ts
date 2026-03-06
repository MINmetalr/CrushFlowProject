import { Movimiento } from '../../domain/entities/movimiento';

export interface InventarioDto {
  materialId: number;
  material: string;
  unidad: string;
  cantidad: number;
}

export interface ReportePeriodoDto {
  fechaInicio: Date;
  fechaFin: Date;
  movimientos: Movimiento[]; // Ahora tipado correctamente
  totalEntradas: number;
  totalSalidas: number;
  porMaterial: {
    materialId: number;
    material: string;
    entradas: number;
    salidas: number;
    saldo: number;
  }[];
}