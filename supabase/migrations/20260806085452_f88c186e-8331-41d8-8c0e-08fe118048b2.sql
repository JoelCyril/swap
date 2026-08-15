ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emirate text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS replied_at timestamptz;
ALTER TABLE public.support_inquiries ADD COLUMN IF NOT EXISTS replied_by uuid;

CREATE POLICY "Users can read their own inquiries"
ON public.support_inquiries FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can reply to inquiries"
ON public.support_inquiries FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, UPDATE ON public.support_inquiries TO authenticated;