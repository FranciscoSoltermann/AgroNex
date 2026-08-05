-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

DROP EXTENSION pg_graphql;

CREATE ROLE supabase_privileged_role;

GRANT supabase_privileged_role TO postgres;

CREATE EXTENSION citext WITH SCHEMA extensions;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.accion_audit AS ENUM (
  'CREAR',
  'ACTUALIZAR',
  'ELIMINAR',
  'INICIAR_SESION',
  'CERRAR_SESION',
  'REGISTRO',
  'EXPORTAR',
  'CAMBIO_PLAN',
  'PAGO_RECIBIDO',
  'PAGO_CANCELADO',
  'ALERTA_ENVIADA'
);

CREATE TYPE public.entidad_audit AS ENUM (
  'CAMPO',
  'LOTE',
  'CAMPANIA',
  'ACTIVIDAD',
  'ACTIVIDAD_INSUMO',
  'COSECHA',
  'INSUMO',
  'GASTO_FIJO',
  'MONITOREO_SATELITAL',
  'NOTIFICACION',
  'SUSCRIPCION',
  'USUARIO',
  'CONFIGURACION',
  'SISTEMA'
);

CREATE TYPE public.rol_usuario AS ENUM (
  'ADMIN',
  'PROPIETARIO',
  'EMPLEADO'
);

CREATE TYPE public.tipo_persona_enum AS ENUM (
  'FISICA',
  'JURIDICA'
);

CREATE TYPE public.tipopersona AS ENUM (
  'FISICA',
  'JURIDICA'
);

CREATE TYPE public.unidad_medida_enum AS ENUM (
  'KG',
  'LITROS',
  'UNIDADES',
  'TONELADAS',
  'BOLSAS'
);

CREATE SEQUENCE public.actividad_id_actividad_seq;

GRANT ALL ON SEQUENCE public.actividad_id_actividad_seq TO anon;

GRANT ALL ON SEQUENCE public.actividad_id_actividad_seq TO authenticated;

GRANT ALL ON SEQUENCE public.actividad_id_actividad_seq TO service_role;

CREATE SEQUENCE public.actividad_insumo_id_actividad_insumo_seq;

GRANT ALL ON SEQUENCE public.actividad_insumo_id_actividad_insumo_seq TO anon;

GRANT ALL ON SEQUENCE public.actividad_insumo_id_actividad_insumo_seq TO authenticated;

GRANT ALL ON SEQUENCE public.actividad_insumo_id_actividad_insumo_seq TO service_role;

CREATE SEQUENCE public.campania_id_campania_seq;

GRANT ALL ON SEQUENCE public.campania_id_campania_seq TO anon;

GRANT ALL ON SEQUENCE public.campania_id_campania_seq TO authenticated;

GRANT ALL ON SEQUENCE public.campania_id_campania_seq TO service_role;

CREATE SEQUENCE public.campo_id_campo_seq;

GRANT ALL ON SEQUENCE public.campo_id_campo_seq TO anon;

GRANT ALL ON SEQUENCE public.campo_id_campo_seq TO authenticated;

GRANT ALL ON SEQUENCE public.campo_id_campo_seq TO service_role;

CREATE SEQUENCE public.cosecha_id_cosecha_seq;

GRANT ALL ON SEQUENCE public.cosecha_id_cosecha_seq TO anon;

GRANT ALL ON SEQUENCE public.cosecha_id_cosecha_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cosecha_id_cosecha_seq TO service_role;

CREATE SEQUENCE public.cotizaciones_id_seq AS integer;

CREATE SEQUENCE public.gasto_fijo_id_gasto_seq;

GRANT ALL ON SEQUENCE public.gasto_fijo_id_gasto_seq TO anon;

GRANT ALL ON SEQUENCE public.gasto_fijo_id_gasto_seq TO authenticated;

GRANT ALL ON SEQUENCE public.gasto_fijo_id_gasto_seq TO service_role;

CREATE SEQUENCE public.insumo_id_insumo_seq;

GRANT ALL ON SEQUENCE public.insumo_id_insumo_seq TO anon;

GRANT ALL ON SEQUENCE public.insumo_id_insumo_seq TO authenticated;

GRANT ALL ON SEQUENCE public.insumo_id_insumo_seq TO service_role;

CREATE SEQUENCE public.lote_id_lote_seq;

GRANT ALL ON SEQUENCE public.lote_id_lote_seq TO anon;

GRANT ALL ON SEQUENCE public.lote_id_lote_seq TO authenticated;

GRANT ALL ON SEQUENCE public.lote_id_lote_seq TO service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE FUNCTION public.set_auditable_timestamps()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
    IF tg_op = 'INSERT' THEN
        IF NEW.creado_en IS NULL THEN
            NEW.creado_en := now();
        END IF;
        IF NEW.editado_en IS NULL THEN
            NEW.editado_en := now();
        END IF;
    ELSIF tg_op = 'UPDATE' THEN
        NEW.editado_en := now();
    END IF;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_auditable_timestamps() FROM PUBLIC;

GRANT ALL ON FUNCTION public.set_auditable_timestamps() TO service_role;

CREATE FUNCTION public.set_suscripcion_usuario_fecha_actualizacion()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_suscripcion_usuario_fecha_actualizacion() FROM PUBLIC;

GRANT ALL ON FUNCTION public.set_suscripcion_usuario_fecha_actualizacion() TO service_role;

CREATE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $function$
BEGIN
    NEW.editado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

CREATE TABLE public.actividad (
  costo_servicio     numeric(15,2),
  fecha              date                   NOT NULL,
  id_actividad       uuid                   NOT NULL,
  id_campania        uuid                   NOT NULL,
  tipo_actv          character varying(100) NOT NULL,
  hectareas_tratadas numeric(12,4),
  notas              text
);

