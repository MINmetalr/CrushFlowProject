import { Usuario } from '../../../domain/entities/usuario';

export interface UsuarioRepository {
  findAll(): Promise<Usuario[]>;
  findById(id: number): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  save(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Usuario>;
  update(id: number, usuario: Partial<Usuario>): Promise<Usuario | null>;
  delete(id: number): Promise<boolean>;
}