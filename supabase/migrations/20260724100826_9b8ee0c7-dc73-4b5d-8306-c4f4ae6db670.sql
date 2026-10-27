
-- Add waitlisted status
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'waitlisted';

-- Meetup proposals table
CREATE TABLE IF NOT EXISTS public.meetup_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL,
  place TEXT NOT NULL,
  meet_at TIMESTAMPTZ NOT NULL,
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetup_proposals TO authenticated;
GRANT ALL ON public.meetup_proposals TO service_role;
ALTER TABLE public.meetup_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trade participants can view proposals" ON public.meetup_proposals;
CREATE POLICY "Trade participants can view proposals"
  ON public.meetup_proposals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.from_user = auth.uid() OR o.to_user = auth.uid())));

DROP POLICY IF EXISTS "Trade participants can create proposals" ON public.meetup_proposals;
CREATE POLICY "Trade participants can create proposals"
  ON public.meetup_proposals FOR INSERT TO authenticated
  WITH CHECK (proposed_by = auth.uid() AND EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.from_user = auth.uid() OR o.to_user = auth.uid())));

DROP POLICY IF EXISTS "Trade participants can update proposals" ON public.meetup_proposals;
CREATE POLICY "Trade participants can update proposals"
  ON public.meetup_proposals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (o.from_user = auth.uid() OR o.to_user = auth.uid())));

DROP TRIGGER IF EXISTS meetup_proposals_updated ON public.meetup_proposals;
CREATE TRIGGER meetup_proposals_updated
  BEFORE UPDATE ON public.meetup_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their notifications" ON public.notifications;
CREATE POLICY "Users read their notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update their notifications" ON public.notifications;
CREATE POLICY "Users update their notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete their notifications" ON public.notifications;
CREATE POLICY "Users delete their notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'meetup_proposals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetup_proposals;
  END IF;
END $$;
