CREATE TABLE public.likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes readable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own likes" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_likes_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSE
    UPDATE public.listings SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sync_likes_count() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER likes_count_sync
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.sync_likes_count();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS inventory_default_visibility item_visibility NOT NULL DEFAULT 'public';