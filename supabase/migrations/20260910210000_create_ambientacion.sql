CREATE TABLE public.ambientacion (
    id_ambientacion uuid not null default gen_random_uuid(),
    id_lote uuid not null,
    nombre varchar(100) not null,
    coordenadas_geo_json text,
    color_hex varchar(7),
    superficie numeric(12,2),
    rinde_estimado numeric(12,2),
    creado_en timestamp without time zone default CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone default CURRENT_TIMESTAMP,
    eliminado_en timestamp without time zone,
    creado_por uuid,
    actualizado_por uuid,
    eliminado_por uuid,
    constraint pk_ambientacion primary key (id_ambientacion),
    constraint fk_ambientacion_lote foreign key (id_lote) references public.lote (id_lote) on delete cascade
);

ALTER TABLE public.ambientacion ENABLE ROW LEVEL SECURITY;
