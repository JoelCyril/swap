CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

GRANT SELECT, INSERT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email events"
  ON public.email_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
