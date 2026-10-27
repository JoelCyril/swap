
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS messages_reply_to_id_idx ON public.messages (reply_to_id)
  WHERE reply_to_id IS NOT NULL;
