ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';
