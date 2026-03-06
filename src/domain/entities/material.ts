import { Unidad } from '../value-objects/unidad';

export interface Material {
  id: number;
  nombre: string;
  unidad: Unidad;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}