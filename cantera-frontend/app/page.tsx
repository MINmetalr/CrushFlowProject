import Inventario from './components/Inventario';

export default function Home() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-4">Sistema de Gestión de Cantera</h1>
      <h2 className="text-xl font-semibold mb-2">Inventario Actual</h2>
      <Inventario />
    </main>
  );
}