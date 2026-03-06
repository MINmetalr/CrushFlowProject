import { Cliente } from '../../../domain/entities/cliente';

export interface ClienteRepository {
  findAll(): Promise<Cliente[]>;
  findById(id: number): Promise<Cliente | null>;
  findByEmail(email: string): Promise<Cliente | null>;
  save(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente>;
  update(id: number, cliente: Partial<Cliente>): Promise<Cliente | null>;
  delete(id: number): Promise<boolean>;
}