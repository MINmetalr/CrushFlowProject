import { Movimiento } from '../domain/entities/movimiento';
import { Material } from '../domain/entities/material';

export function generarPlantillaCorreo(movimiento: Movimiento, material: Material): string {
  const fecha = new Date(movimiento.fecha).toLocaleString('es-ES');
  return `
    <h2>Nuevo movimiento registrado</h2>
    <p><strong>Tipo:</strong> ${movimiento.tipo === 'entrada' ? 'Entrada (compra)' : 'Salida (venta)'}</p>
    <p><strong>Material:</strong> ${material.nombre}</p>
    <p><strong>Cantidad:</strong> ${movimiento.cantidad} ${movimiento.unidad}</p>
    ${movimiento.precioUnitario ? `<p><strong>Precio unitario:</strong> $${movimiento.precioUnitario}</p>` : ''}
    ${movimiento.total ? `<p><strong>Total:</strong> $${movimiento.total}</p>` : ''}
    <p><strong>Fecha:</strong> ${fecha}</p>
    ${movimiento.observaciones ? `<p><strong>Observaciones:</strong> ${movimiento.observaciones}</p>` : ''}
    <hr>
    <p>Este es un mensaje automático, por favor no responder.</p>
  `;
}