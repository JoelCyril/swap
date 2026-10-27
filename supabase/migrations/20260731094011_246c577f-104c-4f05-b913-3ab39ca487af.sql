
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_urls text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements readable by everyone" ON public.announcements;
CREATE POLICY "Announcements readable by everyone"
  ON public.announcements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins create announcements" ON public.announcements;
CREATE POLICY "Admins create announcements"
  ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update announcements" ON public.announcements;
CREATE POLICY "Admins update announcements"
  ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete announcements" ON public.announcements;
CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;
CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);
