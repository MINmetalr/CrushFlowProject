'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// Tipo para un movimiento (basado en la respuesta de la API)
type Movimiento = {
  id: number;
  tipo: 'entrada' | 'salida';
  fecha: string;
  material: string; // nombre del material (vendrá en la respuesta si usamos el join)
  cantidad: number;
  unidad: string;
  conductor?: string;
  cliente?: string;
  proveedor?: string;
  precioUnitario?: number;
  total?: number;
  observaciones?: string;
};

export default function MovimientosList() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // últimos 30 días por defecto
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchMovimientos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reportes/periodo', {
        params: {
          fechaInicio,
          fechaFin,
        },
      });
      // La API devuelve { success: true, data: { movimientos: [...] } }
      setMovimientos(response.data.data.movimientos || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar los movimientos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar movimientos al montar el componente y cuando cambien las fechas
  useEffect(() => {
    fetchMovimientos();
  }, [fechaInicio, fechaFin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovimientos(); // recargar manualmente
  };

  if (loading && movimientos.length === 0) return <p className="text-center p-4">Cargando...</p>;

  return (
    <div>
      {/* Filtros de fecha */}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-col sm:flex-row gap-2 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Filtrar
        </button>
      </form>

      {error && <p className="text-center text-red-500 p-4">{error}</p>}

      {/* Tabla de movimientos */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">ID</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Fecha</th>
              <th className="border p-2">Material</th>
              <th className="border p-2">Cantidad</th>
              <th className="border p-2">Unidad</th>
              <th className="border p-2">Conductor</th>
              <th className="border p-2">Cliente/Proveedor</th>
              <th className="border p-2">Precio Unit.</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4">
                  No hay movimientos en este período.
                </td>
              </tr>
            ) : (
              movimientos.map((mov) => (
                <tr key={mov.id} className="text-center">
                  <td className="border p-2">{mov.id}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        mov.tipo === 'entrada'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="border p-2">{new Date(mov.fecha).toLocaleDateString('es-ES')}</td>
                  <td className="border p-2">{mov.material}</td>
                  <td className="border p-2">{mov.cantidad}</td>
                  <td className="border p-2">{mov.unidad}</td>
                  <td className="border p-2">{mov.conductor || '-'}</td>
                  <td className="border p-2">{mov.cliente || mov.proveedor || '-'}</td>
                  <td className="border p-2">{mov.precioUnitario ? `$${mov.precioUnitario}` : '-'}</td>
                  <td className="border p-2">{mov.total ? `$${mov.total}` : '-'}</td>
                  <td className="border p-2">{mov.observaciones || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}