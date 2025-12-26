import { useState, useEffect } from 'react';
import { GroupMember } from '@/hooks/useGroups';
import { DebtDetail } from '@/hooks/useGroupExpenses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';

interface QuickSettleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  debts: DebtDetail[];
  currentUserId: string;
  currencySymbol: string;
  onSettle: (fromUserId: string, toUserId: string, amount?: number) => Promise<void>;
}

export function QuickSettleDialog({
  open,
  onOpenChange,
  members,
  debts,
  currentUserId,
  currencySymbol,
  onSettle,
}: QuickSettleDialogProps) {
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Get debts where current user owes money
  const userDebts = debts.filter((d) => d.from === currentUserId);

  // Get max amount owed to selected user
  const selectedDebt = userDebts.find((d) => d.to === toId);
  const maxAmount = selectedDebt?.amount || 0;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setToId('');
      setAmount('');
    }
  }, [open]);

  // When toId changes, reset amount if it exceeds new max
  useEffect(() => {
    if (toId && parseFloat(amount) > maxAmount) {
      setAmount(maxAmount.toFixed(2));
    }
  }, [toId, maxAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toId || !amount) return;

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > maxAmount) {
      return;
    }

    setLoading(true);
    try {
      await onSettle(currentUserId, toId, amountNum);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const getMemberName = (userId: string) => {
    if (userId === currentUserId) return 'You';
    const member = members.find((m) => m.user_id === userId);
    return member?.profile?.username || 'Unknown';
  };

  const hasDebts = userDebts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Settle</DialogTitle>
        </DialogHeader>
        {!hasDebts ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">You don't owe anyone money.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <Label>From</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
                  <span className="text-sm">You</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 mt-6 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <Label>To</Label>
                <Select value={toId} onValueChange={setToId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select receiver" />
                  </SelectTrigger>
                  <SelectContent>
                    {userDebts.map((debt) => (
                      <SelectItem key={debt.to} value={debt.to}>
                        {getMemberName(debt.to)} ({currencySymbol}{debt.amount.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {toId && (
              <div className="space-y-2">
                <Label>
                  Amount ({currencySymbol}) - Max: {currencySymbol}{maxAmount.toFixed(2)}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > maxAmount) {
                      setAmount(maxAmount.toFixed(2));
                    } else {
                      setAmount(e.target.value);
                    }
                  }}
                  placeholder={`Enter amount (up to ${currencySymbol}${maxAmount.toFixed(2)})`}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAmount(maxAmount.toFixed(2))}
                >
                  Pay full amount ({currencySymbol}{maxAmount.toFixed(2)})
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !toId || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Settle Payment'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
