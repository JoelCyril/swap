
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
