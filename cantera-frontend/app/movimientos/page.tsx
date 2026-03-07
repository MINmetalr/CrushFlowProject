'use client';

import { useState } from 'react';
import MovimientosList from '../components/MovimientosList';
import MovimientoModal from '../components/MovimientoModal';

export default function MovimientosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1); // fuerza recarga de MovimientosList
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600">Movimientos</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          + Nuevo Movimiento
        </button>
      </div>

      <MovimientosList key={refreshKey} />

      <MovimientoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}