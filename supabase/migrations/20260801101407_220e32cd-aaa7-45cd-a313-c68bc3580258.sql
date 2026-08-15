-- 1. Profile banner
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- 2. Move sensitive personal fields out of the publicly readable profiles table
CREATE TABLE public.profile_private (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  birthday date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own private profile"
  ON public.profile_private FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profile_private_set_updated_at
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.profile_private (id, full_name, birthday)
SELECT id, full_name, birthday FROM public.profiles
WHERE full_name IS NOT NULL OR birthday IS NOT NULL;

ALTER TABLE public.profiles DROP COLUMN full_name;
ALTER TABLE public.profiles DROP COLUMN birthday;

-- 3. Remove the like feature entirely
DROP TABLE IF EXISTS public.likes;
DROP FUNCTION IF EXISTS public.sync_likes_count();
ALTER TABLE public.listings DROP COLUMN IF EXISTS likes_count;

-- 4. User bans
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  expires_at timestamptz,
  lifted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_bans_user_id_idx ON public.user_bans (user_id);
GRANT SELECT, INSERT, UPDATE ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bans, admins view all"
  ON public.user_bans FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create bans"
  ON public.user_bans FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND banned_by = auth.uid());
CREATE POLICY "Admins update bans"
  ON public.user_bans FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_bans_set_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Admin role rows are publicly readable so badges work without a privileged call
GRANT SELECT ON public.user_roles TO anon;
CREATE POLICY "Admin role rows are public"
  ON public.user_roles FOR SELECT TO anon, authenticated
  USING (role = 'admin');

-- 7. Internal SECURITY DEFINER / trigger functions must not be callable from the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 8. Stop anonymous direct reads of storage objects; signed links still work everywhere
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
CREATE POLICY "Signed-in users read avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "Signed-in users read listing images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-images');