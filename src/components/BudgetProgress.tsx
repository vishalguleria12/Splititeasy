import { useMemo } from 'react';
import { ExpenseRecord } from '@/hooks/useExpenses';
import { BudgetRecord } from '@/hooks/useBudgets';
import { categoryLabels, categoryIcons, Category } from '@/lib/expense-data';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

interface BudgetProgressProps {
  budgets: BudgetRecord[];
  expenses: ExpenseRecord[];
}

export function BudgetProgress({ budgets, expenses }: BudgetProgressProps) {
  const { currencies } = useCurrencies();

  const getSymbol = (code: string) => {
    return currencies.find((c) => c.code === code)?.symbol || code;
  };

  const budgetData = useMemo(() => {
    return budgets.map((budget) => {
      let periodStart: Date;
      const now = new Date();

      switch (budget.period) {
        case 'weekly':
          periodStart = startOfWeek(now);
          break;
        case 'yearly':
          periodStart = startOfYear(now);
          break;
        default:
          periodStart = startOfMonth(now);
      }

      const periodExpenses = expenses.filter(
        (e) =>
          (budget.category === 'overall' || e.category === budget.category) &&
          e.currency === budget.currency &&
          isAfter(new Date(e.date), periodStart)
      );

      const spent = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        ...budget,
        spent,
        percentage: Math.min((spent / Number(budget.amount)) * 100, 100),
        isOverBudget: spent > Number(budget.amount),
        isNearLimit: spent / Number(budget.amount) >= Number(budget.warning_threshold),
      };
    });
  }, [budgets, expenses]);

  if (budgets.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Budget Overview</h3>
        <p className="text-muted-foreground text-center py-4 text-sm">
          No budgets set. Click "Manage Budgets" to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Budget Overview</h3>
      <div className="space-y-4">
        {budgetData.map((budget, index) => (
          <div key={budget.id} className="space-y-2 animate-fade-in" style={{ animationDelay: `${300 + index * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{categoryIcons[budget.category]}</span>
                <span className="text-sm font-medium text-foreground">
                  {categoryLabels[budget.category]}
                </span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-sm font-mono font-medium",
                  budget.isOverBudget ? "text-destructive" : budget.isNearLimit ? "text-warning" : "text-muted-foreground"
                )}>
                  {getSymbol(budget.currency)}{budget.spent.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground"> / {getSymbol(budget.currency)}{Number(budget.amount).toFixed(2)}</span>
              </div>
            </div>
            <Progress
              value={budget.percentage}
              className={cn(
                "h-2",
                budget.isOverBudget ? "[&>div]:bg-destructive" : budget.isNearLimit ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
              )}
            />
            {budget.isOverBudget && (
              <p className="text-xs text-destructive font-medium">
                Over budget by {getSymbol(budget.currency)}{(budget.spent - Number(budget.amount)).toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
