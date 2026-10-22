CREATE TABLE IF NOT EXISTS public.solicitudes_arrepentimiento (
    id bigserial not null,
    email varchar(255) not null,
    motivo varchar(1000),
    fecha_solicitud timestamp without time zone not null default CURRENT_TIMESTAMP,
    estado varchar(50) not null default 'PENDIENTE',
    codigo_comprobante varchar(64) not null,
    constraint pk_solicitudes_arrepentimiento primary key (id)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_arrepentimiento_email_estado
    ON public.solicitudes_arrepentimiento (email, estado);

ALTER TABLE public.solicitudes_arrepentimiento ENABLE ROW LEVEL SECURITY;
