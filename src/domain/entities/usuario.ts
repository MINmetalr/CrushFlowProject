export type Rol = 'admin' | 'operador' | 'gerente';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  createdAt: Date;
  updatedAt: Date;
}