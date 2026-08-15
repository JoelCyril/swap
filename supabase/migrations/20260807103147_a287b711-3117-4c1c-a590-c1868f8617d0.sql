CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "listings_select" ON public.listings;
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

CREATE POLICY "listings_select_public" ON public.listings
  FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "listings_select_auth" ON public.listings
  FOR SELECT TO authenticated
  USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));