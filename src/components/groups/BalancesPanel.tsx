import { useState } from 'react';
import { Balance, DebtDetail } from '@/hooks/useGroupExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, CheckCircle, Loader2 } from 'lucide-react';

interface BalancesPanelProps {
  balances: Balance[];
  debts: DebtDetail[];
  currencySymbol: string;
  currentUserId: string;
  onSettle: (fromUserId: string, toUserId: string, amount?: number) => Promise<void>;
}

export function BalancesPanel({
  balances,
  debts,
  currencySymbol,
  currentUserId,
  onSettle,
}: BalancesPanelProps) {
  const [settlingDebt, setSettlingDebt] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<DebtDetail | null>(null);
  const [settleAmount, setSettleAmount] = useState('');

  const handleOpenSettle = (debt: DebtDetail) => {
    setConfirmDialog(debt);
    setSettleAmount(debt.amount.toFixed(2));
  };

  const handleSettle = async () => {
    if (!confirmDialog) return;
    
    const amount = parseFloat(settleAmount);
    if (amount <= 0 || amount > confirmDialog.amount) return;

    const key = `${confirmDialog.from}-${confirmDialog.to}`;
    setSettlingDebt(key);
    try {
      await onSettle(confirmDialog.from, confirmDialog.to, amount);
      setConfirmDialog(null);
      setSettleAmount('');
    } finally {
      setSettlingDebt(null);
    }
  };

  const isAllSettled = debts.length === 0 && balances.every((b) => Math.abs(b.net) < 0.01);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Per-user net balances */}
          <div className="space-y-3">
            {balances.map((balance) => (
              <div
                key={balance.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <p className="font-medium">
                  {balance.userId === currentUserId ? 'You' : balance.username}
                </p>
                <div>
                  {balance.net > 0.01 ? (
                    <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/30">
                      Gets {currencySymbol}{balance.net.toFixed(2)}
                    </Badge>
                  ) : balance.net < -0.01 ? (
                    <Badge className="bg-red-500/20 text-red-600 hover:bg-red-500/30">
                      Owes {currencySymbol}{Math.abs(balance.net).toFixed(2)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Settled</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Debt details - who owes whom with clear wording */}
          {debts.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm text-muted-foreground font-medium mb-2">To settle up:</p>
              {debts.map((debt, index) => {
                const key = `${debt.from}-${debt.to}`;
                const isSettling = settlingDebt === key;
                const isCurrentUserDebtor = debt.from === currentUserId;
                const isCurrentUserCreditor = debt.to === currentUserId;

                // Create user-centric description
                let debtDescription: React.ReactNode;
                if (isCurrentUserDebtor) {
                  debtDescription = (
                    <span className="text-red-600">
                      You owe <span className="font-medium">{debt.toUsername}</span>
                    </span>
                  );
                } else if (isCurrentUserCreditor) {
                  debtDescription = (
                    <span className="text-green-600">
                      <span className="font-medium">{debt.fromUsername}</span> owes you
                    </span>
                  );
                } else {
                  debtDescription = (
                    <span className="text-muted-foreground">
                      <span className="font-medium">{debt.fromUsername}</span> owes{' '}
                      <span className="font-medium">{debt.toUsername}</span>
                    </span>
                  );
                }

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {debtDescription}
                      <Badge variant="outline" className="font-mono text-xs ml-1">
                        {currencySymbol}{debt.amount.toFixed(2)}
                      </Badge>
                    </div>
                    {isCurrentUserDebtor && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSettle(debt)}
                        disabled={isSettling}
                        className="h-7 text-xs"
                      >
                        {isSettling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Pay'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isAllSettled && (
        <Card className="text-center py-8">
          <CardContent>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <p className="text-muted-foreground">All settled up!</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Settlement Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Payment</DialogTitle>
          </DialogHeader>
          {confirmDialog && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground mb-2">You owe</p>
                <p className="text-lg font-semibold">
                  {confirmDialog.to === currentUserId ? 'Yourself' : confirmDialog.toUsername}
                </p>
                <p className="text-2xl font-bold text-primary my-2">
                  {currencySymbol}{confirmDialog.amount.toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Amount to pay (max: {currencySymbol}{confirmDialog.amount.toFixed(2)})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={confirmDialog.amount}
                  value={settleAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > confirmDialog.amount) {
                      setSettleAmount(confirmDialog.amount.toFixed(2));
                    } else {
                      setSettleAmount(e.target.value);
                    }
                  }}
                  placeholder="Enter amount"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSettleAmount(confirmDialog.amount.toFixed(2))}
                >
                  Pay full amount
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDialog(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSettle}
                  disabled={
                    settlingDebt !== null ||
                    !settleAmount ||
                    parseFloat(settleAmount) <= 0 ||
                    parseFloat(settleAmount) > confirmDialog.amount
                  }
                >
                  {settlingDebt ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
