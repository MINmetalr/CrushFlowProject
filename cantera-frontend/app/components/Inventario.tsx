'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type InventarioItem = {
  materialId: number;
  material: string;
  unidad: string;
  cantidad: number;
};

export default function Inventario() {
  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        const response = await axios.get('/api/reportes/inventario');
        // La API responde con { success: true, data: [...] }
        setData(response.data.data);
      } catch (err) {
        setError('Error al cargar el inventario');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventario();
  }, []);

  if (loading) return <p className="text-center p-4">Cargando...</p>;
  if (error) return <p className="text-center text-red-500 p-4">{error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Material</th>
            <th className="border p-2">Unidad</th>
            <th className="border p-2">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.materialId} className="text-center">
              <td className="border p-2">{item.material}</td>
              <td className="border p-2">{item.unidad}</td>
              <td className="border p-2">{item.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}