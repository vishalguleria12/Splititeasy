import { GroupExpense, ExpenseSplit } from '@/hooks/useGroupExpenses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Receipt, User, Calendar, CreditCard } from 'lucide-react';

interface ExpenseDetailDialogProps {
  expense: GroupExpense | null;
  splits: ExpenseSplit[];
  currencySymbol: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseDetailDialog({
  expense,
  splits,
  currencySymbol,
  currentUserId,
  open,
  onOpenChange,
}: ExpenseDetailDialogProps) {
  if (!expense) return null;

  const expenseSplits = splits.filter((s) => s.expense_id === expense.id);
  const payerName = expense.paid_by === currentUserId ? 'You' : (expense.payer?.username || 'Unknown');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main expense info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{expense.description}</h3>
              <Badge variant="secondary" className="text-lg font-mono">
                {currencySymbol}{Number(expense.amount).toFixed(2)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(expense.date), 'MMMM d, yyyy')}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Paid by <strong>{payerName}</strong></span>
            </div>
          </div>

          {/* Split breakdown */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Split Between ({expenseSplits.length} {expenseSplits.length === 1 ? 'person' : 'people'})
            </h4>
            
            <div className="space-y-2">
              {expenseSplits.map((split) => {
                const isCurrentUser = split.user_id === currentUserId;
                const isPayer = split.user_id === expense.paid_by;
                const username = isCurrentUser ? 'You' : (split.profile?.username || 'Unknown');

                return (
                  <div
                    key={split.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{username}</p>
                        {isPayer && (
                          <span className="text-xs text-muted-foreground">(paid)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={isPayer ? "outline" : "secondary"}
                        className="font-mono"
                      >
                        {currencySymbol}{Number(split.amount).toFixed(2)}
                      </Badge>
                      {!isPayer && (
                        <p className="text-xs text-muted-foreground mt-1">
                          owes to {expense.paid_by === currentUserId ? 'you' : expense.payer?.username}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t text-sm text-muted-foreground">
            <p>
              Total: <strong className="text-foreground">{currencySymbol}{Number(expense.amount).toFixed(2)}</strong>
              {' • '}
              Each share: <strong className="text-foreground">
                {currencySymbol}{(Number(expense.amount) / Math.max(expenseSplits.length, 1)).toFixed(2)}
              </strong>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
