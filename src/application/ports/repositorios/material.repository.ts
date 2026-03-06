import { Material } from '../../../domain/entities/material';

export interface MaterialRepository {
  findAll(): Promise<Material[]>;
  findById(id: number): Promise<Material | null>;
  save(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material>;
  update(id: number, material: Partial<Material>): Promise<Material | null>;
  delete(id: number): Promise<boolean>;
}