ALTER TABLE public.actividad
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.actividad
  ADD CONSTRAINT actividad_pkey PRIMARY KEY (id_actividad);

ALTER TABLE public.actividad
  ADD CONSTRAINT chk_actividad_costo_no_neg CHECK (costo_servicio IS NULL OR costo_servicio >= 0::numeric);

ALTER TABLE public.actividad
  ADD CONSTRAINT chk_actividad_hectareas_no_neg CHECK (hectareas_tratadas IS NULL OR hectareas_tratadas >= 0::numeric);

GRANT ALL ON public.actividad TO anon;

GRANT ALL ON public.actividad TO authenticated;

GRANT ALL ON public.actividad TO service_role;

CREATE TABLE public.actividad_insumo (
  dosis_ha            numeric(10,2) NOT NULL,
  id_actividad        uuid,
  id_actividad_insumo uuid          NOT NULL,
  id_insumo           uuid,
  cantidad_consumida  numeric(12,4)
);

ALTER TABLE public.actividad_insumo
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.actividad_insumo
  ADD CONSTRAINT actividad_insumo_pkey PRIMARY KEY (id_actividad_insumo);

ALTER TABLE public.actividad_insumo
  ADD CONSTRAINT fkte4brne4sit4jpmh47ggxs099 FOREIGN KEY (id_actividad) REFERENCES public.actividad(id_actividad);

GRANT ALL ON public.actividad_insumo TO anon;

GRANT ALL ON public.actividad_insumo TO authenticated;

GRANT ALL ON public.actividad_insumo TO service_role;

CREATE TABLE public.audit_log (
  id_log         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  id_usuario     uuid,
  email_usuario  character varying(255),
  entidad        character varying(50)    NOT NULL,
  id_entidad     character varying(36),
  nombre_entidad character varying(255),
  accion         character varying(30)    NOT NULL,
  detalle        text,
  ip_cliente     character varying(45),
  ocurrido_en    timestamp with time zone DEFAULT now() NOT NULL,
  id_propietario uuid
);

ALTER TABLE public.audit_log
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id_log);

GRANT ALL ON public.audit_log TO anon;

GRANT ALL ON public.audit_log TO authenticated;

GRANT ALL ON public.audit_log TO service_role;

CREATE INDEX idx_audit_log_id_usuario ON public.audit_log (id_usuario);

CREATE INDEX idx_audit_log_entidad ON public.audit_log (entidad, id_entidad);

CREATE INDEX idx_audit_log_ocurrido_en ON public.audit_log (ocurrido_en DESC);

CREATE POLICY audit_log_deny_delete ON public.audit_log
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY audit_log_deny_insert ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY audit_log_deny_update ON public.audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT
  TO authenticated
  USING ((id_usuario = auth.uid()));

CREATE TABLE public.campania (
  fecha_fin    date,
  fecha_inicio date                   NOT NULL,
  id_campania  uuid                   NOT NULL,
  cultivo      character varying(100) NOT NULL,
  estado       character varying(20)  NOT NULL
);

ALTER TABLE public.campania
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.campania
  ADD CONSTRAINT campania_pkey PRIMARY KEY (id_campania);

ALTER TABLE public.actividad
  ADD CONSTRAINT fkcr2s06cktdj19dvq8yqf9m2em FOREIGN KEY (id_campania) REFERENCES public.campania(id_campania);

ALTER TABLE public.campania
  ADD CONSTRAINT chk_campania_estado CHECK (estado::text = ANY (ARRAY['ABIERTA'::character varying, 'CERRADA'::character varying]::text[]));

ALTER TABLE public.campania
  ADD CONSTRAINT chk_campania_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio);

GRANT ALL ON public.campania TO anon;

GRANT ALL ON public.campania TO authenticated;

GRANT ALL ON public.campania TO service_role;

CREATE TABLE public.campania_lote (
  id_campania_lote  uuid DEFAULT gen_random_uuid() NOT NULL,
  id_campania       uuid NOT NULL,
  id_lote           uuid NOT NULL,
  fecha_inicio_lote date
);

ALTER TABLE public.campania_lote
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.campania_lote
  ADD CONSTRAINT campania_lote_id_campania_fkey FOREIGN KEY (id_campania) REFERENCES public.campania(id_campania) ON DELETE CASCADE;

ALTER TABLE public.campania_lote
  ADD CONSTRAINT campania_lote_id_campania_id_lote_key UNIQUE (id_campania, id_lote);

ALTER TABLE public.campania_lote
  ADD CONSTRAINT campania_lote_pkey PRIMARY KEY (id_campania_lote);

ALTER TABLE public.campania_lote
  ADD CONSTRAINT ukjuskyop7cg1vu0hkmguk9rtmi UNIQUE (id_campania, id_lote);

GRANT ALL ON public.campania_lote TO anon;

GRANT ALL ON public.campania_lote TO authenticated;

GRANT ALL ON public.campania_lote TO service_role;

CREATE TABLE public.campo (
  superficie_total numeric(12,2)               NOT NULL,
  creado_en        timestamp(6) with time zone,
  editado_en       timestamp(6) with time zone,
  eliminado_en     timestamp(6) with time zone,
  id_campo         uuid                        NOT NULL,
  id_usuario       uuid                        NOT NULL,
  nombre           character varying(100)      NOT NULL,
  ubicacion        character varying(255),
  latitud          double precision,
  longitud         double precision
);

ALTER TABLE public.campo
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.campo
  ADD CONSTRAINT campo_pkey PRIMARY KEY (id_campo);

ALTER TABLE public.campo
  ADD CONSTRAINT chk_campo_superficie_pos CHECK (superficie_total > 0::numeric);

