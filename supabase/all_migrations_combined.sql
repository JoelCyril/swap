-- ==============================================================================
-- ALL MIGRATIONS COMBINED (100% IDEMPOTENT)
-- ==============================================================================
-- This script safely applies all Swop database migrations in chronological order.
-- Every table, enum, policy, index, trigger, and constraint is fully idempotent:
-- it can be safely executed on a fresh database, an existing database, or re-run
-- at any time without "already exists" or "does not exist" errors.
--
-- OPTIONAL CLEAN SLATE (WARNING: Wipes all tables and data in the public schema):
-- If you want a completely fresh database reset, uncomment the 6 lines below:
--
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO anon;
-- GRANT ALL ON SCHEMA public TO authenticated;
-- GRANT ALL ON SCHEMA public TO service_role;
-- ==============================================================================


-- =============================================
-- Migration: 20260723071044_32b2be47-3c03-43d3-98fa-9694dc9f6a2b.sql
-- =============================================

-- ============= ENUMS =============

DO $$ BEGIN

  CREATE TYPE public.app_role AS ENUM ('user', 'admin');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

DO $$ BEGIN

  CREATE TYPE public.item_condition AS ENUM ('New', 'Like New', 'Good', 'Fair');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

DO $$ BEGIN

  CREATE TYPE public.item_category AS ENUM ('Electronics','Household Items','Clothing','Outdoors','Accessories','Books','Toys','Sports');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

DO $$ BEGIN

  CREATE TYPE public.item_visibility AS ENUM ('public','private');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

DO $$ BEGIN

  CREATE TYPE public.listing_status AS ENUM ('active','reserved','completed','removed');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

DO $$ BEGIN

  CREATE TYPE public.offer_status AS ENUM ('pending','accepted','declined','withdrawn','completed');

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



-- ============= UPDATED_AT helper =============

CREATE OR REPLACE FUNCTION public.set_updated_at()

RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$

BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;



-- ============= PROFILES =============

CREATE TABLE IF NOT EXISTS public.profiles (

  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  username TEXT NOT NULL UNIQUE,

  display_name TEXT NOT NULL,

  avatar_color TEXT NOT NULL DEFAULT 'oklch(0.75 0.15 55)',

  location TEXT,

  bio TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

GRANT SELECT ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



-- ============= USER ROLES =============

CREATE TABLE IF NOT EXISTS public.user_roles (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  role public.app_role NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, role)

);

GRANT SELECT ON public.user_roles TO authenticated;

GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);



CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)

RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);

$$;



-- ============= HANDLE NEW USER =============

CREATE OR REPLACE FUNCTION public.handle_new_user()

RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$

DECLARE

  base_username TEXT;

  final_username TEXT;

  suffix INT := 0;

BEGIN

  base_username := lower(regexp_replace(

    COALESCE(NEW.raw_user_meta_data->>'username',

             split_part(NEW.email, '@', 1),

             'user'),

    '[^a-z0-9_]', '', 'g'

  ));

  IF base_username = '' OR base_username IS NULL THEN base_username := 'user'; END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP

    suffix := suffix + 1;

    final_username := base_username || suffix::text;

  END LOOP;



  INSERT INTO public.profiles (id, username, display_name, avatar_color)

  VALUES (

    NEW.id,

    final_username,

    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', final_username),

    'oklch(' || (0.70 + random()*0.15)::text || ' 0.15 ' || (30 + random()*60)::text || ')'

  );



  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;

END; $$;



DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created

  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- ============= ITEMS (owner inventory) =============

CREATE TABLE IF NOT EXISTS public.items (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,

  category public.item_category NOT NULL,

  condition public.item_condition NOT NULL,

  image_emoji TEXT NOT NULL DEFAULT '📦',

  description TEXT,

  visibility public.item_visibility NOT NULL DEFAULT 'public',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

GRANT SELECT ON public.items TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;

GRANT ALL ON public.items TO service_role;

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public items visible to all" ON public.items;

CREATE POLICY "Public items visible to all" ON public.items FOR SELECT USING (visibility = 'public' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner manages items" ON public.items;

CREATE POLICY "Owner manages items" ON public.items FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS trg_items_updated ON public.items;

CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items(owner_id);



-- ============= LISTINGS =============

CREATE TABLE IF NOT EXISTS public.listings (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,

  title TEXT NOT NULL,

  description TEXT NOT NULL DEFAULT '',

  category public.item_category NOT NULL,

  condition public.item_condition NOT NULL,

  image_emoji TEXT NOT NULL DEFAULT '📦',

  location TEXT NOT NULL,

  looking_for TEXT NOT NULL DEFAULT '',

  status public.listing_status NOT NULL DEFAULT 'active',

  flags_count INT NOT NULL DEFAULT 0,

  likes_count INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

GRANT SELECT ON public.listings TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;

GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active listings public" ON public.listings;

CREATE POLICY "Active listings public" ON public.listings FOR SELECT

  USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owner inserts listings" ON public.listings;

CREATE POLICY "Owner inserts listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owner or admin updates listings" ON public.listings;

CREATE POLICY "Owner or admin updates listings" ON public.listings FOR UPDATE

  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))

  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Owner or admin deletes listings" ON public.listings;

CREATE POLICY "Owner or admin deletes listings" ON public.listings FOR DELETE

  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_listings_updated ON public.listings;

CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);



