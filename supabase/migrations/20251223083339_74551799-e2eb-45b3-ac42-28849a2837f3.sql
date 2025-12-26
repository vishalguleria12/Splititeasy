-- When an invitee accepts, automatically add them as a group member
CREATE OR REPLACE FUNCTION public.add_member_on_invite_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.invitee_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_invitation_accepted ON public.group_invitations;
CREATE TRIGGER on_group_invitation_accepted
AFTER UPDATE OF status ON public.group_invitations
FOR EACH ROW
EXECUTE FUNCTION public.add_member_on_invite_accept();