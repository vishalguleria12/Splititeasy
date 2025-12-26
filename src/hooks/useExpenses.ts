import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Category } from '@/lib/expense-data';

export interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: Category;
  date: string;
  user_id: string;
  created_at: string;
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses((data || []).map(e => ({ ...e, category: e.category as Category })));
    } catch (error: any) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Realtime subscription for expenses changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchExpenses]);
  const addExpense = async (expense: Omit<ExpenseRecord, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      const mapped = { ...data, category: data.category as Category };
      setExpenses((prev) => [mapped, ...prev]);
      return mapped;
    } catch (error: any) {
      toast.error('Failed to add expense');
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success('Expense deleted');
    } catch (error: any) {
      toast.error('Failed to delete expense');
    }
  };

  return { expenses, loading, addExpense, deleteExpense, refetch: fetchExpenses };
}
