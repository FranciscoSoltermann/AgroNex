-- Migration V12: Crear tabla de cotizaciones para cachear precios FOB oficiales de MAGyP

CREATE TABLE cotizaciones (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    soja_fob NUMERIC(10, 2),
    maiz_fob NUMERIC(10, 2),
    trigo_fob NUMERIC(10, 2),
    girasol_fob NUMERIC(10, 2),
    sorgo_fob NUMERIC(10, 2),
    cebada_fob NUMERIC(10, 2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(fecha);