GRANT ALL ON public.campo TO anon;

GRANT ALL ON public.campo TO authenticated;

GRANT ALL ON public.campo TO service_role;

CREATE TRIGGER trg_set_timestamps_campo
  BEFORE INSERT OR UPDATE ON public.campo
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auditable_timestamps();

CREATE POLICY campo_owner_all ON public.campo
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.cosecha (
  fecha                           date                        NOT NULL,
  humedad_porcentaje              numeric(4,2),
  precio_venta_unitario_usd       numeric(12,2),
  rendimiento_total_qq            numeric(12,2)               NOT NULL,
  creado_en                       timestamp(6) with time zone,
  editado_en                      timestamp(6) with time zone,
  eliminado_en                    timestamp(6) with time zone,
  id_campania                     uuid                        NOT NULL,
  id_cosecha                      uuid                        NOT NULL,
  observaciones                   text,
  tipo_logistica                  character varying(20),
  flete_tercerizado_costo_total   numeric(12,2),
  flete_propio_litros_combustible numeric(10,2),
  flete_propio_precio_litro       numeric(10,2)
);

ALTER TABLE public.cosecha
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cosecha
  ADD CONSTRAINT chk_cosecha_humedad_rango CHECK (humedad_porcentaje IS NULL OR humedad_porcentaje >= 0::numeric AND humedad_porcentaje <= 100::numeric);

ALTER TABLE public.cosecha
  ADD CONSTRAINT chk_cosecha_precio_no_neg CHECK (precio_venta_unitario_usd IS NULL OR precio_venta_unitario_usd >= 0::numeric);

ALTER TABLE public.cosecha
  ADD CONSTRAINT chk_cosecha_rend_no_neg CHECK (rendimiento_total_qq >= 0::numeric);

ALTER TABLE public.cosecha
  ADD CONSTRAINT cosecha_pkey PRIMARY KEY (id_cosecha);

ALTER TABLE public.cosecha
  ADD CONSTRAINT fkrdnbrlun9x75aeawan0x8llxg FOREIGN KEY (id_campania) REFERENCES public.campania(id_campania);

GRANT ALL ON public.cosecha TO anon;

GRANT ALL ON public.cosecha TO authenticated;

GRANT ALL ON public.cosecha TO service_role;

CREATE TRIGGER trg_set_timestamps_cosecha
  BEFORE INSERT OR UPDATE ON public.cosecha
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auditable_timestamps();

CREATE TABLE public.cotizaciones (
  id          integer                     DEFAULT nextval('public.cotizaciones_id_seq'::regclass) NOT NULL,
  fecha       date                        NOT NULL,
  soja_fob    numeric(10,2),
  maiz_fob    numeric(10,2),
  trigo_fob   numeric(10,2),
  girasol_fob numeric(10,2),
  sorgo_fob   numeric(10,2),
  cebada_fob  numeric(10,2),
  updated_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER SEQUENCE public.cotizaciones_id_seq OWNED BY public.cotizaciones.id;

GRANT ALL ON SEQUENCE public.cotizaciones_id_seq TO anon;

GRANT ALL ON SEQUENCE public.cotizaciones_id_seq TO authenticated;

GRANT ALL ON SEQUENCE public.cotizaciones_id_seq TO service_role;

ALTER TABLE public.cotizaciones
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_fecha_key UNIQUE (fecha);

ALTER TABLE public.cotizaciones
  ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);

GRANT ALL ON public.cotizaciones TO anon;

GRANT ALL ON public.cotizaciones TO authenticated;

GRANT ALL ON public.cotizaciones TO service_role;

CREATE INDEX idx_cotizaciones_fecha ON public.cotizaciones (fecha);

CREATE TABLE public.flyway_schema_history (
  installed_rank integer                     NOT NULL,
  version        character varying(50),
  description    character varying(200)      NOT NULL,
  type           character varying(20)       NOT NULL,
  script         character varying(1000)     NOT NULL,
  checksum       integer,
  installed_by   character varying(100)      NOT NULL,
  installed_on   timestamp without time zone DEFAULT now() NOT NULL,
  execution_time integer                     NOT NULL,
  success        boolean                     NOT NULL
);

ALTER TABLE public.flyway_schema_history
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.flyway_schema_history
  ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);

GRANT ALL ON public.flyway_schema_history TO anon;

GRANT ALL ON public.flyway_schema_history TO authenticated;

GRANT ALL ON public.flyway_schema_history TO service_role;

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history (success);

