-- Remove the overly permissive INSERT policy on notifications
-- Notifications should ONLY be created by SECURITY DEFINER triggers:
-- - notify_group_expense()
-- - notify_debt_settled()
-- - notify_group_invitation()
-- These triggers bypass RLS and can still insert notifications legitimately

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;