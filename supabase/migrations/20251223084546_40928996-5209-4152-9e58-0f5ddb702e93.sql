-- Fix group_members.user_id to reference profiles instead of auth.users
-- This enables the join query: profile:profiles(username)

-- Drop existing FK to auth.users
ALTER TABLE public.group_members 
DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Add new FK to profiles
ALTER TABLE public.group_members
ADD CONSTRAINT group_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;