-- Drop existing foreign keys that reference auth.users
ALTER TABLE public.group_invitations 
DROP CONSTRAINT IF EXISTS group_invitations_inviter_id_fkey;

ALTER TABLE public.group_invitations 
DROP CONSTRAINT IF EXISTS group_invitations_invitee_id_fkey;

-- Add new foreign keys that reference profiles
ALTER TABLE public.group_invitations 
ADD CONSTRAINT group_invitations_inviter_id_fkey 
FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.group_invitations 
ADD CONSTRAINT group_invitations_invitee_id_fkey 
FOREIGN KEY (invitee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;