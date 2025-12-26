import { useState, useEffect } from 'react';
import { GroupMember } from '@/hooks/useGroups';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddGroupExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  currency: string;
  currencySymbol: string;
  onAdd: (
    expense: { description: string; amount: number; currency: string; paid_by: string; date: string },
    splitAmong: { userId: string; amount: number }[]
  ) => Promise<any>;
}

export function AddGroupExpenseDialog({
  open,
  onOpenChange,
  members,
  currency,
  currencySymbol,
  onAdd,
}: AddGroupExpenseDialogProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(members[0]?.user_id || '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((m) => m.user_id));
  const [unequalSplit, setUnequalSplit] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Reset custom amounts when switching modes or when amount changes
  useEffect(() => {
    if (!unequalSplit && amount && selectedMembers.length > 0) {
      const equalAmount = (parseFloat(amount) / selectedMembers.length).toFixed(2);
      const newCustomAmounts: Record<string, string> = {};
      selectedMembers.forEach((userId) => {
        newCustomAmounts[userId] = equalAmount;
      });
      setCustomAmounts(newCustomAmounts);
    }
  }, [unequalSplit, amount, selectedMembers.length]);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) => {
      const newSelection = prev.includes(userId) 
        ? prev.filter((id) => id !== userId) 
        : [...prev, userId];
      
      // Reset custom amounts for removed members
      if (!newSelection.includes(userId)) {
        setCustomAmounts((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      }
      
      return newSelection;
    });
  };

  const handleCustomAmountChange = (userId: string, value: string) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const calculateTotalSplit = () => {
    return selectedMembers.reduce((sum, userId) => {
      return sum + (parseFloat(customAmounts[userId] || '0') || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !amount || selectedMembers.length === 0) {
      toast.error('Please fill all fields and select at least one member');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    let splits: { userId: string; amount: number }[];

    if (unequalSplit) {
      const totalSplit = calculateTotalSplit();
      if (Math.abs(totalSplit - parsedAmount) > 0.01) {
        toast.error(`Split amounts (${currencySymbol}${totalSplit.toFixed(2)}) must equal total (${currencySymbol}${parsedAmount.toFixed(2)})`);
        return;
      }
      splits = selectedMembers.map((userId) => ({
        userId,
        amount: parseFloat(customAmounts[userId] || '0') || 0,
      }));
    } else {
      const splitAmount = parsedAmount / selectedMembers.length;
      splits = selectedMembers.map((userId) => ({
        userId,
        amount: Math.round(splitAmount * 100) / 100,
      }));
    }

    setLoading(true);
    try {
      await onAdd(
        {
          description: description.trim(),
          amount: parsedAmount,
          currency,
          paid_by: paidBy,
          date: new Date().toISOString().split('T')[0],
        },
        splits
      );
      // Reset form
      setDescription('');
      setAmount('');
      setSelectedMembers(members.map((m) => m.user_id));
      setUnequalSplit(false);
      setCustomAmounts({});
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  const equalSplitAmount = selectedMembers.length > 0 ? parseFloat(amount || '0') / selectedMembers.length : 0;
  const totalSplit = unequalSplit ? calculateTotalSplit() : equalSplitAmount * selectedMembers.length;
  const parsedAmount = parseFloat(amount || '0');
  const isBalanced = Math.abs(totalSplit - parsedAmount) <= 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Group Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Dinner at restaurant"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Select value={paidBy} onValueChange={setPaidBy} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.username || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="unequal-split">Unequal Split</Label>
            <Switch
              id="unequal-split"
              checked={unequalSplit}
              onCheckedChange={setUnequalSplit}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Split Among</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <Checkbox
                    id={m.user_id}
                    checked={selectedMembers.includes(m.user_id)}
                    onCheckedChange={() => handleMemberToggle(m.user_id)}
                    disabled={loading}
                  />
                  <label htmlFor={m.user_id} className="text-sm flex-1 cursor-pointer">
                    {m.profile?.username || 'Unknown'}
                  </label>
                  {selectedMembers.includes(m.user_id) && (
                    unequalSplit ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{currencySymbol}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={customAmounts[m.user_id] || ''}
                          onChange={(e) => handleCustomAmountChange(m.user_id, e.target.value)}
                          className="w-24 h-8 text-sm"
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      equalSplitAmount > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {currencySymbol}{equalSplitAmount.toFixed(2)}
                        </span>
                      )
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedMembers.length > 0 && parsedAmount > 0 && (
            <div className={`text-sm p-2 rounded ${isBalanced ? 'bg-muted' : 'bg-destructive/10 text-destructive'}`}>
              {unequalSplit ? (
                <>
                  Total split: {currencySymbol}{totalSplit.toFixed(2)} / {currencySymbol}{parsedAmount.toFixed(2)}
                  {!isBalanced && (
                    <span className="block">
                      {totalSplit < parsedAmount 
                        ? `Remaining: ${currencySymbol}${(parsedAmount - totalSplit).toFixed(2)}`
                        : `Over by: ${currencySymbol}${(totalSplit - parsedAmount).toFixed(2)}`
                      }
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Each person pays: {currencySymbol}{equalSplitAmount.toFixed(2)}
                </span>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || (unequalSplit && !isBalanced)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
