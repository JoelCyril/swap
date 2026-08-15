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