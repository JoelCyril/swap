CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX user_follows_following_id_idx ON public.user_follows (following_id);

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their follows"
  ON public.user_follows FOR SELECT TO authenticated
  USING (auth.uid() = follower_id);

CREATE POLICY "Users can follow people"
  ON public.user_follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow people"
  ON public.user_follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);
