-- Add kind column to group_expenses to distinguish expenses from settlements
ALTER TABLE public.group_expenses 
ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'expense';

-- Backfill existing settlements (those with "Settlement:" prefix)
UPDATE public.group_expenses 
SET kind = 'settlement' 
WHERE description LIKE 'Settlement:%';

-- Create ledger table for settlement allocations (reversible source of truth)
CREATE TABLE IF NOT EXISTS public.group_split_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  split_id uuid NOT NULL REFERENCES public.group_expense_splits(id) ON DELETE CASCADE,
  settlement_expense_id uuid NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on group_split_payments
ALTER TABLE public.group_split_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_split_payments
CREATE POLICY "Members can view split payments"
ON public.group_split_payments
FOR SELECT
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create split payments"
ON public.group_split_payments
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Members can delete split payments"
ON public.group_split_payments
FOR DELETE
USING (is_group_member(auth.uid(), group_id));

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_split_payments;