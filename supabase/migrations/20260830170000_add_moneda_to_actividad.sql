-- Migration: add moneda column to actividad table
ALTER TABLE public.actividad ADD COLUMN IF NOT EXISTS moneda character varying(10) DEFAULT 'ARS';
