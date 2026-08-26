DROP POLICY IF EXISTS "listings_select_public" ON public.listings;
DROP POLICY IF EXISTS "listings_select_auth" ON public.listings;
DROP POLICY IF EXISTS "Active listings public" ON public.listings;

CREATE POLICY "listings_select_public"
  ON public.listings
  FOR SELECT
  TO anon
  USING (status IN ('active', 'reserved'));

CREATE POLICY "listings_select_auth"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    status IN ('active', 'reserved')
    OR auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin')
  );
