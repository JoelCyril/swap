
ALTER TABLE public.listings ADD CONSTRAINT listings_owner_profile_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.items ADD CONSTRAINT items_owner_profile_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD CONSTRAINT offers_from_profile_fkey FOREIGN KEY (from_user) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD CONSTRAINT offers_to_profile_fkey FOREIGN KEY (to_user) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_profile_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.favourites ADD CONSTRAINT favourites_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
