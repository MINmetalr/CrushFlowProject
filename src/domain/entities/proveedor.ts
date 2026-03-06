export interface Proveedor {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  createdAt: Date;
  updatedAt: Date;
}