-- Speeds up the common bulk-read update by indexing exactly the rows it changes.
-- This also keeps the notification bell responsive for accounts with a long history.
CREATE INDEX IF NOT EXISTS notifications_unread_by_user_idx
  ON public.notifications (user_id)
  WHERE read = false;
