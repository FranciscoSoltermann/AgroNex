-- =============================================================================
-- V9__campania_lotes_relacion_muchos_a_muchos.sql
-- Migración: Campaña → múltiples Lotes con fecha de inicio por lote.
-- =============================================================================

-- 1. Crear la tabla de asociación campania_lote
CREATE TABLE IF NOT EXISTS campania_lote (
    id_campania_lote UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_campania      UUID NOT NULL REFERENCES campania(id_campania) ON DELETE CASCADE,
    id_lote          UUID NOT NULL REFERENCES lote(id_lote) ON DELETE CASCADE,
    fecha_inicio_lote DATE,
    UNIQUE (id_campania, id_lote)
);

-- 2. Migrar datos existentes: copiar la relación lote de cada campaña a la nueva tabla
INSERT INTO campania_lote (id_campania, id_lote, fecha_inicio_lote)
SELECT id_campania, id_lote, NULL
FROM campania
WHERE id_lote IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Eliminar la columna id_lote de la tabla campania (ya no necesaria)
ALTER TABLE campania DROP COLUMN IF EXISTS id_lote;
