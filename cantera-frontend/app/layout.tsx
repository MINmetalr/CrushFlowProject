import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cantera Gestión',
  description: 'Sistema de gestión para cantera',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-100">{children}</body>
    </html>
  )
}