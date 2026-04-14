-- ============================================================
-- CrushFlow V2 — Esquema Completo de Base de Datos
-- Multi-departamento: Compras, Ventas, RRHH, Finanzas, Admin
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ─── CONFIGURACIÓN EMPRESA ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  clave           VARCHAR(100) NOT NULL UNIQUE,
  valor           TEXT,
  descripcion     VARCHAR(255),
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── SISTEMA DE ACCESO ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departamentos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  codigo      VARCHAR(20)  NOT NULL UNIQUE,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(50)  NOT NULL UNIQUE,
  descripcion    VARCHAR(255),
  departamento_id INT,
  permisos       JSON NOT NULL DEFAULT ('[]'),
  activo         BOOLEAN DEFAULT TRUE,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  rol_id          INT NOT NULL,
  departamento_id INT,
  avatar_url      VARCHAR(500),
  activo          BOOLEAN DEFAULT TRUE,
  ultimo_acceso   TIMESTAMP NULL,
  refresh_token   VARCHAR(500),
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sesiones_audit (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  accion      VARCHAR(100) NOT NULL,
  entidad     VARCHAR(100),
  entidad_id  INT,
  detalle     JSON,
  ip          VARCHAR(45),
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── CATÁLOGOS BASE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materiales (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(50) UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  unidad      ENUM('toneladas','m3','kg','unidades','litros','metros') NOT NULL,
  categoria   VARCHAR(100),
  descripcion TEXT,
  precio_ref  DECIMAL(12,2) DEFAULT 0,
  stock_min   DECIMAL(10,2) DEFAULT 0,
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conductores (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(150) NOT NULL,
  documento   VARCHAR(30) UNIQUE,
  licencia    VARCHAR(50) NOT NULL UNIQUE,
  tipo_licencia VARCHAR(10) DEFAULT 'C2',
  telefono    VARCHAR(20),
  email       VARCHAR(100),
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── MÓDULO COMPRAS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30) UNIQUE,
  nombre          VARCHAR(200) NOT NULL,
  nit             VARCHAR(30) UNIQUE,
  email           VARCHAR(100),
  telefono        VARCHAR(20),
  celular         VARCHAR(20),
  direccion       TEXT,
  ciudad          VARCHAR(100),
  contacto_nombre VARCHAR(150),
  contacto_email  VARCHAR(100),
  terminos_pago   INT DEFAULT 30 COMMENT 'Días',
  calificacion    TINYINT DEFAULT 3 COMMENT '1-5',
  activo          BOOLEAN DEFAULT TRUE,
  notas           TEXT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          VARCHAR(30) NOT NULL UNIQUE,
  proveedor_id    INT NOT NULL,
  estado          ENUM('borrador','enviada','confirmada','parcial','recibida','cancelada') DEFAULT 'borrador',
  fecha_orden     DATE NOT NULL,
  fecha_entrega   DATE,
  subtotal        DECIMAL(14,2) DEFAULT 0,
  impuestos       DECIMAL(14,2) DEFAULT 0,
  total           DECIMAL(14,2) DEFAULT 0,
  notas           TEXT,
  creado_por      INT NOT NULL,
  aprobado_por    INT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (creado_por)   REFERENCES usuarios(id),
  FOREIGN KEY (aprobado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalles_orden_compra (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  orden_id        INT NOT NULL,
  material_id     INT NOT NULL,
  cantidad        DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal        DECIMAL(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  cantidad_recibida DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (orden_id)   REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materiales(id)
);

CREATE TABLE IF NOT EXISTS recepciones_compra (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  orden_id        INT NOT NULL,
  conductor_id    INT,
  fecha_recepcion DATETIME DEFAULT CURRENT_TIMESTAMP,
  notas           TEXT,
  creado_por      INT NOT NULL,
  FOREIGN KEY (orden_id)   REFERENCES ordenes_compra(id),
  FOREIGN KEY (conductor_id) REFERENCES conductores(id),
  FOREIGN KEY (creado_por)  REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalles_recepcion (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  recepcion_id    INT NOT NULL,
  detalle_oc_id   INT NOT NULL,
  cantidad_recibida DECIMAL(10,2) NOT NULL,
  notas           VARCHAR(255),
  FOREIGN KEY (recepcion_id) REFERENCES recepciones_compra(id) ON DELETE CASCADE,
  FOREIGN KEY (detalle_oc_id) REFERENCES detalles_orden_compra(id)
);

-- ─── MÓDULO VENTAS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(30) UNIQUE,
  nombre          VARCHAR(200) NOT NULL,
  nit             VARCHAR(30) UNIQUE,
  email           VARCHAR(100),
  telefono        VARCHAR(20),
  celular         VARCHAR(20),
  direccion       TEXT,
  ciudad          VARCHAR(100),
  contacto_nombre VARCHAR(150),
  terminos_pago   INT DEFAULT 0 COMMENT 'Días crédito',
  limite_credito  DECIMAL(14,2) DEFAULT 0,
  tipo            ENUM('natural','juridica') DEFAULT 'natural',
  activo          BOOLEAN DEFAULT TRUE,
  notas           TEXT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordenes_venta (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          VARCHAR(30) NOT NULL UNIQUE,
  cliente_id      INT NOT NULL,
  estado          ENUM('borrador','confirmada','en_proceso','despachada','facturada','cancelada') DEFAULT 'borrador',
  fecha_orden     DATE NOT NULL,
  fecha_entrega   DATE,
  subtotal        DECIMAL(14,2) DEFAULT 0,
  descuento       DECIMAL(14,2) DEFAULT 0,
  impuestos       DECIMAL(14,2) DEFAULT 0,
  total           DECIMAL(14,2) DEFAULT 0,
  notas           TEXT,
  conductor_id    INT,
  creado_por      INT NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id)   REFERENCES clientes(id),
  FOREIGN KEY (conductor_id) REFERENCES conductores(id),
  FOREIGN KEY (creado_por)   REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalles_orden_venta (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  orden_id        INT NOT NULL,
  material_id     INT NOT NULL,
  cantidad        DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  descuento_pct   DECIMAL(5,2) DEFAULT 0,
  subtotal        DECIMAL(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario * (1 - descuento_pct/100)) STORED,
  FOREIGN KEY (orden_id)    REFERENCES ordenes_venta(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materiales(id)
);

CREATE TABLE IF NOT EXISTS facturas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          VARCHAR(30) NOT NULL UNIQUE,
  orden_id        INT,
  cliente_id      INT NOT NULL,
  fecha_emision   DATE NOT NULL,
  fecha_vencimiento DATE,
  subtotal        DECIMAL(14,2) NOT NULL,
  impuestos       DECIMAL(14,2) DEFAULT 0,
  total           DECIMAL(14,2) NOT NULL,
  estado          ENUM('pendiente','pagada','vencida','anulada') DEFAULT 'pendiente',
  notas           TEXT,
  creado_por      INT NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id)   REFERENCES ordenes_venta(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- ─── MÓDULO INVENTARIO / MOVIMIENTOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tipo            ENUM('entrada','salida','traslado','ajuste') NOT NULL,
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  material_id     INT NOT NULL,
  cantidad        DECIMAL(10,2) NOT NULL,
  unidad          VARCHAR(20) NOT NULL,
  conductor_id    INT,
  cliente_id      INT,
  proveedor_id    INT,
  orden_venta_id  INT,
  orden_compra_id INT,
  precio_unitario DECIMAL(12,2),
  total           DECIMAL(14,2),
  placa_vehiculo  VARCHAR(20),
  guia_despacho   VARCHAR(50),
  observaciones   TEXT,
  creado_por      INT NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id)     REFERENCES materiales(id),
  FOREIGN KEY (conductor_id)    REFERENCES conductores(id),
  FOREIGN KEY (cliente_id)      REFERENCES clientes(id),
  FOREIGN KEY (proveedor_id)    REFERENCES proveedores(id),
  FOREIGN KEY (orden_venta_id)  REFERENCES ordenes_venta(id),
  FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id),
  FOREIGN KEY (creado_por)      REFERENCES usuarios(id)
);

-- Vista de stock actual
CREATE OR REPLACE VIEW stock_actual AS
SELECT
  m.id,
  m.codigo,
  m.nombre,
  m.unidad,
  m.categoria,
  m.stock_min,
  COALESCE(SUM(
    CASE WHEN mv.tipo IN ('entrada') THEN mv.cantidad
         WHEN mv.tipo IN ('salida') THEN -mv.cantidad
         WHEN mv.tipo = 'ajuste' THEN mv.cantidad
         ELSE 0 END
  ), 0) AS stock_disponible,
  CASE
    WHEN COALESCE(SUM(CASE WHEN mv.tipo='entrada' THEN mv.cantidad WHEN mv.tipo='salida' THEN -mv.cantidad ELSE mv.cantidad END),0) <= m.stock_min
    THEN 'critico'
    WHEN COALESCE(SUM(CASE WHEN mv.tipo='entrada' THEN mv.cantidad WHEN mv.tipo='salida' THEN -mv.cantidad ELSE mv.cantidad END),0) <= m.stock_min * 1.5
    THEN 'bajo'
    ELSE 'ok'
  END AS estado_stock
FROM materiales m
LEFT JOIN movimientos mv ON mv.material_id = m.id
WHERE m.activo = TRUE
GROUP BY m.id, m.codigo, m.nombre, m.unidad, m.categoria, m.stock_min;

-- ─── MÓDULO RRHH ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cargos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  departamento_id INT,
  salario_base DECIMAL(12,2) DEFAULT 0,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);

CREATE TABLE IF NOT EXISTS empleados (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(20) UNIQUE,
  nombre          VARCHAR(150) NOT NULL,
  apellido        VARCHAR(150) NOT NULL,
  documento       VARCHAR(30) NOT NULL UNIQUE,
  tipo_documento  ENUM('CC','CE','PA','NIT') DEFAULT 'CC',
  email           VARCHAR(100),
  telefono        VARCHAR(20),
  celular         VARCHAR(20),
  direccion       TEXT,
  ciudad          VARCHAR(100),
  cargo_id        INT,
  departamento_id INT,
  fecha_ingreso   DATE NOT NULL,
  fecha_retiro    DATE,
  tipo_contrato   ENUM('indefinido','fijo','obra','prestacion') DEFAULT 'indefinido',
  salario         DECIMAL(12,2) NOT NULL,
  estado          ENUM('activo','vacaciones','licencia','retirado') DEFAULT 'activo',
  banco           VARCHAR(100),
  cuenta_bancaria VARCHAR(30),
  tipo_cuenta     ENUM('ahorros','corriente') DEFAULT 'ahorros',
  usuario_id      INT UNIQUE COMMENT 'Si el empleado tiene acceso al sistema',
  notas           TEXT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id)        REFERENCES cargos(id),
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
  FOREIGN KEY (usuario_id)      REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS nomina (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id     INT NOT NULL,
  periodo         VARCHAR(7) NOT NULL COMMENT 'YYYY-MM',
  salario_base    DECIMAL(12,2) NOT NULL,
  horas_extra     DECIMAL(5,2) DEFAULT 0,
  bonificaciones  DECIMAL(12,2) DEFAULT 0,
  deducciones     DECIMAL(12,2) DEFAULT 0,
  total_pagar     DECIMAL(12,2) NOT NULL,
  estado          ENUM('borrador','aprobada','pagada') DEFAULT 'borrador',
  fecha_pago      DATE,
  notas           TEXT,
  creado_por      INT NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  FOREIGN KEY (creado_por)  REFERENCES usuarios(id),
  UNIQUE KEY uk_empleado_periodo (empleado_id, periodo)
);

-- ─── MÓDULO FINANZAS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cuentas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  nombre      VARCHAR(150) NOT NULL,
  tipo        ENUM('activo','pasivo','patrimonio','ingreso','gasto') NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transacciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          VARCHAR(30) NOT NULL UNIQUE,
  tipo            ENUM('ingreso','egreso','traslado') NOT NULL,
  cuenta_id       INT NOT NULL,
  fecha           DATE NOT NULL,
  monto           DECIMAL(14,2) NOT NULL,
  descripcion     VARCHAR(500) NOT NULL,
  referencia      VARCHAR(100) COMMENT 'Factura, OC, nómina, etc.',
  entidad         VARCHAR(100) COMMENT 'Cliente, proveedor, empleado',
  estado          ENUM('pendiente','completada','anulada') DEFAULT 'completada',
  creado_por      INT NOT NULL,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cuenta_id)  REFERENCES cuentas(id),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

-- ─── ÍNDICES DE RENDIMIENTO ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mov_fecha        ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_mov_material     ON movimientos(material_id);
CREATE INDEX IF NOT EXISTS idx_mov_tipo         ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_ov_cliente       ON ordenes_venta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ov_estado        ON ordenes_venta(estado);
CREATE INDEX IF NOT EXISTS idx_oc_proveedor     ON ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_oc_estado        ON ordenes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_trans_fecha      ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_trans_tipo       ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_emp_depto        ON empleados(departamento_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario    ON sesiones_audit(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_creado     ON sesiones_audit(creado_en);

SET FOREIGN_KEY_CHECKS = 1;
