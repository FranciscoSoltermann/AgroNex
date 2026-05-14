CREATE TABLE IF NOT EXISTS labor_agricola (
    id UUID PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lote(id_lote),
    fecha DATE NOT NULL,
    tipo_labor VARCHAR(100) NOT NULL,
    producto VARCHAR(200),
    dosis DOUBLE PRECISION,
    unidad VARCHAR(50),
    viento_kmh DOUBLE PRECISION,
    humedad_pct DOUBLE PRECISION,
    observaciones VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS registro_pluviometro (
    id UUID PRIMARY KEY,
    lote_id UUID NOT NULL REFERENCES lote(id_lote),
    fecha DATE NOT NULL,
    mm_caidos DOUBLE PRECISION NOT NULL,
    notas VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS mantenimiento_maquina (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuario(id_usuario),
    machine_id VARCHAR(255) NOT NULL,
    nombre_maquina VARCHAR(200),
    horas_ultimo_service DOUBLE PRECISION,
    horas_proximo_service DOUBLE PRECISION,
    ultima_lectura_horas DOUBLE PRECISION
);
