import { Proveedor } from '../../../domain/entities/proveedor';

export interface ProveedorRepository {
  findAll(): Promise<Proveedor[]>;
  findById(id: number): Promise<Proveedor | null>;
  findByEmail(email: string): Promise<Proveedor | null>;
  save(proveedor: Omit<Proveedor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Proveedor>;
  update(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor | null>;
  delete(id: number): Promise<boolean>;
}