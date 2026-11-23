-- Adiciona colunas para rastreamento de campanhas e anúncios (UTMs)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fbclid text;

CREATE INDEX IF NOT EXISTS idx_bookings_utm_source ON public.bookings(utm_source);
CREATE INDEX IF NOT EXISTS idx_bookings_utm_campaign ON public.bookings(utm_campaign);
