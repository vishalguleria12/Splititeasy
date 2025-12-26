-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (using service role or triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Create function to notify group members when expense is added
CREATE OR REPLACE FUNCTION public.notify_group_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
  expense_creator_username TEXT;
  group_name TEXT;
BEGIN
  -- Get creator username
  SELECT username INTO expense_creator_username FROM public.profiles WHERE id = NEW.created_by;
  
  -- Get group name
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  
  -- Notify all group members except the creator
  FOR member_record IN 
    SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      member_record.user_id,
      'group_expense',
      'New Group Expense',
      COALESCE(expense_creator_username, 'Someone') || ' added "' || NEW.description || '" (' || NEW.currency || ' ' || NEW.amount || ') in ' || COALESCE(group_name, 'a group'),
      jsonb_build_object('group_id', NEW.group_id, 'expense_id', NEW.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for group expense notifications
CREATE TRIGGER on_group_expense_created
  AFTER INSERT ON public.group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_expense();

-- Create function to notify when debt is settled
CREATE OR REPLACE FUNCTION public.notify_debt_settled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payer_id UUID;
  payer_username TEXT;
  expense_record RECORD;
  group_name TEXT;
BEGIN
  -- Only trigger when is_settled changes from false to true
  IF OLD.is_settled = false AND NEW.is_settled = true THEN
    -- Get expense details
    SELECT * INTO expense_record FROM public.group_expenses WHERE id = NEW.expense_id;
    
    -- Get group name
    SELECT name INTO group_name FROM public.groups WHERE id = expense_record.group_id;
    
    -- Get the settler's username
    SELECT username INTO payer_username FROM public.profiles WHERE id = NEW.user_id;
    
    -- Notify the person who was owed (the payer of the expense)
    IF expense_record.paid_by != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        expense_record.paid_by,
        'debt_settled',
        'Debt Settled',
        COALESCE(payer_username, 'Someone') || ' settled ' || expense_record.currency || ' ' || NEW.amount || ' for "' || expense_record.description || '"',
        jsonb_build_object('group_id', expense_record.group_id, 'expense_id', NEW.expense_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for debt settlement notifications
CREATE TRIGGER on_debt_settled
  AFTER UPDATE ON public.group_expense_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_debt_settled();