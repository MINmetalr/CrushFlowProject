import { MovimientoRepository } from '../ports/repositorios/movimiento.repository';
import { MaterialRepository } from '../ports/repositorios/material.repository';
import { ConductorRepository } from '../ports/repositorios/conductor.repository';
import { ClienteRepository } from '../ports/repositorios/cliente.repository';
import { ProveedorRepository } from '../ports/repositorios/proveedor.repository';
import { EmailService } from '../ports/email.service';
import { Movimiento, TipoMovimiento } from '../../domain/entities/movimiento';
import { generarPlantillaCorreo } from '../../utils/email.templates';

export class MovimientoService {
  constructor(
    private movimientoRepo: MovimientoRepository,
    private materialRepo: MaterialRepository,
    private conductorRepo: ConductorRepository,
    private clienteRepo: ClienteRepository,
    private proveedorRepo: ProveedorRepository,
    private emailService: EmailService
  ) {}

  async crearMovimiento(datos: {
    tipo: TipoMovimiento;
    materialId: number;
    cantidad: number;
    conductorId?: number;
    clienteId?: number;
    proveedorId?: number;
    precioUnitario?: number;
    observaciones?: string;
    fecha?: Date;
  }): Promise<Movimiento> {
    const material = await this.materialRepo.findById(datos.materialId);
    if (!material) throw new Error('Material no encontrado');

    if (datos.tipo === 'entrada' && !datos.proveedorId) {
      throw new Error('Para una entrada debe especificarse el proveedor');
    }
    if (datos.tipo === 'salida' && !datos.clienteId) {
      throw new Error('Para una salida debe especificarse el cliente');
    }

    let total = undefined;
    if (datos.precioUnitario) {
      total = datos.cantidad * datos.precioUnitario;
    }

    const movimientoData = {
      tipo: datos.tipo,
      fecha: datos.fecha || new Date(),
      materialId: datos.materialId,
      cantidad: datos.cantidad,
      unidad: material.unidad,
      conductorId: datos.conductorId,
      clienteId: datos.clienteId,
      proveedorId: datos.proveedorId,
      precioUnitario: datos.precioUnitario,
      total,
      observaciones: datos.observaciones,
    };

    const movimiento = await this.movimientoRepo.save(movimientoData);
    await this.enviarNotificaciones(movimiento);
    return movimiento;
  }

  private async enviarNotificaciones(movimiento: Movimiento): Promise<void> {
    const destinatarios: string[] = [];

    if (movimiento.conductorId) {
      const conductor = await this.conductorRepo.findById(movimiento.conductorId);
      if (conductor?.email) destinatarios.push(conductor.email);
    }
    if (movimiento.clienteId) {
      const cliente = await this.clienteRepo.findById(movimiento.clienteId);
      if (cliente?.email) destinatarios.push(cliente.email);
    }
    if (movimiento.proveedorId) {
      const proveedor = await this.proveedorRepo.findById(movimiento.proveedorId);
      if (proveedor?.email) destinatarios.push(proveedor.email);
    }

    if (destinatarios.length === 0) return;

    const material = await this.materialRepo.findById(movimiento.materialId);
    const asunto = `Movimiento ${movimiento.tipo} registrado - ${material?.nombre}`;
    const html = generarPlantillaCorreo(movimiento, material!);

    await this.emailService.enviarCorreo({
      to: destinatarios,
      subject: asunto,
      html,
    });
  }
}