-- ============================================================
-- CrushFlow V2 — Datos Iniciales MinMetal SAS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─── Configuración de la empresa ─────────────────────────────────────────────
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('empresa_nombre',   'MinMetal SAS',          'Nombre de la empresa'),
('empresa_nit',      '900594900-7',            'NIT de la empresa'),
('empresa_ciudad',   'Luruaco',                'Ciudad principal'),
('empresa_telefono', '',                       'Teléfono principal'),
('empresa_email',    'info@minmetal.biz',      'Correo de contacto'),
('moneda',           'COP',                    'Moneda principal'),
('iva_porcentaje',   '19',                     'Porcentaje de IVA'),
('version',          '2.0.0',                  'Versión del sistema');

-- ─── Departamentos ───────────────────────────────────────────────────────────
INSERT INTO departamentos (nombre, codigo, descripcion) VALUES
('Administrativo', 'ADMIN',   'Dirección y administración general'),
('Compras',        'COMPRAS', 'Gestión de proveedores y órdenes de compra'),
('Ventas',         'VENTAS',  'Gestión de clientes y órdenes de venta'),
('Gestión Humana', 'RRHH',    'Recursos humanos y nómina'),
('Finanzas',       'FIN',     'Contabilidad y finanzas'),
('Operaciones',    'OPS',     'Inventario y logística');

-- ─── Roles ───────────────────────────────────────────────────────────────────
INSERT INTO roles (nombre, descripcion, departamento_id, permisos) VALUES
('superadmin',    'Acceso total al sistema',          NULL, '["*"]'),
('admin',         'Administrador general',             1,   '["usuarios.*","reportes.*","catalogos.*","inventario.*","compras.*","ventas.*","rrhh.*","finanzas.*","config.*"]'),
('jefe_compras',  'Jefe del departamento de compras',  2,   '["catalogos.read","proveedores.*","compras.*","inventario.read","reportes.compras"]'),
('jefe_ventas',   'Jefe del departamento de ventas',   3,   '["catalogos.read","clientes.*","ventas.*","inventario.read","reportes.ventas"]'),
('jefe_rrhh',     'Jefe de gestión humana',            4,   '["empleados.*","nomina.*","reportes.rrhh","catalogos.read"]'),
('jefe_finanzas', 'Jefe de finanzas',                  5,   '["finanzas.*","reportes.*","transacciones.*"]'),
('operador',      'Operador de inventario',            6,   '["catalogos.read","inventario.*","movimientos.*"]'),
('gerente',       'Gerente general (lectura + reportes)', 1, '["reportes.*","inventario.read","ventas.read","compras.read","rrhh.read","finanzas.read"]');

-- ─── Usuario administrador ───────────────────────────────────────────────────
-- Contraseña inicial: MinMetal2024!
-- CAMBIAR en el primer acceso al sistema
INSERT INTO usuarios (nombre, email, password_hash, rol_id, departamento_id, activo) VALUES
(
  'Eduardo Carrillo',
  'info@minmetal.biz',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  1,
  1,
  TRUE
);
-- NOTA: El hash anterior corresponde a la contraseña: password
-- Para usar "MinMetal2024!" ejecuta este UPDATE después del primer deploy:
-- UPDATE usuarios SET password_hash = '$2b$10$...' WHERE email = 'info@minmetal.biz';
-- O simplemente cambia la contraseña desde el panel de Usuarios en la app.

-- ─── Materiales MinMetal ─────────────────────────────────────────────────────
INSERT INTO materiales (codigo, nombre, unidad, categoria, precio_ref, stock_min, activo) VALUES
('MIN-001', 'Crudo',            'm3',        'Material pétreo', 0, 0, TRUE),
('MIN-002', 'Crudo',            'toneladas', 'Material pétreo', 0, 0, TRUE),
('MIN-003', 'Triturado 3/4"',   'm3',        'Triturado',       0, 0, TRUE),
('MIN-004', 'Triturado 3/4"',   'toneladas', 'Triturado',       0, 0, TRUE),
('MIN-005', 'Triturado 1/2"',   'm3',        'Triturado',       0, 0, TRUE),
('MIN-006', 'Triturado 1/2"',   'toneladas', 'Triturado',       0, 0, TRUE);

-- ─── Cuentas contables base ───────────────────────────────────────────────────
INSERT INTO cuentas (codigo, nombre, tipo) VALUES
('1100', 'Caja y Bancos',            'activo'),
('1300', 'Cuentas por Cobrar',       'activo'),
('1400', 'Inventario',               'activo'),
('1500', 'Activos Fijos',            'activo'),
('2100', 'Cuentas por Pagar',        'pasivo'),
('2200', 'Obligaciones Financieras', 'pasivo'),
('3000', 'Capital',                  'patrimonio'),
('4100', 'Ingresos por Ventas',      'ingreso'),
('4200', 'Otros Ingresos',           'ingreso'),
('5100', 'Costo de Ventas',          'gasto'),
('5200', 'Gastos de Personal',       'gasto'),
('5300', 'Gastos Operacionales',     'gasto'),
('5400', 'Gastos Financieros',       'gasto');

-- ─── Cargos MinMetal ─────────────────────────────────────────────────────────
INSERT INTO cargos (nombre, departamento_id, salario_base) VALUES
('Gerente General',         1, 0),
('Director Administrativo', 1, 0),
('Jefe de Compras',         2, 0),
('Analista de Compras',     2, 0),
('Jefe de Ventas',          3, 0),
('Asesor Comercial',        3, 0),
('Jefe de RRHH',            4, 0),
('Contador',                5, 0),
('Auxiliar Contable',       5, 0),
('Jefe de Operaciones',     6, 0),
('Operario',                6, 0),
('Conductor',               6, 0);

SET FOREIGN_KEY_CHECKS = 1;
