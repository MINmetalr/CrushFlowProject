"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMovimientoResponseDto = toMovimientoResponseDto;
function toMovimientoResponseDto(movimiento, materialNombre, conductorNombre, clienteNombre, proveedorNombre) {
    return {
        id: movimiento.id,
        tipo: movimiento.tipo,
        fecha: movimiento.fecha.toISOString(),
        material: materialNombre,
        cantidad: movimiento.cantidad,
        unidad: movimiento.unidad,
        conductor: conductorNombre,
        cliente: clienteNombre,
        proveedor: proveedorNombre,
        precioUnitario: movimiento.precioUnitario ?? undefined,
        total: movimiento.total ?? undefined,
        observaciones: movimiento.observaciones,
    };
}
