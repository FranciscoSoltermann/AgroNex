-- ==============================================================================
-- Migración: Índices de rendimiento para Claves Foráneas (FK)
-- Fecha: 2026-09-11
-- Descripción:
--   Crea índices en lote(id_campo) y campania_lote(id_campania, id_lote)
--   para acelerar búsquedas relacionales y evitar Sequential Scans.
-- ==============================================================================

-- 1. Índice en tabla 'lote' para relación con 'campo'
CREATE INDEX IF NOT EXISTS idx_lote_campo ON lote (id_campo);

-- 2. Índices en tabla 'campania_lote' para relaciones con 'campania' y 'lote'
CREATE INDEX IF NOT EXISTS idx_campania_lote_campania ON campania_lote (id_campania);
CREATE INDEX IF NOT EXISTS idx_campania_lote_lote ON campania_lote (id_lote);
