REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Likes readable by everyone" ON public.likes;
CREATE POLICY "Signed-in users read likes" ON public.likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.likes FROM anon;