CREATE TABLE public.gasto_fijo (
  fecha       date                   NOT NULL,
  monto_total numeric(15,2)          NOT NULL,
  moneda      character varying(10),
  id_campania uuid,
  id_campo    uuid,
  categoria   character varying(100) NOT NULL,
  descripcion text,
  id_gasto    uuid                   DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE public.gasto_fijo
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gasto_fijo
  ADD CONSTRAINT chk_gasto_monto_no_neg CHECK (monto_total >= 0::numeric);

ALTER TABLE public.gasto_fijo
  ADD CONSTRAINT fk423prct7bobr44udpa7g48hod FOREIGN KEY (id_campania) REFERENCES public.campania(id_campania);

ALTER TABLE public.gasto_fijo
  ADD CONSTRAINT fkfqt0fwsb40ng16nrl2hgwsw16 FOREIGN KEY (id_campo) REFERENCES public.campo(id_campo);

ALTER TABLE public.gasto_fijo
  ADD CONSTRAINT gasto_fijo_pkey PRIMARY KEY (id_gasto);

GRANT ALL ON public.gasto_fijo TO anon;

GRANT ALL ON public.gasto_fijo TO authenticated;

GRANT ALL ON public.gasto_fijo TO service_role;

CREATE TABLE public.insumo (
  id_insumo                 uuid                   DEFAULT gen_random_uuid() NOT NULL,
  nombre                    character varying(150) NOT NULL,
  precio_unitario           numeric(12,2)          NOT NULL,
  unidad                    character varying(50)  NOT NULL,
  cantidad                  numeric(12,2),
  id_campo                  uuid                   NOT NULL,
  alerta_stock_bajo_enviada boolean                NOT NULL,
  cantidad_inicial          numeric(12,2),
  id_campania               uuid,
  modelo                    character varying(100),
  id_lote                   uuid,
  tipo_articulo             character varying(30),
  subtipo                   character varying(80),
  peso_bolsa_kg             numeric(8,2)
);

ALTER TABLE public.insumo
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.insumo
  ADD CONSTRAINT chk_insumo_cantidad_no_neg CHECK (cantidad IS NULL OR cantidad >= 0::numeric);

ALTER TABLE public.insumo
  ADD CONSTRAINT chk_insumo_precio_no_neg CHECK (precio_unitario >= 0::numeric);

ALTER TABLE public.insumo
  ADD CONSTRAINT fki3mlqujxilvrv7j8rmhqb81hf FOREIGN KEY (id_campania) REFERENCES public.campania(id_campania);

ALTER TABLE public.insumo
  ADD CONSTRAINT fkktw6ecux4ne06tn6rfd27mt2s FOREIGN KEY (id_campo) REFERENCES public.campo(id_campo);

ALTER TABLE public.insumo
  ADD CONSTRAINT insumo_pkey PRIMARY KEY (id_insumo);

ALTER TABLE public.actividad_insumo
  ADD CONSTRAINT fkgpii3m6hj437e2rw5qtm4f5i4 FOREIGN KEY (id_insumo) REFERENCES public.insumo(id_insumo);

GRANT ALL ON public.insumo TO anon;

GRANT ALL ON public.insumo TO authenticated;

GRANT ALL ON public.insumo TO service_role;

CREATE POLICY insumo_owner_all ON public.insumo
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = insumo.id_campo) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = insumo.id_campo) AND (c.id_usuario = auth.uid())))));

CREATE TABLE public.john_deere_token (
  id            uuid                        NOT NULL,
  access_token  text                        NOT NULL,
  created_at    timestamp(6) with time zone,
  expires_at    timestamp(6) with time zone,
  id_usuario    uuid                        NOT NULL,
  refresh_token text,
  scopes        character varying(500),
  token_type    character varying(20),
  updated_at    timestamp(6) with time zone
);

ALTER TABLE public.john_deere_token
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.john_deere_token
  ADD CONSTRAINT john_deere_token_pkey PRIMARY KEY (id);

ALTER TABLE public.john_deere_token
  ADD CONSTRAINT ukj65f4lg7hvdnktdsxyywacrro UNIQUE (id_usuario);

GRANT ALL ON public.john_deere_token TO anon;

GRANT ALL ON public.john_deere_token TO authenticated;

GRANT ALL ON public.john_deere_token TO service_role;

CREATE INDEX idx_john_deere_token_usuario ON public.john_deere_token (id_usuario);

CREATE TABLE public.labor_agricola (
  id            uuid                   DEFAULT gen_random_uuid() NOT NULL,
  lote_id       uuid                   NOT NULL,
  fecha         date                   NOT NULL,
  tipo_labor    character varying(100) NOT NULL,
  producto      character varying(200),
  dosis         double precision,
  unidad        character varying(50),
  viento_kmh    double precision,
  humedad_pct   double precision,
  observaciones character varying(500)
);

ALTER TABLE public.labor_agricola
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.labor_agricola
  ADD CONSTRAINT labor_agricola_pkey PRIMARY KEY (id);

GRANT ALL ON public.labor_agricola TO anon;

GRANT ALL ON public.labor_agricola TO authenticated;

GRANT ALL ON public.labor_agricola TO service_role;

CREATE INDEX idx_labor_agricola_lote ON public.labor_agricola (lote_id);

CREATE INDEX idx_labor_agricola_fecha ON public.labor_agricola (fecha);

CREATE TABLE public.lote (
  superficie           numeric(12,2)               NOT NULL,
  creado_en            timestamp(6) with time zone,
  editado_en           timestamp(6) with time zone,
  eliminado_en         timestamp(6) with time zone,
  id_campo             uuid                        NOT NULL,
  id_lote              uuid                        NOT NULL,
  nombre               character varying(100)      NOT NULL,
  coordenadas_geo_json text,
  id_poligono_agro     character varying(100)
);

CREATE POLICY actividad_owner_all ON public.actividad
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = actividad.id_campania) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = actividad.id_campania) AND (c.id_usuario = auth.uid())))));

CREATE POLICY actividad_insumo_owner_all ON public.actividad_insumo
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((((public.actividad a
     JOIN public.campania ca ON ((ca.id_campania = a.id_campania)))
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((a.id_actividad = actividad_insumo.id_actividad) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((((public.actividad a
     JOIN public.campania ca ON ((ca.id_campania = a.id_campania)))
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((a.id_actividad = actividad_insumo.id_actividad) AND (c.id_usuario = auth.uid())))));

CREATE POLICY campania_owner_all ON public.campania
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM ((public.campania_lote cl
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((cl.id_campania = campania.id_campania) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ((public.campania_lote cl
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((cl.id_campania = campania.id_campania) AND (c.id_usuario = auth.uid())))));

CREATE POLICY campania_lote_owner_all ON public.campania_lote
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (public.lote l
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((l.id_lote = campania_lote.id_lote) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.lote l
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((l.id_lote = campania_lote.id_lote) AND (c.id_usuario = auth.uid())))));

CREATE POLICY cosecha_owner_all ON public.cosecha
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = cosecha.id_campania) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = cosecha.id_campania) AND (c.id_usuario = auth.uid())))));

