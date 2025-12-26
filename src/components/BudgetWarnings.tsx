import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExpenseRecord } from '@/hooks/useExpenses';
import { BudgetRecord } from '@/hooks/useBudgets';
import { categoryLabels, categoryIcons, Category } from '@/lib/expense-data';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

interface BudgetWarningsProps {
  expenses: ExpenseRecord[];
  budgets: BudgetRecord[];
}

export function BudgetWarnings({ expenses, budgets }: BudgetWarningsProps) {
  const warnings = useMemo(() => {
    const result: Array<{
      category: Category;
      spent: number;
      limit: number;
      currency: string;
      isOver: boolean;
      percentage: number;
    }> = [];

    budgets.forEach((budget) => {
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
      const percentage = (spent / Number(budget.amount)) * 100;
      const threshold = Number(budget.warning_threshold) * 100;

      if (percentage >= threshold) {
        result.push({
          category: budget.category as Category,
          spent,
          limit: Number(budget.amount),
          currency: budget.currency,
          isOver: spent > Number(budget.amount),
          percentage,
        });
      }
    });

    return result.sort((a, b) => b.percentage - a.percentage);
  }, [expenses, budgets]);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-fade-in">
      {warnings.map((warning) => (
        <Alert
          key={warning.category}
          variant={warning.isOver ? 'destructive' : 'default'}
          className={warning.isOver ? '' : 'border-warning bg-warning/10'}
        >
          {warning.isOver ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
          <AlertTitle className="flex items-center gap-2">
            {categoryIcons[warning.category]} {categoryLabels[warning.category]}
          </AlertTitle>
          <AlertDescription>
            {warning.isOver ? (
              <>
                You've exceeded your budget by{' '}
                <strong>
                  {(warning.spent - warning.limit).toFixed(2)} {warning.currency}
                </strong>
              </>
            ) : (
              <>
                You've used <strong>{warning.percentage.toFixed(0)}%</strong> of your budget (
                {warning.spent.toFixed(2)} / {warning.limit.toFixed(2)} {warning.currency})
              </>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
