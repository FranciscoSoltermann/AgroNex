-- Actualizar RLS policy de insumo para permitir insumos de inventario general (sin id_campo asignado)
DROP POLICY IF EXISTS insumo_owner_all ON public.insumo;

CREATE POLICY insumo_owner_all ON public.insumo
  TO authenticated
  USING (
    (id_usuario = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.campo c
      WHERE c.id_campo = insumo.id_campo AND c.id_usuario = auth.uid()
    ))
  )
  WITH CHECK (
    (id_usuario = auth.uid()) OR
    (EXISTS (
      SELECT 1 FROM public.campo c
      WHERE c.id_campo = insumo.id_campo AND c.id_usuario = auth.uid()
    ))
  );