-- ============= FAVOURITES =============

CREATE TABLE IF NOT EXISTS public.favourites (

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, listing_id)

);

GRANT SELECT, INSERT, DELETE ON public.favourites TO authenticated;

GRANT ALL ON public.favourites TO service_role;

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favourites" ON public.favourites;

CREATE POLICY "Users manage own favourites" ON public.favourites FOR ALL

  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);



-- ============= OFFERS =============

CREATE TABLE IF NOT EXISTS public.offers (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  offered_item_ids UUID[] NOT NULL DEFAULT '{}',

  message TEXT NOT NULL DEFAULT '',

  status public.offer_status NOT NULL DEFAULT 'pending',

  meetup_at TIMESTAMPTZ,

  meetup_location TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;

GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view offers" ON public.offers;

CREATE POLICY "Participants view offers" ON public.offers FOR SELECT

  USING (auth.uid() = from_user OR auth.uid() = to_user OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sender creates offer" ON public.offers;

CREATE POLICY "Sender creates offer" ON public.offers FOR INSERT WITH CHECK (auth.uid() = from_user);

DROP POLICY IF EXISTS "Participants update offer" ON public.offers;

CREATE POLICY "Participants update offer" ON public.offers FOR UPDATE

  USING (auth.uid() = from_user OR auth.uid() = to_user)

  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

DROP TRIGGER IF EXISTS trg_offers_updated ON public.offers;

CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);

CREATE INDEX IF NOT EXISTS idx_offers_from ON public.offers(from_user);

CREATE INDEX IF NOT EXISTS idx_offers_to ON public.offers(to_user);



-- ============= MESSAGES =============

CREATE TABLE IF NOT EXISTS public.messages (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,

  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  body TEXT NOT NULL,

  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view messages" ON public.messages;

CREATE POLICY "Participants view messages" ON public.messages FOR SELECT

  USING (EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (auth.uid() = o.from_user OR auth.uid() = o.to_user)));

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;

CREATE POLICY "Participants send messages" ON public.messages FOR INSERT

  WITH CHECK (auth.uid() = sender_id AND EXISTS (

    SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (auth.uid() = o.from_user OR auth.uid() = o.to_user)

  ));

DROP POLICY IF EXISTS "Recipient marks read" ON public.messages;

CREATE POLICY "Recipient marks read" ON public.messages FOR UPDATE

  USING (EXISTS (SELECT 1 FROM public.offers o WHERE o.id = offer_id AND (auth.uid() = o.from_user OR auth.uid() = o.to_user)));

CREATE INDEX IF NOT EXISTS idx_messages_offer ON public.messages(offer_id, created_at);



DO $$

BEGIN

  IF NOT EXISTS (

    SELECT 1 FROM pg_publication_tables 

    WHERE pubname = 'supabase_realtime' 

      AND schemaname = 'public' 

      AND tablename = 'messages'

  ) THEN

    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

  END IF;

END $$;



ALTER TABLE public.messages REPLICA IDENTITY FULL;



-- ============= FLAGS =============

CREATE TABLE IF NOT EXISTS public.flags (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  reason TEXT NOT NULL,

  resolved BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(listing_id, reporter_id)

);

GRANT SELECT, INSERT ON public.flags TO authenticated;

GRANT ALL ON public.flags TO service_role;

ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporter or admin views flags" ON public.flags;

CREATE POLICY "Reporter or admin views flags" ON public.flags FOR SELECT

  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auth users create flags" ON public.flags;

CREATE POLICY "Auth users create flags" ON public.flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admin resolves flags" ON public.flags;

CREATE POLICY "Admin resolves flags" ON public.flags FOR UPDATE

  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));



CREATE OR REPLACE FUNCTION public.increment_flag_count()

RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$

