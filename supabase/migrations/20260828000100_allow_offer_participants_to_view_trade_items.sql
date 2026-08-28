CREATE POLICY "Offer participants view trade items"
ON public.items FOR SELECT
USING (
  visibility = 'public'
  OR auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM public.offers o
    WHERE (o.from_user = auth.uid() OR o.to_user = auth.uid())
      AND (
        items.id = ANY(o.offered_item_ids)
        OR items.id = ANY(o.recipient_item_ids)
        OR items.id = ANY(o.removed_item_ids)
        OR items.id = ANY(o.removed_recipient_item_ids)
      )
  )
);
