import { Request, Response } from 'express';
import { MaterialRepository } from '../../../application/ports/repositorios/material.repository';
import { ConductorRepository } from '../../../application/ports/repositorios/conductor.repository';
import { ClienteRepository } from '../../../application/ports/repositorios/cliente.repository';
import { ProveedorRepository } from '../../../application/ports/repositorios/proveedor.repository';
import { logger } from '../../utils/logger';

export class CatalogoController {
  constructor(
    private materialRepo: MaterialRepository,
    private conductorRepo: ConductorRepository,
    private clienteRepo: ClienteRepository,
    private proveedorRepo: ProveedorRepository
  ) {}

  async listarMateriales(req: Request, res: Response): Promise<void> {
    try {
      const materiales = await this.materialRepo.findAll();
      res.status(200).json({ success: true, data: materiales });
    } catch (error) {
      logger.error({ error }, 'Error al listar materiales');
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  async listarConductores(req: Request, res: Response): Promise<void> {
    try {
      const conductores = await this.conductorRepo.findAll();
      res.status(200).json({ success: true, data: conductores });
    } catch (error) {
      logger.error({ error }, 'Error al listar conductores');
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  async listarClientes(req: Request, res: Response): Promise<void> {
    try {
      const clientes = await this.clienteRepo.findAll();
      res.status(200).json({ success: true, data: clientes });
    } catch (error) {
      logger.error({ error }, 'Error al listar clientes');
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  async listarProveedores(req: Request, res: Response): Promise<void> {
    try {
      const proveedores = await this.proveedorRepo.findAll();
      res.status(200).json({ success: true, data: proveedores });
    } catch (error) {
      logger.error({ error }, 'Error al listar proveedores');
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}