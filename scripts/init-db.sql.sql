-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS cantera_db;
USE cantera_db;

-- Tabla de materiales
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    unidad ENUM('toneladas', 'm3') NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de conductores
CREATE TABLE conductores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    licencia VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios (para acceso al sistema)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'operador', 'gerente') DEFAULT 'operador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de movimientos (entradas/salidas)
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'salida') NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    material_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    unidad ENUM('toneladas', 'm3') NOT NULL, -- redundante para facilitar consultas
    conductor_id INT NULL,
    cliente_id INT NULL, -- para ventas
    proveedor_id INT NULL, -- para compras
    precio_unitario DECIMAL(10,2) NULL,
    total DECIMAL(10,2) NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materiales(id) ON DELETE RESTRICT,
    FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE SET NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX idx_movimientos_material ON movimientos(material_id);

-- Datos iniciales de ejemplo (opcional)
INSERT INTO materiales (nombre, unidad) VALUES
('Arena gruesa', 'm3'),
('Arena fina', 'm3'),
('Grava 3/4', 'm3'),
('Piedra bola', 'toneladas'),
('Base granular', 'toneladas');

INSERT INTO conductores (nombre, licencia, telefono, email) VALUES
('Juan Pérez', 'LIC-001', '3001234567', 'juan@email.com'),
('María Gómez', 'LIC-002', '3007654321', 'maria@email.com');

INSERT INTO clientes (nombre, email, telefono, direccion) VALUES
('Constructora ABC', 'ventas@constructoraabc.com', '3101234567', 'Calle 1 #2-3'),
('Inmobiliaria XYZ', 'info@xyz.com', '3207654321', 'Carrera 4 #5-6');

INSERT INTO proveedores (nombre, email, telefono, direccion) VALUES
('Minas del Norte', 'contacto@minasnorte.com', '3111234567', 'Vereda la Esperanza'),
('Triturados Ltda', 'ventas@triturados.com', '3217654321', 'Zona industrial');

-- Usuario admin por defecto (contraseña: admin123)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@cantera.com', '$2a$10$e/9XqQz9q0q9q0q9q0q9qO', 'admin');