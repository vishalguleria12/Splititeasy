import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GroupExpense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string | null;
  paid_by: string;
  date: string;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  kind?: string;
  payer?: { username: string | null };
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at: string | null;
  profile?: { username: string | null };
}

export interface SplitPayment {
  id: string;
  group_id: string;
  split_id: string;
  settlement_expense_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_by: string;
  created_at: string;
}

export interface Balance {
  userId: string;
  username: string;
  owes: number;
  owed: number;
  net: number;
}

export interface DebtDetail {
  from: string;
  fromUsername: string;
  to: string;
  toUsername: string;
  amount: number;
}

export function useGroupExpenses(groupId: string | null) {
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchExpenses = useCallback(async () => {
    if (!groupId) {
      setExpenses([]);
      setSplits([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('group_expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (expenseError) throw expenseError;

      // Fetch payer profiles separately
      const payerIds = [...new Set((expenseData || []).map((e: any) => e.paid_by))];
      const { data: payerProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', payerIds);

      const payerMap = new Map(
        (payerProfiles || []).map((p: any) => [p.id, { username: p.username }])
      );

      const expenseIds = (expenseData || []).map((e: any) => e.id);

      if (expenseIds.length > 0) {
        const { data: splitData, error: splitError } = await supabase
          .from('group_expense_splits')
          .select('*')
          .in('expense_id', expenseIds);

        if (splitError) throw splitError;

        // Fetch split user profiles
        const splitUserIds = [...new Set((splitData || []).map((s: any) => s.user_id))];
        const { data: splitProfiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', splitUserIds);

        const splitProfileMap = new Map(
          (splitProfiles || []).map((p: any) => [p.id, { username: p.username }])
        );

        setSplits(
          (splitData || []).map((s: any) => ({
            ...s,
            profile: splitProfileMap.get(s.user_id) || { username: null },
          }))
        );
      } else {
        setSplits([]);
      }

      // Fetch split payments (ledger entries)
      const { data: paymentData, error: paymentError } = await supabase
        .from('group_split_payments')
        .select('*')
        .eq('group_id', groupId);

      if (paymentError) throw paymentError;
      setPayments((paymentData || []) as SplitPayment[]);

      setExpenses(
        (expenseData || []).map((e: any) => ({
          ...e,
          payer: payerMap.get(e.paid_by) || { username: null },
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load group expenses');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();

    // Set up realtime subscriptions
    if (!groupId) return;

    const channel = supabase
      .channel(`group-expenses-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_expenses',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchExpenses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_expense_splits',
        },
        () => {
          fetchExpenses();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_split_payments',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchExpenses, groupId]);

  const addExpense = async (
    expense: { description: string; amount: number; currency: string; paid_by: string; date: string },
    splitAmong: { userId: string; amount: number }[]
  ) => {
    if (!user || !groupId) return;

    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('group_expenses')
        .insert([{ ...expense, group_id: groupId, created_by: user.id, kind: 'expense' }])
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Get payer profile
      const { data: payerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', expense.paid_by)
        .maybeSingle();

      const splitsToInsert = splitAmong.map((s) => ({
        expense_id: expenseData.id,
        user_id: s.userId,
        amount: s.amount,
      }));

      const { data: splitData, error: splitError } = await supabase
        .from('group_expense_splits')
        .insert(splitsToInsert)
        .select();

      if (splitError) throw splitError;

      // Get split user profiles
      const splitUserIds = splitAmong.map((s) => s.userId);
      const { data: splitProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', splitUserIds);

      const splitProfileMap = new Map(
        (splitProfiles || []).map((p: any) => [p.id, { username: p.username }])
      );

      const mappedExpense: GroupExpense = {
        ...expenseData,
        payer: { username: payerProfile?.username || null },
      };

      setExpenses((prev) => [mappedExpense, ...prev]);
      setSplits((prev) => [
        ...prev,
        ...(splitData || []).map((s: any) => ({
          ...s,
          profile: splitProfileMap.get(s.user_id) || { username: null },
        })),
      ]);

      toast.success('Expense added');
      return expenseData;
    } catch (error: any) {
      toast.error('Failed to add expense');
      throw error;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);

      if (error) throw error;

      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setSplits((prev) => prev.filter((s) => s.expense_id !== expenseId));
      // Payments cascade delete automatically, but we update local state
      setPayments((prev) => prev.filter((p) => p.settlement_expense_id !== expenseId));
      toast.success('Deleted');
    } catch (error: any) {
      toast.error('Failed to delete');
    }
  };

  const settleDebt = async (splitId: string) => {
    try {
      const { error } = await supabase
        .from('group_expense_splits')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('id', splitId);

      if (error) throw error;

      setSplits((prev) =>
        prev.map((s) =>
          s.id === splitId ? { ...s, is_settled: true, settled_at: new Date().toISOString() } : s
        )
      );
      toast.success('Debt settled');
    } catch (error: any) {
      toast.error('Failed to settle debt');
    }
  };

  // Ledger-based settlement: does NOT mutate original splits
  const settleDebtBetween = async (fromUserId: string, toUserId: string, customAmount?: number) => {
    if (!user || !groupId) return;

    try {
      // Get profile names for notification
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', [fromUserId, toUserId]);

      const fromUsername = profiles?.find((p) => p.id === fromUserId)?.username || 'Unknown';
      const toUsername = profiles?.find((p) => p.id === toUserId)?.username || 'Unknown';
      const fromLabel = fromUserId === user.id ? 'You' : fromUsername;

      // Get group currency and name
      const { data: groupData } = await supabase
        .from('groups')
        .select('currency, name')
        .eq('id', groupId)
        .single();

      const currency = groupData?.currency || 'USD';
      const groupName = groupData?.name || 'group';

      // Query actual expenses from DB (only kind='expense', not settlements)
      const { data: allExpenses } = await supabase
        .from('group_expenses')
        .select('id, paid_by, kind')
        .eq('group_id', groupId);

      const regularExpenses = (allExpenses || []).filter((e) => e.kind !== 'settlement');
      const expenseIds = regularExpenses.map((e) => e.id);
      const expensePayerMap = new Map(regularExpenses.map((e) => [e.id, e.paid_by]));

      if (expenseIds.length === 0) {
        toast.error('No expenses found');
        return;
      }

      // Get all splits for regular expenses where fromUserId has a split
      const { data: freshSplits } = await supabase
        .from('group_expense_splits')
        .select('*')
        .in('expense_id', expenseIds)
        .eq('user_id', fromUserId);

      // Get all existing payments for these splits
      const splitIds = (freshSplits || []).map((s) => s.id);
      const { data: existingPayments } = await supabase
        .from('group_split_payments')
        .select('*')
        .in('split_id', splitIds);

      // Calculate remaining amount per split
      const paymentsBySplit = new Map<string, number>();
      (existingPayments || []).forEach((p: any) => {
        const current = paymentsBySplit.get(p.split_id) || 0;
        paymentsBySplit.set(p.split_id, current + Number(p.amount));
      });

      // Filter splits where the payer is toUserId (fromUser owes toUser)
      // and calculate remaining unpaid amount
      const splitsWithRemaining = (freshSplits || [])
        .filter((split) => expensePayerMap.get(split.expense_id) === toUserId)
        .map((split) => {
          const paidAmount = paymentsBySplit.get(split.id) || 0;
          const remaining = Number(split.amount) - paidAmount;
          return { ...split, remaining };
        })
        .filter((split) => split.remaining > 0.01);

      // Calculate total owed from fresh data
      const totalOwed = splitsWithRemaining.reduce((sum, s) => sum + s.remaining, 0);
      const settlementAmount = customAmount !== undefined ? customAmount : totalOwed;

      // Validate: cannot settle more than owed
      if (settlementAmount > totalOwed + 0.01) {
        toast.error(`You can only settle up to ${currency} ${totalOwed.toFixed(2)}`);
        return;
      }

      if (settlementAmount <= 0 || totalOwed <= 0) {
        toast.error('No debt to settle');
        return;
      }

      // Create a settlement expense record for history (kind='settlement')
      const { data: settlementExpense, error: expenseError } = await supabase
        .from('group_expenses')
        .insert([{
          group_id: groupId,
          description: `Settlement: ${fromLabel} paid ${toUsername}`,
          amount: settlementAmount,
          currency,
          paid_by: fromUserId,
          created_by: user.id,
          date: new Date().toISOString().split('T')[0],
          kind: 'settlement',
        }])
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Sort splits by date (oldest first) for predictable payoff
      splitsWithRemaining.sort((a, b) => a.expense_id.localeCompare(b.expense_id));

      // Create ledger entries (split payments) - DO NOT mutate original splits
      let remainingToSettle = settlementAmount;
      const ledgerEntries: any[] = [];

      for (const split of splitsWithRemaining) {
        if (remainingToSettle <= 0.01) break;

        const payAmount = Math.min(remainingToSettle, split.remaining);
        
        ledgerEntries.push({
          group_id: groupId,
          split_id: split.id,
          settlement_expense_id: settlementExpense.id,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: payAmount,
          created_by: user.id,
        });

        remainingToSettle -= payAmount;
      }

      if (ledgerEntries.length > 0) {
        const { error: ledgerError } = await supabase
          .from('group_split_payments')
          .insert(ledgerEntries);

        if (ledgerError) throw ledgerError;
      }

      // Insert notification for the receiver
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: toUserId,
          type: 'settlement',
          title: 'Payment Received',
          message: `${fromLabel} paid you ${currency} ${settlementAmount.toFixed(2)} in "${groupName}"`,
          data: { group_id: groupId, from_user_id: fromUserId, amount: settlementAmount },
        }]);

      if (notifError) console.error('Failed to send notification:', notifError);

      // Refetch to ensure UI is in sync
      await fetchExpenses();

      toast.success('Settlement recorded');
    } catch (error: any) {
      console.error('Settlement error:', error);
      toast.error('Failed to settle debt');
    }
  };

  // Calculate balances using ledger-based remaining amounts
  // remaining = split.amount - SUM(payments.amount for that split)
  const calculateBalances = useCallback(
    (members: { user_id: string; profile?: { username: string | null } }[]): Balance[] => {
      const balanceMap = new Map<string, { owes: number; owed: number; username: string }>();

      members.forEach((m) => {
        balanceMap.set(m.user_id, { owes: 0, owed: 0, username: m.profile?.username || 'Unknown' });
      });

      // Build payment map: split_id -> total paid amount
      const paymentsBySplit = new Map<string, number>();
      payments.forEach((p) => {
        const current = paymentsBySplit.get(p.split_id) || 0;
        paymentsBySplit.set(p.split_id, current + Number(p.amount));
      });

      // Only consider regular expenses (kind='expense' or no kind for legacy)
      const regularExpenses = expenses.filter((e) => e.kind !== 'settlement');

      regularExpenses.forEach((expense) => {
        const expenseSplits = splits.filter((s) => s.expense_id === expense.id);

        expenseSplits.forEach((split) => {
          // Skip if split is to the payer (they don't owe themselves)
          if (split.user_id === expense.paid_by) return;

          // Calculate remaining unpaid amount
          const paidAmount = paymentsBySplit.get(split.id) || 0;
          const remaining = Number(split.amount) - paidAmount;

          // Only count if still owes money
          if (remaining > 0.01) {
            // This person owes money to the payer
            const current = balanceMap.get(split.user_id);
            if (current) {
              current.owes += remaining;
            }

            const payer = balanceMap.get(expense.paid_by);
            if (payer) {
              payer.owed += remaining;
            }
          }
        });
      });

      return Array.from(balanceMap.entries()).map(([userId, data]) => ({
        userId,
        username: data.username,
        owes: data.owes,
        owed: data.owed,
        net: data.owed - data.owes,
      }));
    },
    [expenses, splits, payments]
  );

  // Calculate simplified debts using min-cash-flow algorithm from net balances
  // This ensures "who owes whom" always matches the net balances
  const calculateDebts = useCallback(
    (members: { user_id: string; profile?: { username: string | null } }[]): DebtDetail[] => {
      const balances = calculateBalances(members);
      const usernameMap = new Map<string, string>();
      
      members.forEach((m) => {
        usernameMap.set(m.user_id, m.profile?.username || 'Unknown');
      });

      // Separate into debtors (net < 0) and creditors (net > 0)
      const debtors: { userId: string; amount: number }[] = [];
      const creditors: { userId: string; amount: number }[] = [];

      balances.forEach((b) => {
        if (b.net < -0.01) {
          debtors.push({ userId: b.userId, amount: Math.abs(b.net) });
        } else if (b.net > 0.01) {
          creditors.push({ userId: b.userId, amount: b.net });
        }
      });

      // Sort by amount descending for optimal matching
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);

      // Min-cash-flow: match debtors to creditors
      const debts: DebtDetail[] = [];
      let i = 0;
      let j = 0;

      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const transferAmount = Math.min(debtor.amount, creditor.amount);

        if (transferAmount > 0.01) {
          debts.push({
            from: debtor.userId,
            fromUsername: usernameMap.get(debtor.userId) || 'Unknown',
            to: creditor.userId,
            toUsername: usernameMap.get(creditor.userId) || 'Unknown',
            amount: Math.round(transferAmount * 100) / 100,
          });
        }

        debtor.amount -= transferAmount;
        creditor.amount -= transferAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
      }

      return debts;
    },
    [calculateBalances]
  );

  // Get settlement history (expenses with kind='settlement')
  const getSettlementHistory = useCallback(() => {
    return expenses
      .filter((e) => e.kind === 'settlement')
      .map((e) => ({
        ...e,
        relatedPayments: payments.filter((p) => p.settlement_expense_id === e.id),
      }));
  }, [expenses, payments]);

  return {
    expenses,
    splits,
    payments,
    loading,
    addExpense,
    deleteExpense,
    settleDebt,
    settleDebtBetween,
    calculateBalances,
    calculateDebts,
    getSettlementHistory,
    refetch: fetchExpenses,
  };
}