CREATE POLICY gasto_fijo_owner_all ON public.gasto_fijo
  TO authenticated
  USING ((((id_campo IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = gasto_fijo.id_campo) AND (c.id_usuario = auth.uid()))))) OR ((id_campania IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = gasto_fijo.id_campania) AND (c.id_usuario = auth.uid())))))))
  WITH CHECK ((((id_campo IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = gasto_fijo.id_campo) AND (c.id_usuario = auth.uid()))))) OR ((id_campania IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (((public.campania ca
     JOIN public.campania_lote cl ON ((ca.id_campania = cl.id_campania)))
     JOIN public.lote l ON ((cl.id_lote = l.id_lote)))
     JOIN public.campo c ON ((c.id_campo = l.id_campo)))
  WHERE ((ca.id_campania = gasto_fijo.id_campania) AND (c.id_usuario = auth.uid())))))));

ALTER TABLE public.lote
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lote
  ADD CONSTRAINT chk_lote_superficie_pos CHECK (superficie > 0::numeric);

ALTER TABLE public.lote
  ADD CONSTRAINT fks0rebrlbdexhbq2jnu4oro857 FOREIGN KEY (id_campo) REFERENCES public.campo(id_campo);

ALTER TABLE public.lote
  ADD CONSTRAINT lote_pkey PRIMARY KEY (id_lote);

ALTER TABLE public.campania_lote
  ADD CONSTRAINT campania_lote_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote) ON DELETE CASCADE;

ALTER TABLE public.insumo
  ADD CONSTRAINT fkled3behf9nxuwcd73rkmx7wtw FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote);

ALTER TABLE public.labor_agricola
  ADD CONSTRAINT labor_agricola_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lote(id_lote) ON DELETE CASCADE;

GRANT ALL ON public.lote TO anon;

GRANT ALL ON public.lote TO authenticated;

GRANT ALL ON public.lote TO service_role;

CREATE TRIGGER trg_set_timestamps_lote
  BEFORE INSERT OR UPDATE ON public.lote
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auditable_timestamps();

CREATE POLICY lote_owner_all ON public.lote
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = lote.id_campo) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = lote.id_campo) AND (c.id_usuario = auth.uid())))));

CREATE TABLE public.mantenimiento_maquina (
  id                    uuid                   NOT NULL,
  horas_proximo_service double precision,
  horas_ultimo_service  double precision,
  machine_id            character varying(255) NOT NULL,
  nombre_maquina        character varying(200),
  ultima_lectura_horas  double precision,
  usuario_id            uuid                   NOT NULL
);

ALTER TABLE public.mantenimiento_maquina
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mantenimiento_maquina
  ADD CONSTRAINT mantenimiento_maquina_pkey PRIMARY KEY (id);

GRANT ALL ON public.mantenimiento_maquina TO anon;

GRANT ALL ON public.mantenimiento_maquina TO authenticated;

GRANT ALL ON public.mantenimiento_maquina TO service_role;

CREATE INDEX idx_mantenimiento_maquina_usuario ON public.mantenimiento_maquina (usuario_id);