BEGIN

  UPDATE public.listings SET flags_count = flags_count + 1 WHERE id = NEW.listing_id;

  RETURN NEW;

END; $$;

DROP TRIGGER IF EXISTS trg_flag_inc ON public.flags;

CREATE TRIGGER trg_flag_inc AFTER INSERT ON public.flags FOR EACH ROW EXECUTE FUNCTION public.increment_flag_count();

-- =============================================
-- Migration: 20260723071103_cc98fc27-2bb7-4df9-8f53-2786f8fae88e.sql
-- =============================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

-- =============================================
-- Migration: 20260723071825_44dd4a3e-6bc3-40bc-8dc8-18c7a8ae4e6d.sql
-- =============================================

DO $$ BEGIN

  ALTER TABLE public.listings ADD CONSTRAINT listings_owner_profile_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



DO $$ BEGIN

  ALTER TABLE public.items ADD CONSTRAINT items_owner_profile_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



DO $$ BEGIN

  ALTER TABLE public.offers ADD CONSTRAINT offers_from_profile_fkey FOREIGN KEY (from_user) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



DO $$ BEGIN

  ALTER TABLE public.offers ADD CONSTRAINT offers_to_profile_fkey FOREIGN KEY (to_user) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



DO $$ BEGIN

  ALTER TABLE public.messages ADD CONSTRAINT messages_sender_profile_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;



DO $$ BEGIN

  ALTER TABLE public.favourites ADD CONSTRAINT favourites_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

EXCEPTION WHEN duplicate_object THEN NULL;

END $$;

-- =============================================
-- Migration: 20260723083141_50ab50e3-2c51-498a-bf1e-36ea39fd4375.sql
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing auth users that don't have one
INSERT INTO public.profiles (id, username, display_name, avatar_color)
SELECT
  u.id,
  COALESCE(
    NULLIF(lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9_]', '', 'g')), ''),
    'user'
  ) || substr(u.id::text, 1, 6),
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'User'),
  'oklch(0.75 0.15 55)'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'user'::app_role);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users manage own avatar" ON storage.objects;
CREATE POLICY "Users manage own avatar" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
CREATE POLICY "Public read listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Users manage own listing images" ON storage.objects;
CREATE POLICY "Users manage own listing images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================
-- Migration: 20260723083155_97b331e1-ec93-4feb-a163-8a638186ab0f.sql
-- =============================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- =============================================
-- Migration: 20260723085204_7968ddaf-cd6d-488a-8387-9aa4d7142fdd.sql
-- =============================================

-- Attach handle_new_user trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing auth.users lacking one
DO $$
DECLARE
  u RECORD;
  base_username TEXT;
  final_username TEXT;
  suffix INT;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    base_username := lower(regexp_replace(
      COALESCE(u.raw_user_meta_data->>'username',
               split_part(u.email, '@', 1),
               'user'),
      '[^a-z0-9_]', '', 'g'
    ));
    IF base_username = '' OR base_username IS NULL THEN base_username := 'user'; END IF;
    final_username := base_username;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      suffix := suffix + 1;
      final_username := base_username || suffix::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, avatar_color)
    VALUES (
      u.id,
      final_username,
      COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', final_username),
      'oklch(' || (0.70 + random()*0.15)::text || ' 0.15 ' || (30 + random()*60)::text || ')'
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;

-- =============================================
-- Migration: 20260723085216_01f0a1b1-507d-4b18-972c-b9e5014268b0.sql
-- =============================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- =============================================
-- Migration: 20260724100826_9b8ee0c7-dc73-4b5d-8306-c4f4ae6db670.sql
-- =============================================

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

-- =============================================
-- Migration: 20260727145401_60ca9e81-2772-425a-8034-7f37bb12eaef.sql
-- =============================================

CREATE TABLE IF NOT EXISTS public.likes (

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, listing_id)

);

GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;

GRANT SELECT ON public.likes TO anon;

GRANT ALL ON public.likes TO service_role;

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes readable by everyone" ON public.likes;

CREATE POLICY "Likes readable by everyone" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own likes" ON public.likes;

CREATE POLICY "Users manage own likes" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users remove own likes" ON public.likes;

CREATE POLICY "Users remove own likes" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);



CREATE OR REPLACE FUNCTION public.sync_likes_count()

RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$

BEGIN

  IF TG_OP = 'INSERT' THEN

    UPDATE public.listings SET likes_count = likes_count + 1 WHERE id = NEW.listing_id;

    RETURN NEW;

  ELSE

    UPDATE public.listings SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.listing_id;

    RETURN OLD;

  END IF;

END; $$;

