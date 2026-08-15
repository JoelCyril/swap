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