CREATE TABLE public.mercadopago_webhook_event (
  id_evento        uuid                     DEFAULT gen_random_uuid() NOT NULL,
  event_key        character varying(512)   NOT NULL,
  event_id         character varying(80)    NOT NULL,
  request_id       character varying(120),
  signature_header text,
  creado_en        timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.mercadopago_webhook_event
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mercadopago_webhook_event
  ADD CONSTRAINT mercadopago_webhook_event_event_key_key UNIQUE (event_key);

ALTER TABLE public.mercadopago_webhook_event
  ADD CONSTRAINT mercadopago_webhook_event_pkey PRIMARY KEY (id_evento);

GRANT ALL ON public.mercadopago_webhook_event TO anon;

GRANT ALL ON public.mercadopago_webhook_event TO authenticated;

GRANT ALL ON public.mercadopago_webhook_event TO service_role;

CREATE INDEX idx_mp_webhook_event_event_id ON public.mercadopago_webhook_event (event_id);

CREATE INDEX idx_mp_webhook_event_creado_en ON public.mercadopago_webhook_event (creado_en DESC);

CREATE POLICY mercadopago_webhook_event_deny_public ON public.mercadopago_webhook_event
  TO authenticated
  USING (false);

CREATE TABLE public.monitoreo_satelital (
  id_monitoreo  uuid                  DEFAULT gen_random_uuid() NOT NULL,
  id_lote       uuid                  NOT NULL,
  fecha_imagen  date                  NOT NULL,
  valor_ndvi    numeric(4,3),
  url_mapa      text,
  nubosidad     numeric(5,2),
  tipo_satelite character varying(20)
);

ALTER TABLE public.monitoreo_satelital
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.monitoreo_satelital
  ADD CONSTRAINT monitoreo_satelital_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lote(id_lote) ON DELETE CASCADE;

ALTER TABLE public.monitoreo_satelital
  ADD CONSTRAINT monitoreo_satelital_pkey PRIMARY KEY (id_monitoreo);

GRANT ALL ON public.monitoreo_satelital TO anon;

GRANT ALL ON public.monitoreo_satelital TO authenticated;

GRANT ALL ON public.monitoreo_satelital TO service_role;

CREATE INDEX idx_monitoreo_satelital_lote ON public.monitoreo_satelital (id_lote);

CREATE TABLE public.notificacion_usuario (
  id_notificacion uuid                     DEFAULT gen_random_uuid() NOT NULL,
  id_usuario      uuid                     NOT NULL,
  titulo          character varying(180)   NOT NULL,
  mensaje         text                     NOT NULL,
  leida           boolean                  DEFAULT false NOT NULL,
  creado_en       timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.notificacion_usuario
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notificacion_usuario
  ADD CONSTRAINT notificacion_usuario_pkey PRIMARY KEY (id_notificacion);

GRANT ALL ON public.notificacion_usuario TO anon;

GRANT ALL ON public.notificacion_usuario TO authenticated;

GRANT ALL ON public.notificacion_usuario TO service_role;

CREATE INDEX idx_notificacion_usuario_creado_en ON public.notificacion_usuario (creado_en DESC);

CREATE INDEX idx_notificacion_usuario_usuario_creado ON public.notificacion_usuario (id_usuario, creado_en DESC);

CREATE INDEX idx_notificacion_usuario_usuario ON public.notificacion_usuario (id_usuario);

CREATE INDEX idx_notificacion_usuario_leida ON public.notificacion_usuario (id_usuario, leida);

CREATE INDEX idx_notificacion_usuario_id_usuario ON public.notificacion_usuario (id_usuario);

CREATE INDEX idx_notificacion_usuario_usuario_leida ON public.notificacion_usuario (id_usuario, leida);

CREATE POLICY notificacion_usuario_select_own ON public.notificacion_usuario
  FOR SELECT
  TO authenticated
  USING ((id_usuario = auth.uid()));

CREATE POLICY notificacion_usuario_update_own ON public.notificacion_usuario
  FOR UPDATE
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.persona_fisica (
  id_usuario uuid                   NOT NULL,
  apellido   character varying(255) NOT NULL,
  dni        character varying(255) NOT NULL,
  nombre     character varying(255) NOT NULL
);

ALTER TABLE public.persona_fisica
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.persona_fisica
  ADD CONSTRAINT chk_persona_fisica_dni_formato CHECK (dni::text ~ '^[0-9]{7,8}$'::text);

ALTER TABLE public.persona_fisica
  ADD CONSTRAINT persona_fisica_dni_key UNIQUE (dni);

ALTER TABLE public.persona_fisica
  ADD CONSTRAINT persona_fisica_pkey PRIMARY KEY (id_usuario);

ALTER TABLE public.persona_fisica
  ADD CONSTRAINT uk_persona_fisica_dni UNIQUE (dni);

GRANT ALL ON public.persona_fisica TO anon;

GRANT ALL ON public.persona_fisica TO authenticated;

GRANT ALL ON public.persona_fisica TO service_role;

CREATE POLICY persona_fisica_owner_all ON public.persona_fisica
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.persona_juridica (
  id_usuario   uuid                   NOT NULL,
  cuit         character varying(255) NOT NULL,
  razon_social character varying(255) NOT NULL
);

ALTER TABLE public.persona_juridica
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.persona_juridica
  ADD CONSTRAINT chk_persona_juridica_cuit_formato CHECK (cuit::text ~ '^[0-9]{11}$'::text);

ALTER TABLE public.persona_juridica
  ADD CONSTRAINT persona_juridica_cuit_key UNIQUE (cuit);

ALTER TABLE public.persona_juridica
  ADD CONSTRAINT persona_juridica_pkey PRIMARY KEY (id_usuario);

ALTER TABLE public.persona_juridica
  ADD CONSTRAINT uk_persona_juridica_cuit UNIQUE (cuit);

GRANT ALL ON public.persona_juridica TO anon;

GRANT ALL ON public.persona_juridica TO authenticated;

GRANT ALL ON public.persona_juridica TO service_role;

CREATE POLICY persona_juridica_owner_all ON public.persona_juridica
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.registro_pluviometro (
  id        uuid                   DEFAULT gen_random_uuid() NOT NULL,
  lote_id   uuid                   NOT NULL,
  fecha     date                   NOT NULL,
  mm_caidos numeric(8,2)           NOT NULL,
  notas     character varying(200)
);

ALTER TABLE public.registro_pluviometro
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.registro_pluviometro
  ADD CONSTRAINT registro_pluviometro_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.lote(id_lote) ON DELETE CASCADE;

ALTER TABLE public.registro_pluviometro
  ADD CONSTRAINT registro_pluviometro_pkey PRIMARY KEY (id);

GRANT ALL ON public.registro_pluviometro TO anon;

GRANT ALL ON public.registro_pluviometro TO authenticated;

GRANT ALL ON public.registro_pluviometro TO service_role;

CREATE INDEX idx_registro_pluviometro_lote ON public.registro_pluviometro (lote_id);

CREATE TABLE public.registros_clima (
  id_registro        uuid         NOT NULL,
  fecha              date         NOT NULL,
  precipitaciones_mm numeric(6,2),
  temp_max           numeric(5,2),
  temp_min           numeric(5,2),
  id_campo           uuid         NOT NULL
);

ALTER TABLE public.registros_clima
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.registros_clima
  ADD CONSTRAINT fk1pble1n90kqi4rmypylxaj43i FOREIGN KEY (id_campo) REFERENCES public.campo(id_campo);

ALTER TABLE public.registros_clima
  ADD CONSTRAINT registros_clima_pkey PRIMARY KEY (id_registro);

GRANT ALL ON public.registros_clima TO anon;

GRANT ALL ON public.registros_clima TO authenticated;

GRANT ALL ON public.registros_clima TO service_role;

CREATE UNIQUE INDEX uq_registros_clima_campo_fecha ON public.registros_clima (id_campo, fecha);

CREATE INDEX idx_registros_clima_campo ON public.registros_clima (id_campo);

CREATE POLICY registros_clima_owner_all ON public.registros_clima
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = registros_clima.id_campo) AND (c.id_usuario = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.campo c
  WHERE ((c.id_campo = registros_clima.id_campo) AND (c.id_usuario = auth.uid())))));

