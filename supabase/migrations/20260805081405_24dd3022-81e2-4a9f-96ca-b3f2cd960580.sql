ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS complete_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS received_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[];