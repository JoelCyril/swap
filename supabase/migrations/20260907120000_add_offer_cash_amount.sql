-- Add cash_amount column to offers table for cash-enhanced and cash-only swap offers
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS cash_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.offers.cash_amount IS 'Optional monetary amount in AED offered in addition to or instead of inventory items.';
