-- ========================================================
-- Schema do Banco de Dados: Academia do Gol
-- Gerado e aplicado automaticamente via Supabase MCP
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fields
CREATE TABLE IF NOT EXISTS public.fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  photo_urls text[] DEFAULT '{}'::text[],
  hourly_rate numeric(10,2) NOT NULL DEFAULT 200.00,
  duration_options integer[] DEFAULT '{60, 90, 120, 180, 240}'::integer[],
  amenities text[] DEFAULT '{}'::text[],
  deposit_type text NOT NULL DEFAULT 'fixed' CHECK (deposit_type IN ('fixed', 'percentage')),
  deposit_value numeric(10,2) NOT NULL DEFAULT 150.00,
  is_active boolean NOT NULL DEFAULT true,
  maps_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  cpf text,
  email text,
  birth_date date,
  total_bookings integer NOT NULL DEFAULT 0,
  total_spent numeric(10,2) NOT NULL DEFAULT 0.00,
  birthday_message_sent_year integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cpf text;

-- 3. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_minutes integer NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  deposit_amount numeric(10,2) NOT NULL,
  remaining_amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  deposit_status text NOT NULL DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'paid', 'refunded')),
  remaining_status text NOT NULL DEFAULT 'pending' CHECK (remaining_status IN ('pending', 'paid')),
  remaining_payment_method text CHECK (remaining_payment_method IN ('pix_manual', 'cash', 'card_machine')),
  asaas_charge_id text,
  pix_qr_code text,
  pix_copy_paste text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_field_date ON public.bookings(field_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_asaas ON public.bookings(asaas_charge_id);

-- 4. Blocked Slots
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  date date,
  start_time text NOT NULL,
  end_time text NOT NULL,
  reason text,
  is_recurring boolean NOT NULL DEFAULT false,
  recur_day_of_week integer CHECK (recur_day_of_week BETWEEN 0 AND 6),
  recur_ends_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_field_date ON public.blocked_slots(field_id, date);

-- 5. Fixed Contracts (Mensalistas)
CREATE TABLE IF NOT EXISTS public.fixed_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_minutes integer NOT NULL,
  monthly_amount numeric(10,2) NOT NULL,
  starts_at date NOT NULL,
  ends_at date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Fixed Payments (Mensalidades)
CREATE TABLE IF NOT EXISTS public.fixed_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.fixed_contracts(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixed_payments_contract ON public.fixed_payments(contract_id);

-- 7. Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'Academia do Gol',
  business_phone text DEFAULT '(81) 99909-6142',
  admin_notification_email text DEFAULT 'contato@academiadogol.com.br',
  open_time text NOT NULL DEFAULT '06:00',
  close_time text NOT NULL DEFAULT '23:00',
  days_of_week integer[] DEFAULT '{0,1,2,3,4,5,6}'::integer[],
  advance_booking_days integer NOT NULL DEFAULT 30,
  min_advance_hours integer NOT NULL DEFAULT 2,
  cancellation_hours integer NOT NULL DEFAULT 48,
  birthday_message_template text,
  push_subscriptions jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. RPC: expire_booking
CREATE OR REPLACE FUNCTION public.expire_booking(booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = booking_id
    AND status = 'pending';

  IF FOUND THEN
    v_updated := true;
  END IF;

  RETURN v_updated;
END;
$$;

-- 10b. RPC: save_booking_pix
CREATE OR REPLACE FUNCTION public.save_booking_pix(
  p_booking_id uuid,
  p_charge_id text,
  p_qr_code text,
  p_copy_paste text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.bookings
  SET asaas_charge_id = p_charge_id,
      pix_qr_code = p_qr_code,
      pix_copy_paste = p_copy_paste,
      updated_at = now()
  WHERE id = p_booking_id
    AND status = 'pending';
END;
$$;

-- 10c. RPC: confirm_booking_payment
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  UPDATE public.bookings
  SET status = 'confirmed',
      deposit_status = 'paid',
      updated_at = now()
  WHERE id = p_booking_id
    AND status = 'pending';

  IF FOUND THEN
    v_updated := true;
  END IF;

  RETURN v_updated;
END;
$$;

-- 10d. RPC: keep_alive_heartbeat
CREATE OR REPLACE FUNCTION public.keep_alive_heartbeat()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  field_count integer;
BEGIN
  SELECT count(*) INTO field_count FROM public.fields WHERE is_active = true;
  UPDATE public.settings SET updated_at = now() WHERE business_name = 'Academia do Gol';
  RETURN jsonb_build_object(
    'status', 'alive',
    'active_fields', field_count,
    'timestamp', now()
  );
END;
$$;

-- 11. Trigger de prevenção de concorrência (Race Condition / Double Booking)
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> 'cancelled' THEN
    IF EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.field_id = NEW.field_id
        AND b.date = NEW.date
        AND b.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND b.status IN ('pending', 'confirmed', 'completed')
        AND NEW.start_time < b.end_time
        AND NEW.end_time > b.start_time
    ) THEN
      RAISE EXCEPTION 'Conflito de horário: este período já está reservado para este campo.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_overlap ON public.bookings;
CREATE TRIGGER trg_prevent_booking_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_overlap();

-- RLS setup
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for fields
CREATE POLICY "Public read active fields" ON public.fields
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin write fields" ON public.fields
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for customers
CREATE POLICY "Public read/create customer" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Public insert customer" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update customer" ON public.customers
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete customer" ON public.customers
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for bookings
CREATE POLICY "Public read bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Public insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (status = 'pending' AND deposit_status = 'pending');

CREATE POLICY "Admin update bookings" ON public.bookings
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for blocked_slots
CREATE POLICY "Public read blocked slots" ON public.blocked_slots
  FOR SELECT USING (true);

CREATE POLICY "Admin write blocked slots" ON public.blocked_slots
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for fixed_contracts and fixed_payments
CREATE POLICY "Admin access fixed contracts" ON public.fixed_contracts
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin access fixed payments" ON public.fixed_payments
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for settings
CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admin update settings" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for push_subscriptions (somente Admin e Service Role)
CREATE POLICY "Admin access push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Policies for campaigns
CREATE POLICY "Admin access campaigns" ON public.campaigns
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
