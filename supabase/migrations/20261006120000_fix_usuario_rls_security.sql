-- Migración: Hardening de seguridad RLS en tabla usuario (VUL-H01)
-- Fecha: 2026-10-06
-- Revoca permisos de modificación directa sobre la tabla usuario a roles cliente (anon / authenticated).
-- Evita escalado de privilegios hacia ROLE_ADMIN o alteración de id_propietario vía PostgREST Data API.

-- 1. Revocar permisos de modificación directa
REVOKE ALL ON public.usuario FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.usuario FROM authenticated;

-- 2. Conceder únicamente lectura al rol autenticado
GRANT SELECT ON public.usuario TO authenticated;

-- 3. Eliminar la política permisiva de UPDATE propio que permitía modificar columnas críticas
DROP POLICY IF EXISTS usuario_update_own ON public.usuario;

-- 4. Asegurar que SELECT propio continúe funcionando para lectura
CREATE OR REPLACE POLICY usuario_select_own ON public.usuario
  FOR SELECT
  TO authenticated
  USING ((id_usuario = auth.uid()));
