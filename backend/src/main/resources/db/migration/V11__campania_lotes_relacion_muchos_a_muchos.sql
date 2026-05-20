-- =============================================================================
-- V11__campania_lotes_relacion_muchos_a_muchos.sql
-- Migración: Campaña → múltiples Lotes con fecha de inicio por lote.
-- Manejo de políticas RLS que dependían del campo id_lote en campania.
-- =============================================================================

-- 1. Eliminar políticas dependientes antes de borrar la columna
DROP POLICY IF EXISTS campania_owner_all ON campania;
DROP POLICY IF EXISTS actividad_owner_all ON actividad;
DROP POLICY IF EXISTS cosecha_owner_all ON cosecha;
DROP POLICY IF EXISTS gasto_fijo_owner_all ON gasto_fijo;
DROP POLICY IF EXISTS actividad_insumo_owner_all ON actividad_insumo;

-- 2. Crear la tabla de asociación campania_lote
CREATE TABLE IF NOT EXISTS campania_lote (
    id_campania_lote UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_campania      UUID NOT NULL REFERENCES campania(id_campania) ON DELETE CASCADE,
    id_lote          UUID NOT NULL REFERENCES lote(id_lote) ON DELETE CASCADE,
    fecha_inicio_lote DATE,
    UNIQUE (id_campania, id_lote)
);

-- 3. Migrar datos existentes: copiar la relación lote de cada campaña a la nueva tabla
INSERT INTO campania_lote (id_campania, id_lote, fecha_inicio_lote)
SELECT id_campania, id_lote, NULL
FROM campania
WHERE id_lote IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Eliminar la columna id_lote de la tabla campania
ALTER TABLE campania DROP COLUMN IF EXISTS id_lote;

-- 5. Recrear las políticas actualizadas para usar campania_lote

-- Campania
CREATE POLICY campania_owner_all ON campania
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campania_lote cl
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE cl.id_campania = campania.id_campania AND c.id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campania_lote cl
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE cl.id_campania = campania.id_campania AND c.id_usuario = auth.uid()
        )
    );

-- Actividad
CREATE POLICY actividad_owner_all ON actividad
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = actividad.id_campania AND c.id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = actividad.id_campania AND c.id_usuario = auth.uid()
        )
    );

-- Cosecha
CREATE POLICY cosecha_owner_all ON cosecha
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = cosecha.id_campania AND c.id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = cosecha.id_campania AND c.id_usuario = auth.uid()
        )
    );

-- Gasto Fijo
CREATE POLICY gasto_fijo_owner_all ON gasto_fijo
    FOR ALL
    TO authenticated
    USING (
        (id_campo IS NOT NULL AND EXISTS (
            SELECT 1 FROM campo c WHERE c.id_campo = gasto_fijo.id_campo AND c.id_usuario = auth.uid()
        )) OR
        (id_campania IS NOT NULL AND EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = gasto_fijo.id_campania AND c.id_usuario = auth.uid()
        ))
    )
    WITH CHECK (
        (id_campo IS NOT NULL AND EXISTS (
            SELECT 1 FROM campo c WHERE c.id_campo = gasto_fijo.id_campo AND c.id_usuario = auth.uid()
        )) OR
        (id_campania IS NOT NULL AND EXISTS (
            SELECT 1 FROM campania ca
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE ca.id_campania = gasto_fijo.id_campania AND c.id_usuario = auth.uid()
        ))
    );

-- Actividad Insumo
CREATE POLICY actividad_insumo_owner_all ON actividad_insumo
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM actividad a
            JOIN campania ca ON ca.id_campania = a.id_campania
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE a.id_actividad = actividad_insumo.id_actividad AND c.id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM actividad a
            JOIN campania ca ON ca.id_campania = a.id_campania
            JOIN campania_lote cl ON ca.id_campania = cl.id_campania
            JOIN lote l ON cl.id_lote = l.id_lote
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE a.id_actividad = actividad_insumo.id_actividad AND c.id_usuario = auth.uid()
        )
    );

-- 6. Habilitar RLS en campania_lote y añadir política
ALTER TABLE campania_lote ENABLE ROW LEVEL SECURITY;

CREATE POLICY campania_lote_owner_all ON campania_lote
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM lote l
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE l.id_lote = campania_lote.id_lote AND c.id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lote l
            JOIN campo c ON c.id_campo = l.id_campo
            WHERE l.id_lote = campania_lote.id_lote AND c.id_usuario = auth.uid()
        )
    );
