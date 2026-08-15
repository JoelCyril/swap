ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'withheld';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_note text;