REVOKE EXECUTE ON FUNCTION public.sync_likes_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS likes_count_sync ON public.likes;

CREATE TRIGGER likes_count_sync

AFTER INSERT OR DELETE ON public.likes

FOR EACH ROW EXECUTE FUNCTION public.sync_likes_count();



ALTER TABLE public.profiles

  ADD COLUMN IF NOT EXISTS inventory_default_visibility item_visibility NOT NULL DEFAULT 'public';

-- =============================================
-- Migration: 20260729100631_69003b58-53c4-4117-96bd-ab6ab3976058.sql
-- =============================================

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;



DROP POLICY IF EXISTS "Likes readable by everyone" ON public.likes;

DROP POLICY IF EXISTS "Signed-in users read likes" ON public.likes;

CREATE POLICY "Signed-in users read likes" ON public.likes FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.likes FROM anon;

-- =============================================
-- Migration: 20260729101128_50a723a2-22ff-47a0-8d3d-da6b810aaf6d.sql
-- =============================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- =============================================
-- Migration: 20260730114154_380e0666-45fd-4338-9a2c-49e1cc6788b5.sql
-- =============================================

DROP POLICY IF EXISTS "Offer participants view listing" ON public.listings;

CREATE POLICY "Offer participants view listing"

ON public.listings FOR SELECT

USING (EXISTS (

  SELECT 1 FROM public.offers o

  WHERE o.listing_id = listings.id

    AND (o.from_user = auth.uid() OR o.to_user = auth.uid())

));



ALTER TABLE public.profiles

  ADD COLUMN IF NOT EXISTS full_name text,

  ADD COLUMN IF NOT EXISTS birthday date;

-- =============================================
-- Migration: 20260730115737_71d04484-bc13-4071-9ef8-21555e020911.sql
-- =============================================

DO $do$
DECLARE
  u RECORD;
  base_username TEXT;
  final_username TEXT;
  suffix INT;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    base_username := lower(regexp_replace(
      COALESCE(u.raw_user_meta_data->>'username', split_part(COALESCE(u.email, ''), '@', 1), 'user'),
      '[^a-z0-9_]', '', 'g'
    ));
    IF base_username IS NULL OR base_username = '' THEN base_username := 'user'; END IF;
    final_username := base_username;
    suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      suffix := suffix + 1;
      final_username := base_username || suffix::text;
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, avatar_color)
    VALUES (
      u.id,
      final_username,
      COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', final_username),
      'oklch(0.75 0.15 55)'
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (u.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END
$do$;

-- =============================================
-- Migration: 20260731094011_246c577f-104c-4f05-b913-3ab39ca487af.sql
-- =============================================

CREATE TABLE IF NOT EXISTS public.announcements (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  body text NOT NULL DEFAULT '',

  image_urls text[] NOT NULL DEFAULT '{}'::text[],

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()

);



GRANT SELECT ON public.announcements TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

GRANT ALL ON public.announcements TO service_role;



ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Announcements readable by everyone" ON public.announcements;

CREATE POLICY "Announcements readable by everyone"

  ON public.announcements FOR SELECT

  USING (true);



DROP POLICY IF EXISTS "Admins create announcements" ON public.announcements;

CREATE POLICY "Admins create announcements"

  ON public.announcements FOR INSERT TO authenticated

  WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));



DROP POLICY IF EXISTS "Admins update announcements" ON public.announcements;

CREATE POLICY "Admins update announcements"

  ON public.announcements FOR UPDATE TO authenticated

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));



DROP POLICY IF EXISTS "Admins delete announcements" ON public.announcements;

CREATE POLICY "Admins delete announcements"

  ON public.announcements FOR DELETE TO authenticated

  USING (public.has_role(auth.uid(), 'admin'));



DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;

CREATE TRIGGER announcements_set_updated_at

  BEFORE UPDATE ON public.announcements

  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);

-- =============================================
-- Migration: 20260801101407_220e32cd-aaa7-45cd-a313-c68bc3580258.sql
-- =============================================

-- 1. Profile banner

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;



-- 2. Move sensitive personal fields out of the publicly readable profiles table

CREATE TABLE IF NOT EXISTS public.profile_private (

  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name text,

  birthday date,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()

);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;

GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Users manage own private profile" ON public.profile_private;

CREATE POLICY "Users manage own private profile"

  ON public.profile_private FOR ALL TO authenticated

  USING (id = auth.uid()) WITH CHECK (id = auth.uid());



DROP TRIGGER IF EXISTS profile_private_set_updated_at ON public.profile_private;

CREATE TRIGGER profile_private_set_updated_at

  BEFORE UPDATE ON public.profile_private

  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



