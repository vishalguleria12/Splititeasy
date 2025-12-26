-- Create function to notify when someone is invited to a group
CREATE OR REPLACE FUNCTION public.notify_group_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inviter_username TEXT;
  group_name TEXT;
BEGIN
  -- Get inviter username
  SELECT username INTO inviter_username FROM public.profiles WHERE id = NEW.inviter_id;
  
  -- Get group name
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Notify the invitee
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.invitee_id,
    'group_invitation',
    'Group Invitation',
    COALESCE(inviter_username, 'Someone') || ' invited you to join "' || COALESCE(group_name, 'a group') || '"',
    jsonb_build_object('group_id', NEW.group_id, 'invitation_id', NEW.id)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for group invitations
CREATE TRIGGER on_group_invitation_created
  AFTER INSERT ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_invitation();