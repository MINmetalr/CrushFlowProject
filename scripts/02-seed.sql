-- ============================================================
-- CrushFlow V2 — Datos Iniciales
-- ============================================================

-- Configuración de la empresa
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('empresa_nombre',   'Mi Empresa S.A.S.',       'Nombre de la empresa'),
('empresa_nit',      '900000000-1',              'NIT de la empresa'),
('empresa_ciudad',   'Bogotá',                   'Ciudad principal'),
('empresa_telefono', '601-0000000',              'Teléfono principal'),
('empresa_email',    'info@miempresa.com',       'Correo de contacto'),
('moneda',           'COP',                      'Moneda principal'),
('iva_porcentaje',   '19',                       'Porcentaje de IVA'),
('version',          '2.0.0',                    'Versión del sistema');

-- Departamentos
INSERT INTO departamentos (nombre, codigo, descripcion) VALUES
('Administrativo',    'ADMIN',   'Dirección y administración general'),
('Compras',           'COMPRAS', 'Gestión de proveedores y órdenes de compra'),
('Ventas',            'VENTAS',  'Gestión de clientes y órdenes de venta'),
('Gestión Humana',    'RRHH',    'Recursos humanos y nómina'),
('Finanzas',          'FIN',     'Contabilidad y finanzas'),
('Operaciones',       'OPS',     'Inventario y logística');

-- Roles
INSERT INTO roles (nombre, descripcion, departamento_id, permisos) VALUES
('superadmin', 'Acceso total al sistema', NULL,
 '["*"]'),
('admin', 'Administrador general', 1,
 '["usuarios.*","reportes.*","catalogos.*","inventario.*","compras.*","ventas.*","rrhh.*","finanzas.*","config.*"]'),
('jefe_compras', 'Jefe del departamento de compras', 2,
 '["catalogos.read","proveedores.*","compras.*","inventario.read","reportes.compras"]'),
('jefe_ventas', 'Jefe del departamento de ventas', 3,
 '["catalogos.read","clientes.*","ventas.*","inventario.read","reportes.ventas"]'),
('jefe_rrhh', 'Jefe de gestión humana', 4,
 '["empleados.*","nomina.*","reportes.rrhh","catalogos.read"]'),
('jefe_finanzas', 'Jefe de finanzas', 5,
 '["finanzas.*","reportes.*","transacciones.*"]'),
('operador', 'Operador de inventario', 6,
 '["catalogos.read","inventario.*","movimientos.*"]'),
('gerente', 'Gerente general (solo lectura + reportes)', 1,
 '["reportes.*","inventario.read","ventas.read","compras.read","rrhh.read","finanzas.read"]');

-- Usuario superadmin por defecto
-- Contraseña: Admin2024!  (cambiar en primer acceso)
INSERT INTO usuarios (nombre, email, password_hash, rol_id, departamento_id, activo) VALUES
('Administrador', 'admin@crushflow.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
 1, 1, TRUE);

-- Cuentas contables base
INSERT INTO cuentas (codigo, nombre, tipo) VALUES
('1100', 'Caja y Bancos',           'activo'),
('1300', 'Cuentas por Cobrar',      'activo'),
('1400', 'Inventario',              'activo'),
('1500', 'Activos Fijos',           'activo'),
('2100', 'Cuentas por Pagar',       'pasivo'),
('2200', 'Obligaciones Financieras','pasivo'),
('3000', 'Capital',                 'patrimonio'),
('4100', 'Ingresos por Ventas',     'ingreso'),
('4200', 'Otros Ingresos',          'ingreso'),
('5100', 'Costo de Ventas',         'gasto'),
('5200', 'Gastos de Personal',      'gasto'),
('5300', 'Gastos Operacionales',    'gasto'),
('5400', 'Gastos Financieros',      'gasto');

-- Materiales de ejemplo
INSERT INTO materiales (codigo, nombre, unidad, categoria, precio_ref, stock_min) VALUES
('MAT001', 'Arena gruesa',    'm3',        'Áridos',  45000, 50),
('MAT002', 'Arena fina',      'm3',        'Áridos',  48000, 50),
('MAT003', 'Grava 3/4',       'm3',        'Áridos',  52000, 30),
('MAT004', 'Piedra bola',     'toneladas', 'Pétreos', 38000, 20),
('MAT005', 'Base granular',   'toneladas', 'Pétreos', 35000, 40),
('MAT006', 'Concreto 3000',   'm3',        'Mezclas', 450000, 10),
('MAT007', 'Asfalto',         'toneladas', 'Mezclas', 280000, 15);

-- Conductores de ejemplo
INSERT INTO conductores (nombre, documento, licencia, tipo_licencia, telefono) VALUES
('Juan Carlos Pérez',   '12345678', 'LIC-C2-001', 'C2', '3001234567'),
('María Elena Gómez',   '87654321', 'LIC-C3-002', 'C3', '3107654321'),
('Carlos Alberto Ruiz', '11223344', 'LIC-C2-003', 'C2', '3201122334');

-- Cargos RRHH
INSERT INTO cargos (nombre, departamento_id, salario_base) VALUES
('Gerente General',         1, 8000000),
('Director Administrativo', 1, 6000000),
('Jefe de Compras',         2, 4500000),
('Analista de Compras',     2, 3000000),
('Jefe de Ventas',          3, 4500000),
('Asesor Comercial',        3, 2800000),
('Jefe de RRHH',            4, 4000000),
('Analista de Nómina',      4, 2800000),
('Contador',                5, 4200000),
('Auxiliar Contable',       5, 2500000),
('Jefe de Operaciones',     6, 4000000),
('Operario',                6, 1800000),
('Conductor',               6, 2200000);
