
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
