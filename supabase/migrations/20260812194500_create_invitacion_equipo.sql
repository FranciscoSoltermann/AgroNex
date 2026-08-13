-- Migration: Create invitacion_equipo and invitacion_equipo_permisos tables
CREATE TABLE IF NOT EXISTS public.invitacion_equipo (
    id_invitacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propietario UUID NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    id_usuario_invitado UUID NOT NULL REFERENCES public.usuario(id_usuario) ON DELETE CASCADE,
    email_invitado VARCHAR(255) NOT NULL,
    rol_operativo VARCHAR(50) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    respondido_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.invitacion_equipo_permisos (
    id_invitacion UUID NOT NULL REFERENCES public.invitacion_equipo(id_invitacion) ON DELETE CASCADE,
    permiso VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitacion_propietario ON public.invitacion_equipo(id_propietario);
CREATE INDEX IF NOT EXISTS idx_invitacion_usuario_invitado ON public.invitacion_equipo(id_usuario_invitado);
CREATE INDEX IF NOT EXISTS idx_invitacion_estado ON public.invitacion_equipo(estado);
