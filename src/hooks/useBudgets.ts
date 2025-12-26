import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Category } from '@/lib/expense-data';

export interface BudgetRecord {
  id: string;
  category: Category;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
  warning_threshold: number;
  user_id: string;
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setBudgets((data || []).map(b => ({
        ...b,
        category: b.category as Category,
        period: b.period as 'weekly' | 'monthly' | 'yearly',
      })));
    } catch (error: any) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Realtime subscription for budgets changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBudgets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchBudgets]);

  const upsertBudget = async (budget: Omit<BudgetRecord, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { ...budget, user_id: user.id },
          { onConflict: 'user_id,category' }
        )
        .select()
        .single();

      if (error) throw error;
      
      const mapped = {
        ...data,
        category: data.category as Category,
        period: data.period as 'weekly' | 'monthly' | 'yearly',
      };
      
      setBudgets((prev) => {
        const index = prev.findIndex((b) => b.category === budget.category);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = mapped;
          return updated;
        }
        return [...prev, mapped];
      });
      
      toast.success('Budget updated');
      return mapped;
    } catch (error: any) {
      toast.error('Failed to update budget');
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      toast.success('Budget removed');
    } catch (error: any) {
      toast.error('Failed to delete budget');
    }
  };

  return { budgets, loading, upsertBudget, deleteBudget, refetch: fetchBudgets };
}
