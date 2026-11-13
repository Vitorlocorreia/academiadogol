-- Migration: Add schedules column to fixed_contracts
-- Permite que um único contrato de mensalista / escolinha tenha múltiplos horários e dias da semana (múltiplas peladas)

ALTER TABLE public.fixed_contracts
ADD COLUMN IF NOT EXISTS schedules jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.fixed_contracts.schedules IS 'Lista consolidada de horários/peladas associados a este contrato: [{field_id, day_of_week, start_time, end_time, duration_minutes}]';
