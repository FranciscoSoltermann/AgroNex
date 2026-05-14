-- Agregar columnas de tipo de artículo, subtipo y peso de bolsa al insumo

-- Agregar valor BOLSAS al enum de unidad de medida
ALTER TYPE unidad_medida_enum ADD VALUE IF NOT EXISTS 'BOLSAS';

-- Agregar columna tipo_articulo
ALTER TABLE insumo ADD COLUMN IF NOT EXISTS tipo_articulo VARCHAR(30);

-- Agregar columna subtipo
ALTER TABLE insumo ADD COLUMN IF NOT EXISTS subtipo VARCHAR(80);

-- Agregar columna peso_bolsa_kg para bolsas de semillas
ALTER TABLE insumo ADD COLUMN IF NOT EXISTS peso_bolsa_kg NUMERIC(8,2);
