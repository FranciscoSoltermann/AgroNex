ALTER TABLE public.insumo ADD COLUMN IF NOT EXISTS id_usuario uuid;
ALTER TABLE public.insumo DROP CONSTRAINT IF EXISTS fk_insumo_usuario;
ALTER TABLE public.insumo ADD CONSTRAINT fk_insumo_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

UPDATE public.insumo
SET id_usuario = c.id_usuario
FROM public.campo c
WHERE public.insumo.id_campo = c.id_campo;

ALTER TABLE public.insumo ALTER COLUMN id_usuario SET NOT NULL;
ALTER TABLE public.insumo ALTER COLUMN id_campo DROP NOT NULL;
