ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS turn_user uuid,
  ADD COLUMN IF NOT EXISTS items_ok_from boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS items_ok_to boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.meetup_proposals
  ADD COLUMN IF NOT EXISTS safety_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[];