DO $$

BEGIN

  IF EXISTS (

    SELECT 1 FROM information_schema.columns 

    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'

  ) THEN

    INSERT INTO public.profile_private (id, full_name, birthday)

    SELECT id, full_name, birthday FROM public.profiles

    WHERE full_name IS NOT NULL OR birthday IS NOT NULL

    ON CONFLICT (id) DO NOTHING;

  END IF;

END $$;



ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS birthday;



-- 3. Remove the like feature entirely

DROP TABLE IF EXISTS public.likes;

DROP FUNCTION IF EXISTS public.sync_likes_count();

ALTER TABLE public.listings DROP COLUMN IF EXISTS likes_count;



-- 4. User bans

CREATE TABLE IF NOT EXISTS public.user_bans (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  banned_by uuid NOT NULL,

  reason text NOT NULL DEFAULT '',

  expires_at timestamptz,

  lifted_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS user_bans_user_id_idx ON public.user_bans (user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_bans TO authenticated;

GRANT ALL ON public.user_bans TO service_role;

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Users view own bans, admins view all" ON public.user_bans;

CREATE POLICY "Users view own bans, admins view all"

  ON public.user_bans FOR SELECT TO authenticated

  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));



DROP POLICY IF EXISTS "Admins create bans" ON public.user_bans;

CREATE POLICY "Admins create bans"

  ON public.user_bans FOR INSERT TO authenticated

  WITH CHECK (public.has_role(auth.uid(), 'admin') AND banned_by = auth.uid());



DROP POLICY IF EXISTS "Admins update bans" ON public.user_bans;

CREATE POLICY "Admins update bans"

  ON public.user_bans FOR UPDATE TO authenticated

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));



DROP TRIGGER IF EXISTS user_bans_set_updated_at ON public.user_bans;

CREATE TRIGGER user_bans_set_updated_at

  BEFORE UPDATE ON public.user_bans

  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



-- 5. Admin role rows are publicly readable so badges work without a privileged call

GRANT SELECT ON public.user_roles TO anon;

DROP POLICY IF EXISTS "Admin role rows are public" ON public.user_roles;

CREATE POLICY "Admin role rows are public"

  ON public.user_roles FOR SELECT TO anon, authenticated

  USING (role = 'admin');



-- 7. Internal SECURITY DEFINER / trigger functions must not be callable from the API

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;



-- 8. Stop anonymous direct reads of storage objects; signed links still work everywhere

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;

DROP POLICY IF EXISTS "Signed-in users read avatars" ON storage.objects;

CREATE POLICY "Signed-in users read avatars"

  ON storage.objects FOR SELECT TO authenticated

  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Signed-in users read listing images" ON storage.objects;

CREATE POLICY "Signed-in users read listing images"

  ON storage.objects FOR SELECT TO authenticated

  USING (bucket_id = 'listing-images');

-- =============================================
-- Migration: 20260802104058_dbf48f3f-efa1-489d-b481-c2bc65ef794a.sql
-- =============================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- =============================================
-- Migration: 20260804173337_e33bca7a-f57e-4f8a-8600-5df4a61c6785.sql
-- =============================================

ALTER TABLE public.profiles

  ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz,

  ADD COLUMN IF NOT EXISTS age_confirmed integer;



CREATE TABLE IF NOT EXISTS public.support_inquiries (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid,

  name text NOT NULL,

  email text NOT NULL,

  subject text NOT NULL,

  message text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()

);



GRANT INSERT ON public.support_inquiries TO anon, authenticated;

GRANT SELECT ON public.support_inquiries TO authenticated;

GRANT ALL ON public.support_inquiries TO service_role;



ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Anyone can submit an inquiry" ON public.support_inquiries;

CREATE POLICY "Anyone can submit an inquiry"

  ON public.support_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);



DROP POLICY IF EXISTS "Admins can read inquiries" ON public.support_inquiries;

CREATE POLICY "Admins can read inquiries"

  ON public.support_inquiries FOR SELECT TO authenticated

  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Migration: 20260805063556_1005ab38-dd6f-498c-8e84-2a90e2571f10.sql
-- =============================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS turn_user uuid,
  ADD COLUMN IF NOT EXISTS items_ok_from boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS items_ok_to boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.meetup_proposals
  ADD COLUMN IF NOT EXISTS safety_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- =============================================
-- Migration: 20260805073208_c07cb67e-41c6-4dca-a36c-00d67b8e0741.sql
-- =============================================

ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'withheld';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS moderation_note text;

