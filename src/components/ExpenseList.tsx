import { ExpenseRecord } from '@/hooks/useExpenses';
import { categoryLabels, categoryIcons, formatDate } from '@/lib/expense-data';
import { useCurrencies } from '@/hooks/useCurrencies';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  expenses: ExpenseRecord[];
  limit?: number;
  onDelete?: (id: string) => void;
}

export function ExpenseList({ expenses, limit, onDelete }: ExpenseListProps) {
  const displayExpenses = limit ? expenses.slice(0, limit) : expenses;
  const { currencies } = useCurrencies();

  const getSymbol = (code: string) => {
    return currencies.find((c) => c.code === code)?.symbol || code;
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
        <p className="text-muted-foreground text-center py-8">No expenses yet. Add your first expense above!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {displayExpenses.map((expense, index) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200 animate-fade-in group"
            style={{ animationDelay: `${400 + index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `hsl(var(--category-${expense.category}) / 0.1)` }}
              >
                {categoryIcons[expense.category]}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {expense.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[expense.category]} • {formatDate(new Date(expense.date))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono font-semibold text-foreground">
                -{getSymbol(expense.currency)}{Number(expense.amount).toFixed(2)}
              </p>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(expense.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
