CREATE POLICY "Offer participants view listing"
ON public.listings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.offers o
  WHERE o.listing_id = listings.id
    AND (o.from_user = auth.uid() OR o.to_user = auth.uid())
));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS birthday date;