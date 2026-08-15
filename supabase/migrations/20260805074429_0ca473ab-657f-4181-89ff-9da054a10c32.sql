ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS recipient_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS removed_recipient_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];