-- =============================================
-- Migration: 20260805074429_0ca473ab-657f-4181-89ff-9da054a10c32.sql
-- =============================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS recipient_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS removed_recipient_item_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- =============================================
-- Migration: 20260805081405_24dd3022-81e2-4a9f-96ca-b3f2cd960580.sql
-- =============================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS complete_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS received_confirmed_by uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- =============================================
-- Migration: 20260805082904_36423f44-4731-447c-8ee0-ccd43fe6203a.sql
-- =============================================

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS listing_removed boolean NOT NULL DEFAULT false;

-- =============================================
-- Migration: 20260806085452_f88c186e-8331-41d8-8c0e-08fe118048b2.sql
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emirate text;



CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));



ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_urls text[] NOT NULL DEFAULT '{}';



ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS reply text;

ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS replied_at timestamptz;

ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS replied_by uuid;



DROP POLICY IF EXISTS "Users can read their own inquiries" ON public.support_inquiries;

CREATE POLICY "Users can read their own inquiries"

ON public.support_inquiries FOR SELECT TO authenticated

USING (user_id = auth.uid());



DROP POLICY IF EXISTS "Admins can reply to inquiries" ON public.support_inquiries;

CREATE POLICY "Admins can reply to inquiries"

ON public.support_inquiries FOR UPDATE TO authenticated

USING (public.has_role(auth.uid(), 'admin'))

WITH CHECK (public.has_role(auth.uid(), 'admin'));



GRANT SELECT, UPDATE ON public.support_inquiries TO authenticated;

-- =============================================
-- Migration: 20260807102819_fbedfbf7-cfbd-4b33-8829-38d262cc9f13.sql
-- =============================================

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS emirate text;

UPDATE public.listings
SET emirate = CASE
  WHEN lower(location) ~ '(abu dhabi|reem|yas island|al raha|khalifa city|corniche|bateen|saadiyat|mussafah|al ain|shakhbout|ruwais|masdar)' THEN 'Abu Dhabi'
  WHEN lower(location) ~ '(dubai|jbr|marina|palm jumeirah|jumeirah|business bay|deira|bur dubai|jlt|silicon oasis|mirdif|barsha|tecom|motor city|arabian ranches|damac|jvc)' THEN 'Dubai'
  WHEN lower(location) ~ '(sharjah|majaz|muwaileh|nahda|khan|qasimia|kalba|khor fakkan)' THEN 'Sharjah'
  WHEN lower(location) ~ '(ajman|nuaimiya|rashidiya)' THEN 'Ajman'
  WHEN lower(location) ~ '(umm al quwain|umm al quwayn|uaq)' THEN 'Umm Al Quwain'
  WHEN lower(location) ~ '(ras al khaimah|rak |al hamra|mina al arab)' THEN 'Ras Al Khaimah'
  WHEN lower(location) ~ '(fujairah|dibba)' THEN 'Fujairah'
  ELSE emirate
END
WHERE emirate IS NULL;

-- =============================================
-- Migration: 20260807102849_b2c8a3f4-c350-4244-98e8-70337075dee7.sql
-- =============================================

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- =============================================
-- Migration: 20260807102902_41f707cb-3ed8-47b1-ba26-87b8fa22ae05.sql
-- =============================================

ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

-- =============================================
-- Migration: 20260807103147_a287b711-3117-4c1c-a590-c1868f8617d0.sql
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)

RETURNS boolean

LANGUAGE sql

STABLE

SECURITY DEFINER

SET search_path = public

AS $$

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);

$$;



REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;



DROP POLICY IF EXISTS "listings_select" ON public.listings;

DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

DROP POLICY IF EXISTS "listings_select_public" ON public.listings;

DROP POLICY IF EXISTS "listings_select_auth" ON public.listings;



CREATE POLICY "listings_select_public" ON public.listings

  FOR SELECT TO anon

  USING (status = 'active');



CREATE POLICY "listings_select_auth" ON public.listings

  FOR SELECT TO authenticated

  USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- Migration: 20260807103205_be86f45f-0185-412a-a58a-780f9156e2fb.sql
-- =============================================

ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- Migration: 20260807103843_8578b7ec-d458-416a-b46f-ae00e2d4bde3.sql
-- =============================================

-- 1) Lock down user_roles writes completely for app users
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- 2) Restore the role check helper (must bypass RLS to be usable in policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 3) Internal trigger helpers should not be callable from the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_flag_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- =============================================
-- Migration: 20260807104131_92d85930-9b26-4907-9a57-d1be18610e2a.sql
-- =============================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;

-- =============================================
-- Migration: 20260807134819_61e7cdad-972c-46d4-a569-bcd4ec0b521c.sql
-- =============================================

