ALTER TABLE public.messages
  ADD COLUMN reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

CREATE INDEX messages_reply_to_id_idx ON public.messages (reply_to_id)
  WHERE reply_to_id IS NOT NULL;
