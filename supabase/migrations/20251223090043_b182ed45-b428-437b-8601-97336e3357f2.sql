-- Enable REPLICA IDENTITY FULL for complete row data in realtime
ALTER TABLE public.group_expenses REPLICA IDENTITY FULL;
ALTER TABLE public.group_expense_splits REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;