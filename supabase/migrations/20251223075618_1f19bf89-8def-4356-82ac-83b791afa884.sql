
-- Add default_currency preference to profiles (already exists, just ensuring it's used)
-- Add overall budget support by allowing 'overall' as a category in budgets

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'USD' REFERENCES currencies(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_expenses table
CREATE TABLE public.group_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD' REFERENCES currencies(code),
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group_expense_splits table (who owes what)
CREATE TABLE public.group_expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.group_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(expense_id, user_id)
);

-- Create group_invitations table
CREATE TABLE public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, invitee_id)
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is group member
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Helper function: Check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND admin_id = _user_id
  )
$$;

-- Groups RLS policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (public.is_group_member(auth.uid(), id) OR admin_id = auth.uid());

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Only admin can update group"
ON public.groups FOR UPDATE
USING (auth.uid() = admin_id);

CREATE POLICY "Only admin can delete group"
ON public.groups FOR DELETE
USING (auth.uid() = admin_id);

-- Group members RLS policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (public.is_group_member(auth.uid(), group_id) OR public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Only admin can add members"
ON public.group_members FOR INSERT
WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Only admin can remove members"
ON public.group_members FOR DELETE
USING (public.is_group_admin(auth.uid(), group_id));

-- Group expenses RLS policies
CREATE POLICY "Members can view group expenses"
ON public.group_expenses FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can add group expenses"
ON public.group_expenses FOR INSERT
WITH CHECK (public.is_group_member(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Creator can update their expenses"
ON public.group_expenses FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creator or admin can delete expenses"
ON public.group_expenses FOR DELETE
USING (auth.uid() = created_by OR public.is_group_admin(auth.uid(), group_id));

-- Group expense splits RLS policies
CREATE POLICY "Members can view splits"
ON public.group_expense_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_expenses ge
    WHERE ge.id = expense_id AND public.is_group_member(auth.uid(), ge.group_id)
  )
);

CREATE POLICY "Members can create splits"
ON public.group_expense_splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_expenses ge
    WHERE ge.id = expense_id AND public.is_group_member(auth.uid(), ge.group_id)
  )
);

CREATE POLICY "Members can update splits"
ON public.group_expense_splits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_expenses ge
    WHERE ge.id = expense_id AND public.is_group_member(auth.uid(), ge.group_id)
  )
);

CREATE POLICY "Expense creator can delete splits"
ON public.group_expense_splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_expenses ge
    WHERE ge.id = expense_id AND auth.uid() = ge.created_by
  )
);

-- Group invitations RLS policies
CREATE POLICY "Users can view their invitations"
ON public.group_invitations FOR SELECT
USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Admin can create invitations"
ON public.group_invitations FOR INSERT
WITH CHECK (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Invitee can update invitation status"
ON public.group_invitations FOR UPDATE
USING (auth.uid() = invitee_id);

CREATE POLICY "Admin can delete invitations"
ON public.group_invitations FOR DELETE
USING (public.is_group_admin(auth.uid(), group_id));

-- Trigger for updated_at on groups
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on group_expenses
CREATE TRIGGER update_group_expenses_updated_at
BEFORE UPDATE ON public.group_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow profiles SELECT for finding users to invite
CREATE POLICY "Users can view other profiles for invitations"
ON public.profiles FOR SELECT
USING (true);
