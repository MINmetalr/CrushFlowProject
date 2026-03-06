export interface Conductor {
  id: number;
  nombre: string;
  licencia: string;
  telefono?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}