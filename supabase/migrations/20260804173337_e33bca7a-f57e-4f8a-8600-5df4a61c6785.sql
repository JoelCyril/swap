ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_confirmed integer;

CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.support_inquiries TO anon, authenticated;
GRANT SELECT ON public.support_inquiries TO authenticated;
GRANT ALL ON public.support_inquiries TO service_role;

ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry"
  ON public.support_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read inquiries"
  ON public.support_inquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));