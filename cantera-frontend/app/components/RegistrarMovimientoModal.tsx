'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// Tipos para los selects
type Material = { id: number; nombre: string; unidad: string };
type Conductor = { id: number; nombre: string };
type Cliente = { id: number; nombre: string };
type Proveedor = { id: number; nombre: string };

interface RegistrarMovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovimientoCreado: () => void; // para refrescar la lista
}

export default function RegistrarMovimientoModal({
  isOpen,
  onClose,
  onMovimientoCreado,
}: RegistrarMovimientoModalProps) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [materialId, setMaterialId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [conductorId, setConductorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos para los selects al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [matRes, condRes, cliRes, provRes] = await Promise.all([
            axios.get('/api/materiales'), // Asumo que tienes endpoints para listar (si no, los creamos luego)
            axios.get('/api/conductores'),
            axios.get('/api/clientes'),
            axios.get('/api/proveedores'),
          ]);
          setMateriales(matRes.data.data || []);
          setConductores(condRes.data.data || []);
          setClientes(cliRes.data.data || []);
          setProveedores(provRes.data.data || []);
        } catch (err) {
          console.error('Error cargando datos para el formulario:', err);
          setError('No se pudieron cargar algunos datos.');
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    // Validaciones básicas
    if (!materialId || !cantidad) {
      setError('Material y cantidad son obligatorios.');
      setCargando(false);
      return;
    }
    if (tipo === 'entrada' && !proveedorId) {
      setError('Para una entrada debe seleccionar un proveedor.');
      setCargando(false);
      return;
    }
    if (tipo === 'salida' && !clienteId) {
      setError('Para una salida debe seleccionar un cliente.');
      setCargando(false);
      return;
    }

    try {
      const payload = {
        tipo,
        materialId: parseInt(materialId),
        cantidad: parseFloat(cantidad),
        conductorId: conductorId ? parseInt(conductorId) : undefined,
        clienteId: clienteId ? parseInt(clienteId) : undefined,
        proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
        precioUnitario: precioUnitario ? parseFloat(precioUnitario) : undefined,
        observaciones: observaciones || undefined,
      };

      await axios.post('/api/movimientos', payload);
      onMovimientoCreado(); // refrescar lista
      onClose(); // cerrar modal
      // Resetear formulario
      setTipo('entrada');
      setMaterialId('');
      setCantidad('');
      setConductorId('');
      setClienteId('');
      setProveedorId('');
      setPrecioUnitario('');
      setObservaciones('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear movimiento');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Registrar nuevo movimiento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
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
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="entrada"
                  checked={tipo === 'entrada'}
                  onChange={(e) => setTipo(e.target.value as 'entrada')}
                  className="mr-2"
                />
                Entrada (compra)
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="salida"
                  checked={tipo === 'salida'}
                  onChange={(e) => setTipo(e.target.value as 'salida')}
                  className="mr-2"
                />
                Salida (venta)
              </label>
            </div>
          </div>

          {/* Material */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            >
              <option value="">Seleccione un material</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.unidad})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
            <input
              type="number"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          {/* Conductor (opcional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
            <select
              value={conductorId}
              onChange={(e) => setConductorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Sin conductor --</option>
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente (visible solo si tipo=salida) */}
          {tipo === 'salida' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                required={tipo === 'salida'}
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Proveedor (visible solo si tipo=entrada) */}
          {tipo === 'entrada' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                required={tipo === 'entrada'}
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Precio unitario (opcional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario</label>
            <input
              type="number"
              step="0.01"
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
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
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
              disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Guardar movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}