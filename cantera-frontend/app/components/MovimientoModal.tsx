'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

type MovimientoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

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

  // Estados para los catálogos
  const [materiales, setMateriales] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Cargar catálogos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchCatalogos = async () => {
        setLoadingCatalogos(true);
        try {
          const [resMat, resCond, resCli, resProv] = await Promise.all([
            axios.get('/api/materiales'),
            axios.get('/api/conductores'),
            axios.get('/api/clientes'),
            axios.get('/api/proveedores'),
          ]);
          setMateriales(resMat.data.data || []);
          setConductores(resCond.data.data || []);
          setClientes(resCli.data.data || []);
          setProveedores(resProv.data.data || []);
        } catch (error) {
          console.error('Error cargando catálogos', error);
          setError('No se pudieron cargar los datos necesarios');
        } finally {
          setLoadingCatalogos(false);
        }
      };
      fetchCatalogos();
    }
  }, [isOpen]);

  // Reiniciar formulario al cerrar
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
      onSuccess();
      onClose();
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

        {loadingCatalogos && <p className="text-center p-4">Cargando datos necesarios...</p>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loadingCatalogos && (
          <form onSubmit={handleSubmit}>
            {/* Tipo */}
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
                {materiales.map(m => (
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

            {/* Conductor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Conductor (opcional)</label>
              <select
                value={conductorId}
                onChange={(e) => setConductorId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value={0}>Sin conductor</option>
                {conductores.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cliente/Proveedor según tipo */}
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
                  {clientes.map(c => (
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
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Precio unitario */}
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
        )}
      </div>
    </div>
  );
}