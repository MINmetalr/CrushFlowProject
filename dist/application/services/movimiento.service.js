"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimientoService = void 0;
const email_templates_1 = require("../../utils/email.templates");
class MovimientoService {
    movimientoRepo;
    materialRepo;
    conductorRepo;
    clienteRepo;
    proveedorRepo;
    emailService;
    constructor(movimientoRepo, materialRepo, conductorRepo, clienteRepo, proveedorRepo, emailService) {
        this.movimientoRepo = movimientoRepo;
        this.materialRepo = materialRepo;
        this.conductorRepo = conductorRepo;
        this.clienteRepo = clienteRepo;
        this.proveedorRepo = proveedorRepo;
        this.emailService = emailService;
    }
    async crearMovimiento(datos) {
        const material = await this.materialRepo.findById(datos.materialId);
        if (!material)
            throw new Error('Material no encontrado');
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
    async enviarNotificaciones(movimiento) {
        const destinatarios = [];
        if (movimiento.conductorId) {
            const conductor = await this.conductorRepo.findById(movimiento.conductorId);
            if (conductor?.email)
                destinatarios.push(conductor.email);
        }
        if (movimiento.clienteId) {
            const cliente = await this.clienteRepo.findById(movimiento.clienteId);
            if (cliente?.email)
                destinatarios.push(cliente.email);
        }
        if (movimiento.proveedorId) {
            const proveedor = await this.proveedorRepo.findById(movimiento.proveedorId);
            if (proveedor?.email)
                destinatarios.push(proveedor.email);
        }
        if (destinatarios.length === 0)
            return;
        const material = await this.materialRepo.findById(movimiento.materialId);
        const asunto = `Movimiento ${movimiento.tipo} registrado - ${material?.nombre}`;
        const html = (0, email_templates_1.generarPlantillaCorreo)(movimiento, material);
        await this.emailService.enviarCorreo({
            to: destinatarios,
            subject: asunto,
            html,
        });
    }
}
exports.MovimientoService = MovimientoService;
