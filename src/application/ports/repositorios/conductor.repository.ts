import { Conductor } from '../../../domain/entities/conductor';

export interface ConductorRepository {
  findAll(): Promise<Conductor[]>;
  findById(id: number): Promise<Conductor | null>;
  findByLicencia(licencia: string): Promise<Conductor | null>;
  save(conductor: Omit<Conductor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conductor>;
  update(id: number, conductor: Partial<Conductor>): Promise<Conductor | null>;
  delete(id: number): Promise<boolean>;
}