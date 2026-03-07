'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

type MovimientoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // para recargar la lista después de guardar
};

// Datos simulados (mientras no haya endpoints reales)
const mockMateriales = [
  { id: 1, nombre: 'Arena gruesa', unidad: 'm3' },
  { id: 2, nombre: 'Arena fina', unidad: 'm3' },
  { id: 3, nombre: 'Grava 3/4', unidad: 'm3' },
  { id: 4, nombre: 'Piedra bola', unidad: 'toneladas' },
  { id: 5, nombre: 'Base granular', unidad: 'toneladas' },
];

const mockConductores = [
  { id: 1, nombre: 'Juan Pérez' },
  { id: 2, nombre: 'María Gómez' },
];

const mockClientes = [
  { id: 1, nombre: 'Constructora ABC' },
  { id: 2, nombre: 'Inmobiliaria XYZ' },
];

const mockProveedores = [
  { id: 1, nombre: 'Minas del Norte' },
  { id: 2, nombre: 'Triturados Ltda' },
];

export default function MovimientoModal({ isOpen, onClose, onSuccess }: MovimientoModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [materialId, setMaterialId] = useState<number>(0);
  const [cantidad, setCantidad] = useState('');
  const [conductorId, setConductorId] = useState<number>(0);
  const [clienteId, setClienteId] = useState<number>(0);
  const [proveedorId, setProveedorId] = useState<number>(0);
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reiniciar formulario al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setTipo('entrada');
      setMaterialId(0);
      setCantidad('');
      setConductorId(0);
      setClienteId(0);
      setProveedorId(0);
      setPrecioUnitario('');
      setObservaciones('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones básicas
    if (!materialId || !cantidad || parseFloat(cantidad) <= 0) {
      setError('Selecciona un material y una cantidad válida');
      setLoading(false);
      return;
    }
    if (tipo === 'entrada' && !proveedorId) {
      setError('Para una entrada debes seleccionar un proveedor');
      setLoading(false);
      return;
    }
    if (tipo === 'salida' && !clienteId) {
      setError('Para una salida debes seleccionar un cliente');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        tipo,
        materialId,
        cantidad: parseFloat(cantidad),
        conductorId: conductorId || undefined,
        clienteId: tipo === 'salida' ? clienteId : undefined,
        proveedorId: tipo === 'entrada' ? proveedorId : undefined,
        precioUnitario: precioUnitario ? parseFloat(precioUnitario) : undefined,
        observaciones: observaciones || undefined,
      };

      await axios.post('/api/movimientos', payload);
      onSuccess(); // recargar lista de movimientos
      onClose();   // cerrar modal
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Registrar Movimiento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tipo de movimiento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="entrada"
                  checked={tipo === 'entrada'}
                  onChange={(e) => setTipo(e.target.value as 'entrada')}
                  className="mr-2"
                />
                Entrada (Compra)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="salida"
                  checked={tipo === 'salida'}
                  onChange={(e) => setTipo(e.target.value as 'salida')}
                  className="mr-2"
                />
                Salida (Venta)
              </label>
            </div>
          </div>

          {/* Material */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            >
              <option value={0}>Seleccionar...</option>
              {mockMateriales.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          {/* Conductor (opcional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor (opcional)</label>
            <select
              value={conductorId}
              onChange={(e) => setConductorId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value={0}>Sin conductor</option>
              {mockConductores.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cliente o Proveedor según tipo */}
          {tipo === 'salida' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option value={0}>Seleccionar...</option>
                {mockClientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {tipo === 'entrada' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2"
                required
              >
                <option value={0}>Seleccionar...</option>
                {mockProveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Precio unitario (opcional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario (opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioUnitario}
              onChange={(e) => setPrecioUnitario(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}