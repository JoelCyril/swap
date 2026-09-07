-- Migration: Add Admin Custom Badges
CREATE TABLE IF NOT EXISTS public.custom_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  glow_color text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

GRANT SELECT ON public.custom_badges TO anon, authenticated;
GRANT ALL ON public.custom_badges TO authenticated, service_role;

ALTER TABLE public.custom_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom badges"
  ON public.custom_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins manage custom badges"
  ON public.custom_badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS custom_badges_created_at_idx ON public.custom_badges (created_at DESC);
