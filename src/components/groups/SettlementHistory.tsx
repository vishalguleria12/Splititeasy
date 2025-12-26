import { GroupExpense, SplitPayment } from '@/hooks/useGroupExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Trash2, ArrowRight } from 'lucide-react';
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

interface SettlementWithPayments extends GroupExpense {
  relatedPayments: SplitPayment[];
}

interface SettlementHistoryProps {
  settlements: SettlementWithPayments[];
  currencySymbol: string;
  currentUserId: string;
  onDelete: (expenseId: string) => Promise<void>;
}

export function SettlementHistory({
  settlements,
  currencySymbol,
  currentUserId,
  onDelete,
}: SettlementHistoryProps) {
  if (settlements.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No settlements yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Settlements will appear here when group members pay each other
          </p>
        </CardContent>
      </Card>
    );
  }

  const parseSettlementDescription = (description: string, payerId: string) => {
    // Format: "Settlement: X paid Y"
    const match = description.match(/Settlement:\s*(.+)\s+paid\s+(.+)/);
    if (match) {
      return {
        from: match[1].trim(),
        to: match[2].trim(),
      };
    }
    return { from: 'Unknown', to: 'Unknown' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Settlement History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {settlements.map((settlement) => {
          const { from, to } = parseSettlementDescription(settlement.description, settlement.paid_by);
          const isPayer = settlement.paid_by === currentUserId;
          const isReceiver = settlement.relatedPayments.some((p) => p.to_user_id === currentUserId);

          return (
            <div
              key={settlement.id}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className={isPayer ? 'font-medium text-primary' : 'font-medium'}>
                    {isPayer ? 'You' : from}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className={isReceiver ? 'font-medium text-primary' : 'font-medium'}>
                    {isReceiver ? 'You' : to}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(settlement.date), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge 
                  className={
                    isPayer
                      ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                      : isReceiver
                      ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                      : ''
                  }
                >
                  {isPayer ? '-' : isReceiver ? '+' : ''}{currencySymbol}{settlement.amount.toFixed(2)}
                </Badge>

                {(isPayer || settlement.created_by === currentUserId) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Settlement?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the settlement and restore the original balances. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(settlement.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
