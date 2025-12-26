import { useState } from 'react';
import { GroupExpense, ExpenseSplit } from '@/hooks/useGroupExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Receipt, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExpenseDetailDialog } from './ExpenseDetailDialog';
import { GroupExportButtons } from './GroupExportButtons';

interface GroupExpenseListProps {
  expenses: GroupExpense[];
  splits: ExpenseSplit[];
  currencySymbol: string;
  currentUserId: string;
  isAdmin: boolean;
  groupName: string;
  onDelete: (id: string) => void;
}

export function GroupExpenseList({
  expenses,
  splits,
  currencySymbol,
  currentUserId,
  isAdmin,
  groupName,
  onDelete,
}: GroupExpenseListProps) {
  const [selectedExpense, setSelectedExpense] = useState<GroupExpense | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filter out settlements for the expense list display
  const regularExpenses = expenses.filter((e) => e.kind !== 'settlement');

  const handleExpenseClick = (expense: GroupExpense) => {
    setSelectedExpense(expense);
    setDetailOpen(true);
  };

  if (regularExpenses.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No expenses yet. Add one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Expenses</CardTitle>
          <GroupExportButtons
            expenses={expenses}
            splits={splits}
            groupName={groupName}
            currencySymbol={currencySymbol}
            currentUserId={currentUserId}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {regularExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleExpenseClick(expense)}
            >
              <div className="flex-1">
                <p className="font-medium">{expense.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Paid by {expense.paid_by === currentUserId ? 'You' : (expense.payer?.username || 'Unknown')}</span>
                  <span>•</span>
                  <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-base font-mono">
                  {currencySymbol}{Number(expense.amount).toFixed(2)}
                </Badge>
                {(expense.created_by === currentUserId || isAdmin) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this expense and its splits.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(expense.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ExpenseDetailDialog
        expense={selectedExpense}
        splits={splits}
        currencySymbol={currencySymbol}
        currentUserId={currentUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