CREATE TABLE IF NOT EXISTS public.notification_prefs (

  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  announcements boolean NOT NULL DEFAULT true,

  messages boolean NOT NULL DEFAULT true,

  saves boolean NOT NULL DEFAULT true,

  offers boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()

);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;

GRANT ALL ON public.notification_prefs TO service_role;

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "own prefs" ON public.notification_prefs;

CREATE POLICY "own prefs" ON public.notification_prefs FOR ALL TO authenticated

  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);



DROP TRIGGER IF EXISTS notification_prefs_updated ON public.notification_prefs;

CREATE TRIGGER notification_prefs_updated BEFORE UPDATE ON public.notification_prefs

  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



CREATE TABLE IF NOT EXISTS public.user_blocks (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (blocker_id, blocked_id),

  CHECK (blocker_id <> blocked_id)

);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;

GRANT ALL ON public.user_blocks TO service_role;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "blocks select own" ON public.user_blocks;

CREATE POLICY "blocks select own" ON public.user_blocks FOR SELECT TO authenticated

  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);



DROP POLICY IF EXISTS "blocks insert own" ON public.user_blocks;

CREATE POLICY "blocks insert own" ON public.user_blocks FOR INSERT TO authenticated

  WITH CHECK (auth.uid() = blocker_id);



DROP POLICY IF EXISTS "blocks delete own" ON public.user_blocks;

CREATE POLICY "blocks delete own" ON public.user_blocks FOR DELETE TO authenticated

  USING (auth.uid() = blocker_id);



CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks (blocked_id);

-- =============================================
-- Migration: 20260817120000_add_email_events.sql
-- =============================================

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



DROP POLICY IF EXISTS "Users can read own email events" ON public.email_events;

CREATE POLICY "Users can read own email events"

  ON public.email_events

  FOR SELECT

  TO authenticated

  USING (auth.uid() = user_id);

-- =============================================
-- Migration: 20260826000100_allow_reserved_listings_public_read.sql
-- =============================================

DROP POLICY IF EXISTS "listings_select_public" ON public.listings;
DROP POLICY IF EXISTS "listings_select_auth" ON public.listings;
DROP POLICY IF EXISTS "Active listings public" ON public.listings;

CREATE POLICY "listings_select_public"
  ON public.listings
  FOR SELECT
  TO anon
  USING (status IN ('active', 'reserved'));

CREATE POLICY "listings_select_auth"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    status IN ('active', 'reserved')
    OR auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================
-- Migration: 20260826000110_fix_reserved_listing_rls.sql
-- =============================================

DROP POLICY IF EXISTS "listings_select_public" ON public.listings;
DROP POLICY IF EXISTS "listings_select_auth" ON public.listings;
DROP POLICY IF EXISTS "Active listings public" ON public.listings;
DROP POLICY IF EXISTS "Offer participants view listing" ON public.listings;

CREATE POLICY "listings_select_public"
  ON public.listings
  FOR SELECT
  TO anon
  USING (status IN ('active', 'reserved'));

CREATE POLICY "listings_select_auth"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (
    status IN ('active', 'reserved')
    OR auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.offers o
      WHERE o.listing_id = listings.id
      AND (o.from_user = auth.uid() OR o.to_user = auth.uid())
    )
  );

-- =============================================
-- Migration: 20260826000200_harden_storage_upload_policies.sql
-- =============================================

DROP POLICY IF EXISTS "Users manage own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users manage own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own listing media" ON storage.objects;
DROP POLICY IF EXISTS "Users update own listing media" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own listing media" ON storage.objects;

CREATE POLICY "Users upload own avatar images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

CREATE POLICY "Users update own avatar images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

CREATE POLICY "Users delete own avatar images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users upload own listing media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm')
  );

CREATE POLICY "Users update own listing media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm')
  );

CREATE POLICY "Users delete own listing media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- Migration: 20260827090000_add_profile_interests.sql
-- =============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- =============================================
-- Migration: 20260828000100_allow_offer_participants_to_view_trade_items.sql
-- =============================================

DROP POLICY IF EXISTS "Offer participants view trade items" ON public.items;

CREATE POLICY "Offer participants view trade items"

ON public.items FOR SELECT

USING (

  visibility = 'public'

  OR auth.uid() = owner_id

  OR EXISTS (

    SELECT 1

    FROM public.offers o

    WHERE (o.from_user = auth.uid() OR o.to_user = auth.uid())

      AND (

        items.id = ANY(o.offered_item_ids)

        OR items.id = ANY(o.recipient_item_ids)

        OR items.id = ANY(o.removed_item_ids)

        OR items.id = ANY(o.removed_recipient_item_ids)

      )

  )

);

