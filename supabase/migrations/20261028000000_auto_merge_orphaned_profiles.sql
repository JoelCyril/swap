-- Migration: Auto-merge orphaned profiles for returning users
-- Created: 2026-10-28

CREATE OR REPLACE FUNCTION public.merge_orphaned_profile(p_old_id uuid, p_new_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_profile public.profiles%ROWTYPE;
BEGIN
  -- Verify old profile exists
  SELECT * INTO v_old_profile FROM public.profiles WHERE id = p_old_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Ensure old profile does NOT belong to an active auth.users record
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_old_id) THEN
    RAISE EXCEPTION 'Cannot merge: old profile belongs to an active auth user (%)', p_old_id;
  END IF;

  -- Ensure target new profile exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_new_id) THEN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (p_new_id, 'temp_' || substr(p_new_id::text, 1, 8), 'temp');
  END IF;

  -- 1. Transfer marketplace items and listings
  UPDATE public.items SET owner_id = p_new_id WHERE owner_id = p_old_id;
  UPDATE public.listings SET owner_id = p_new_id WHERE owner_id = p_old_id;

  -- 2. Transfer offers & messages
  UPDATE public.offers SET from_user = p_new_id WHERE from_user = p_old_id;
  UPDATE public.offers SET to_user = p_new_id WHERE to_user = p_old_id;
  UPDATE public.offers SET turn_user = p_new_id WHERE turn_user = p_old_id;
  UPDATE public.messages SET sender_id = p_new_id WHERE sender_id = p_old_id;

  -- 3. Transfer favourites, notifications, notification_prefs, announcements, follows
  UPDATE public.favourites SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.notifications SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.notification_prefs SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.announcements SET author_id = p_new_id WHERE author_id = p_old_id;
  UPDATE public.user_follows SET follower_id = p_new_id WHERE follower_id = p_old_id;
  UPDATE public.user_follows SET following_id = p_new_id WHERE following_id = p_old_id;

  -- 4. Transfer roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT p_new_id, role FROM public.user_roles WHERE user_id = p_old_id
  ON CONFLICT DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = p_old_id;

  -- 5. Transfer private details
  INSERT INTO public.profile_private (id, full_name, birthday, created_at, updated_at)
  SELECT p_new_id, full_name, birthday, created_at, updated_at FROM public.profile_private WHERE id = p_old_id
  ON CONFLICT (id) DO UPDATE 
  SET full_name = EXCLUDED.full_name, birthday = EXCLUDED.birthday;
  DELETE FROM public.profile_private WHERE id = p_old_id;

  -- 6. Temporarily rename old profile's username so we can assign it to new profile
  UPDATE public.profiles SET username = 'archived_' || substr(p_old_id::text, 1, 8) WHERE id = p_old_id;

  -- 7. Update new profile with old profile's full metadata
  UPDATE public.profiles
  SET
    username = v_old_profile.username,
    display_name = v_old_profile.display_name,
    avatar_url = COALESCE(v_old_profile.avatar_url, public.profiles.avatar_url),
    banner_url = v_old_profile.banner_url,
    avatar_color = v_old_profile.avatar_color,
    location = v_old_profile.location,
    emirate = v_old_profile.emirate,
    bio = v_old_profile.bio,
    interests = v_old_profile.interests,
    tos_accepted_at = COALESCE(v_old_profile.tos_accepted_at, now()),
    age_confirmed = COALESCE(v_old_profile.age_confirmed, 18)
  WHERE id = p_new_id;

  -- 8. Delete old profile row
  DELETE FROM public.profiles WHERE id = p_old_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
  user_email_prefix TEXT;
  google_name TEXT;
  candidate_id UUID;
BEGIN
  user_email_prefix := lower(regexp_replace(
    split_part(NEW.email, '@', 1),
    '[^a-z0-9_]', '', 'g'
  ));

  google_name := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    '[^a-z0-9_]', '', 'g'
  ));

  -- 1. Try to find an orphaned profile matching email prefix, Google name, or name tokens
  SELECT p.id INTO candidate_id
  FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)
    AND (
      p.username = user_email_prefix
      OR (google_name <> '' AND lower(regexp_replace(p.display_name, '[^a-z0-9_]', '', 'g')) = google_name)
      OR (google_name <> '' AND EXISTS (
        SELECT 1 FROM public.profile_private pp 
        WHERE pp.id = p.id 
          AND (
            lower(regexp_replace(pp.full_name, '[^a-z0-9_]', '', 'g')) = google_name
            OR (length(lower(regexp_replace(pp.full_name, '[^a-z0-9_]', '', 'g'))) >= 4 AND google_name LIKE '%' || lower(regexp_replace(pp.full_name, '[^a-z0-9_]', '', 'g')) || '%')
            OR (length(google_name) >= 4 AND lower(regexp_replace(pp.full_name, '[^a-z0-9_]', '', 'g')) LIKE '%' || google_name || '%')
          )
      ))
      OR (length(p.username) >= 4 AND user_email_prefix LIKE '%' || p.username || '%')
      OR (length(user_email_prefix) >= 4 AND p.username LIKE '%' || user_email_prefix || '%')
    )
  ORDER BY 
    CASE 
      WHEN p.username = user_email_prefix THEN 1
      WHEN google_name <> '' AND EXISTS (SELECT 1 FROM public.profile_private pp WHERE pp.id = p.id AND lower(regexp_replace(pp.full_name, '[^a-z0-9_]', '', 'g')) = google_name) THEN 2
      WHEN length(p.username) >= 4 AND user_email_prefix LIKE '%' || p.username || '%' THEN 3
      ELSE 4
    END,
    (SELECT count(*) FROM public.listings l WHERE l.owner_id = p.id) DESC
  LIMIT 1;

  -- 2. If an orphaned profile was matched, merge it!
  IF candidate_id IS NOT NULL THEN
    PERFORM public.merge_orphaned_profile(candidate_id, NEW.id);
    RETURN NEW;
  END IF;

  -- 3. Otherwise, create a new profile as normal
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

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
