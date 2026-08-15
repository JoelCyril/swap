# Self-hosted Supabase and OAuth setup

1. Create a Supabase project you control.
2. Copy `.env.example` to `.env` and replace every placeholder with that project's values. Keep `SUPABASE_SERVICE_ROLE_KEY` in server-side hosting secrets only.
3. Link the local Supabase folder and apply the existing schema and policies:

   ```sh
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

4. In Supabase Dashboard, open **Authentication → Providers → Google**, enable it, and supply your own Google OAuth client ID and client secret.
5. Under **Authentication → URL Configuration**, add your production URL and local development URL to the redirect allow list. The application redirects Google sign-in back to its own origin.
6. Deploy with the variables from `.env.example`. For browser builds, set both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; for the TanStack Start server, set the three unprefixed Supabase variables as well.

The existing migration history is preserved so the new project receives the same database schema, storage policies, and row-level security rules. No UI assets or styles are changed by this setup.