CREATE TABLE public.suscripcion_usuario (
  id_suscripcion      uuid                     DEFAULT gen_random_uuid() NOT NULL,
  id_usuario          uuid,
  email               character varying(255),
  plan                character varying(50)    NOT NULL,
  billing_cycle       character varying(20)    NOT NULL,
  preapproval_id      character varying(80)    NOT NULL,
  estado              character varying(40)    NOT NULL,
  detalle_estado      character varying(255),
  checkout_url        text,
  fecha_creacion      timestamp with time zone DEFAULT now() NOT NULL,
  fecha_actualizacion timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.suscripcion_usuario
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.suscripcion_usuario
  ADD CONSTRAINT suscripcion_usuario_pkey PRIMARY KEY (id_suscripcion);

ALTER TABLE public.suscripcion_usuario
  ADD CONSTRAINT suscripcion_usuario_preapproval_id_key UNIQUE (preapproval_id);

GRANT ALL ON public.suscripcion_usuario TO anon;

GRANT ALL ON public.suscripcion_usuario TO authenticated;

GRANT ALL ON public.suscripcion_usuario TO service_role;

CREATE INDEX idx_suscripcion_usuario_id_usuario ON public.suscripcion_usuario (id_usuario);

CREATE INDEX idx_suscripcion_usuario_email ON public.suscripcion_usuario (email);

CREATE INDEX idx_suscripcion_usuario_estado ON public.suscripcion_usuario (estado);

CREATE INDEX idx_suscripcion_usuario_preapproval_id ON public.suscripcion_usuario (preapproval_id);

CREATE INDEX idx_suscripcion_usuario_usuario ON public.suscripcion_usuario (id_usuario);

CREATE TRIGGER trg_set_suscripcion_usuario_fecha_actualizacion
  BEFORE UPDATE ON public.suscripcion_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.set_suscripcion_usuario_fecha_actualizacion();

CREATE POLICY suscripcion_usuario_select_own ON public.suscripcion_usuario
  FOR SELECT
  TO authenticated
  USING ((id_usuario = auth.uid()));

CREATE TABLE public.usuario (
  fecha_registro timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  id_usuario     uuid                        NOT NULL,
  tipo_persona   character varying(31)       NOT NULL,
  email          character varying(255)      NOT NULL,
  rol            character varying(20)       DEFAULT 'PROPIETARIO'::character varying NOT NULL,
  id_propietario uuid,
  rol_operativo  character varying(30)
);

COMMENT ON COLUMN public.usuario.rol IS 'ADMIN = acceso total al sistema, PROPIETARIO = dueño de campos, EMPLEADO = acceso lectura';

ALTER TABLE public.usuario
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_email_key UNIQUE (email);

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);

ALTER TABLE public.campo
  ADD CONSTRAINT fkiht3wyjena6yv422hi42rqrfb FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.mantenimiento_maquina
  ADD CONSTRAINT fk5ceubnth3v8jkl1iq6qhmku1p FOREIGN KEY (usuario_id) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.notificacion_usuario
  ADD CONSTRAINT fk_notificacion_usuario_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;

ALTER TABLE public.persona_fisica
  ADD CONSTRAINT fkep9kia0c5dbino0ragrbi2ec4 FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.persona_juridica
  ADD CONSTRAINT fk3p26ch5ntu6ur4dsci5ee5oc5 FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.suscripcion_usuario
  ADD CONSTRAINT fk_suscripcion_usuario_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_id_propietario_fkey FOREIGN KEY (id_propietario) REFERENCES public.usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_rol_operativo_check
    CHECK
    (rol_operativo::text = ANY (ARRAY['AGRONOMO'::character varying, 'OPERADOR'::character varying, 'SUPERVISOR'::character varying, 'ADMINISTRATIVO'::character varying]::text[]));

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_tipo_persona_check CHECK (tipo_persona::text = ANY (ARRAY['FISICA'::character varying, 'JURIDICA'::character varying]::text[]));

GRANT ALL ON public.usuario TO anon;

GRANT ALL ON public.usuario TO authenticated;

GRANT ALL ON public.usuario TO service_role;

CREATE INDEX idx_usuario_rol ON public.usuario (rol);

CREATE INDEX idx_usuario_id_propietario ON public.usuario (id_propietario);

CREATE POLICY usuario_select_own ON public.usuario
  FOR SELECT
  TO authenticated
  USING ((id_usuario = auth.uid()));

CREATE POLICY usuario_update_own ON public.usuario
  FOR UPDATE
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.usuario_configuracion (
  id_configuracion             uuid                        NOT NULL,
  actualizado_en               timestamp(6) with time zone,
  alerta_riego_habilitada      boolean                     NOT NULL,
  cambio_climatico_habilitado  boolean                     NOT NULL,
  dos_factores_habilitado      boolean                     NOT NULL,
  email_notificaciones         character varying(255),
  pronostico_tiempo_habilitado boolean                     NOT NULL,
  stock_insumos_habilitado     boolean                     NOT NULL,
  id_usuario                   uuid                        NOT NULL,
  caida_ndvi_habilitada        boolean                     DEFAULT true NOT NULL
);

ALTER TABLE public.usuario_configuracion
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usuario_configuracion
  ADD CONSTRAINT fkftipmwodop7jcgr3ccu786xv FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.usuario_configuracion
  ADD CONSTRAINT ukocvgn5f2dwrqq14ir1t2jwteo UNIQUE (id_usuario);

ALTER TABLE public.usuario_configuracion
  ADD CONSTRAINT usuario_configuracion_pkey PRIMARY KEY (id_configuracion);