-- =============================================
-- Migration: 20260905000100_add_user_follows.sql
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_follows (

  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  created_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (follower_id, following_id),

  CHECK (follower_id <> following_id)

);



CREATE INDEX IF NOT EXISTS user_follows_following_id_idx ON public.user_follows (following_id);



GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;

GRANT ALL ON public.user_follows TO service_role;



ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Users can view their follows" ON public.user_follows;

CREATE POLICY "Users can view their follows"

  ON public.user_follows FOR SELECT TO authenticated

  USING (auth.uid() = follower_id);



DROP POLICY IF EXISTS "Users can follow people" ON public.user_follows;

CREATE POLICY "Users can follow people"

  ON public.user_follows FOR INSERT TO authenticated

  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);



DROP POLICY IF EXISTS "Users can unfollow people" ON public.user_follows;

CREATE POLICY "Users can unfollow people"

  ON public.user_follows FOR DELETE TO authenticated

  USING (auth.uid() = follower_id);

-- =============================================
-- Migration: 20260907120000_add_offer_cash_amount.sql
-- =============================================

-- Add cash_amount column to offers table for cash-enhanced and cash-only swap offers
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS cash_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.offers.cash_amount IS 'Optional monetary amount in AED offered in addition to or instead of inventory items.';

-- =============================================
-- Migration: 20260907120100_notifications_unread_lookup.sql
-- =============================================

-- Speeds up the common bulk-read update by indexing exactly the rows it changes.
-- This also keeps the notification bell responsive for accounts with a long history.
CREATE INDEX IF NOT EXISTS notifications_unread_by_user_idx
  ON public.notifications (user_id)
  WHERE read = false;

-- =============================================
-- Migration: 20260907150000_add_admin_listing_badges.sql
-- =============================================

-- Migration: Add Admin Custom Badges

CREATE TABLE IF NOT EXISTS public.custom_badges (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,

  image_url text NOT NULL,

  glow_color text DEFAULT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL

);



GRANT SELECT ON public.custom_badges TO anon, authenticated;

GRANT ALL ON public.custom_badges TO authenticated, service_role;



ALTER TABLE public.custom_badges ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Anyone can view custom badges" ON public.custom_badges;

CREATE POLICY "Anyone can view custom badges"

  ON public.custom_badges FOR SELECT

  USING (true);



DROP POLICY IF EXISTS "Admins manage custom badges" ON public.custom_badges;

CREATE POLICY "Admins manage custom badges"

  ON public.custom_badges FOR ALL TO authenticated

  USING (public.has_role(auth.uid(), 'admin'))

  WITH CHECK (public.has_role(auth.uid(), 'admin'));



CREATE INDEX IF NOT EXISTS custom_badges_created_at_idx ON public.custom_badges (created_at DESC);

-- =============================================
-- Migration: 20260907153000_add_message_replies.sql
-- =============================================

ALTER TABLE public.messages

  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;



CREATE INDEX IF NOT EXISTS messages_reply_to_id_idx ON public.messages (reply_to_id)

  WHERE reply_to_id IS NOT NULL;

-- =============================================
-- Migration: 20260907160000_reload_postgrest_schema.sql
-- =============================================

-- Ensure PostgREST immediately recognizes the messages self-reference after
-- the reply_to_id migration is applied.
NOTIFY pgrst, 'reload schema';

-- =============================================
-- Migration: 20260907210000_add_message_reactions_and_editing.sql
-- =============================================

-- Migration: Add message editing timestamp and emoji reactions
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- =============================================
-- Migration: 20260908160000_add_products_item_category.sql
-- =============================================

-- Migration: Add 'Products' to item_category enum for perfumes, cosmetics, and personal care products
ALTER TYPE public.item_category ADD VALUE IF NOT EXISTS 'Products';

-- =============================================
-- Migration: 20261001000000_add_referrals.sql
-- =============================================

-- Migration: Add referrals table for referral link tracking and leaderboard

CREATE TABLE IF NOT EXISTS public.referrals (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'joined', -- 'joined' | 'active'

  created_at timestamptz NOT NULL DEFAULT now()

);



CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);



GRANT SELECT, INSERT ON public.referrals TO authenticated;

GRANT ALL ON public.referrals TO service_role;



ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;



DROP POLICY IF EXISTS "Referrals select for participants" ON public.referrals;

CREATE POLICY "Referrals select for participants"

  ON public.referrals

  FOR SELECT

  TO authenticated

  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
