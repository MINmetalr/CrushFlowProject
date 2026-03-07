'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Inventario' },
    { href: '/movimientos', label: 'Movimientos' },
    // Aquí puedes añadir más opciones en el futuro
  ];

  return (
    <nav className="bg-blue-600 text-white p-4">
      <ul className="flex space-x-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`hover:underline ${pathname === link.href ? 'font-bold' : ''}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}