-- Ensure PostgREST immediately recognizes the messages self-reference after
-- the reply_to_id migration is applied.
NOTIFY pgrst, 'reload schema';
