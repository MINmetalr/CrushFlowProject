import { Movimiento } from '../../../domain/entities/movimiento';

export interface FiltrosMovimiento {
  fechaDesde?: Date;
  fechaHasta?: Date;
  materialId?: number;
  tipo?: 'entrada' | 'salida';
  conductorId?: number;
  clienteId?: number;
  proveedorId?: number;
}

export interface InventarioItem {
  materialId: number;
  material: string;
  unidad: string;
  cantidad: number;
}

export interface ReportePeriodo {
  fechaInicio: Date;
  fechaFin: Date;
  movimientos: Movimiento[];
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

export interface MovimientoRepository {
  findAll(filtros?: FiltrosMovimiento): Promise<Movimiento[]>;
  findById(id: number): Promise<Movimiento | null>;
  save(movimiento: Omit<Movimiento, 'id' | 'createdAt' | 'updatedAt'>): Promise<Movimiento>;
  update(id: number, movimiento: Partial<Movimiento>): Promise<Movimiento | null>;
  delete(id: number): Promise<boolean>;
  getInventarioActual(): Promise<InventarioItem[]>;
  getReportePeriodo(fechaInicio: Date, fechaFin: Date): Promise<ReportePeriodo>;
}