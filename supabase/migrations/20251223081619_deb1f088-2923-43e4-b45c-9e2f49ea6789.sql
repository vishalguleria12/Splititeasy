-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Create index for username searches
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update RLS policy for profiles to allow searching by username
DROP POLICY IF EXISTS "Users can view other profiles for invitations" ON public.profiles;

CREATE POLICY "Users can view profiles by username for invitations" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR username IS NOT NULL
);