GRANT ALL ON public.usuario_configuracion TO anon;

GRANT ALL ON public.usuario_configuracion TO authenticated;

GRANT ALL ON public.usuario_configuracion TO service_role;

CREATE POLICY usuario_configuracion_owner_all ON public.usuario_configuracion
  TO authenticated
  USING ((id_usuario = auth.uid()))
  WITH CHECK ((id_usuario = auth.uid()));

CREATE TABLE public.usuario_permisos (
  id_usuario uuid                   NOT NULL,
  permiso    character varying(255)
);

ALTER TABLE public.usuario_permisos
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usuario_permisos
  ADD CONSTRAINT fkn2r0rgtjo0gaqf9qwcpvwxdhl FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);

ALTER TABLE public.usuario_permisos
  ADD CONSTRAINT usuario_permisos_permiso_check
    CHECK
    (permiso::text = ANY (ARRAY['LECTURA_CAMPOS'::character varying, 'EDICION_CAMPOS'::character varying, 'GESTION_MAQUINARIA'::character varying, 'GESTION_FINANZAS'::character
    varying, 'GESTION_INVENTARIO'::character varying]::text[]));

GRANT ALL ON public.usuario_permisos TO anon;

GRANT ALL ON public.usuario_permisos TO authenticated;

GRANT ALL ON public.usuario_permisos TO service_role;

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

CREATE SCHEMA security AUTHORIZATION postgres;

CREATE SEQUENCE security.audit_log_id_seq;

CREATE FUNCTION security.audit_row_changes()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'security'
  AS $function$
declare
    v_old jsonb;
    v_new jsonb;
    v_row_pk text;
begin
    v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
    v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

    select value
      into v_row_pk
      from jsonb_each_text(coalesce(v_new, v_old))
     where key like 'id_%'
     order by key
     limit 1;

    insert into security.audit_log (
        table_name,
        operation,
        row_pk,
        actor_uid,
        actor_email,
        client_addr,
        old_data,
        new_data
    )
    values (
        tg_table_name,
        tg_op,
        v_row_pk,
        security.current_actor_uid(),
        security.current_actor_email(),
        inet_client_addr(),
        v_old,
        v_new
    );

    return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

CREATE TRIGGER trg_audit_actividad
  AFTER INSERT OR DELETE OR UPDATE ON public.actividad
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_actividad_insumo
  AFTER INSERT OR DELETE OR UPDATE ON public.actividad_insumo
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_campania
  AFTER INSERT OR DELETE OR UPDATE ON public.campania
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_campo
  AFTER INSERT OR DELETE OR UPDATE ON public.campo
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_cosecha
  AFTER INSERT OR DELETE OR UPDATE ON public.cosecha
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_gasto_fijo
  AFTER INSERT OR DELETE OR UPDATE ON public.gasto_fijo
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_insumo
  AFTER INSERT OR DELETE OR UPDATE ON public.insumo
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_lote
  AFTER INSERT OR DELETE OR UPDATE ON public.lote
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_persona_fisica
  AFTER INSERT OR DELETE OR UPDATE ON public.persona_fisica
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_persona_juridica
  AFTER INSERT OR DELETE OR UPDATE ON public.persona_juridica
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_registros_clima
  AFTER INSERT OR DELETE OR UPDATE ON public.registros_clima
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE TRIGGER trg_audit_usuario
  AFTER INSERT OR DELETE OR UPDATE ON public.usuario
  FOR EACH ROW
  EXECUTE FUNCTION security.audit_row_changes();

CREATE FUNCTION security.current_actor_email()
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'security'
  AS $function$
DECLARE
    v_claim text;
BEGIN
    v_claim := nullif(current_setting('request.jwt.claim.email', true), '');
    IF v_claim IS NULL THEN
        v_claim := nullif(current_setting('app.user_email', true), '');
    END IF;
    RETURN v_claim;
END;
$function$;

CREATE FUNCTION security.current_actor_uid()
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public', 'security'
  AS $function$
DECLARE
    v_claim text;
BEGIN
    v_claim := nullif(current_setting('request.jwt.claim.sub', true), '');
    IF v_claim IS NULL THEN
        v_claim := nullif(current_setting('app.user_id', true), '');
    END IF;
    IF v_claim IS NULL THEN
        RETURN null;
    END IF;
    RETURN v_claim::uuid;
EXCEPTION WHEN others THEN
    RETURN null;
END;
$function$;

CREATE TABLE security.audit_log (
  id          bigint                   DEFAULT nextval('security.audit_log_id_seq'::regclass) NOT NULL,
  table_name  text                     NOT NULL,
  operation   text                     NOT NULL,
  row_pk      text,
  changed_at  timestamp with time zone DEFAULT now() NOT NULL,
  actor_uid   uuid,
  actor_email text,
  db_user     text                     DEFAULT CURRENT_USER NOT NULL,
  client_addr inet,
  txid        bigint                   DEFAULT txid_current() NOT NULL,
  old_data    jsonb,
  new_data    jsonb
);

ALTER SEQUENCE security.audit_log_id_seq OWNED BY security.audit_log.id;

ALTER TABLE security.audit_log
  ADD CONSTRAINT audit_log_operation_check CHECK (operation = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]));

ALTER TABLE security.audit_log
  ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

CREATE INDEX idx_audit_log_table_time ON security.audit_log (table_name, changed_at DESC);

CREATE INDEX idx_audit_log_actor_time ON security.audit_log (actor_uid, changed_at DESC);

CREATE VIEW security.v_audit_resumen AS SELECT id,
    changed_at,
    table_name,
    operation,
    row_pk,
    actor_uid,
    actor_email,
    db_user,
    old_data,
    new_data
   FROM security.audit_log
  ORDER BY changed_at DESC;
