import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Category, categoryLabels, categoryIcons, predictCategory } from '@/lib/expense-data';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useProfile } from '@/hooks/useProfile';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Expense categories (excluding 'overall' which is only for budgets)
const expenseCategories = (Object.keys(categoryLabels) as Category[]).filter(c => c !== 'overall');

interface AddExpenseFormProps {
  onAddExpense: (expense: {
    description: string;
    amount: number;
    currency: string;
    category: Category;
    date: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function AddExpenseForm({ onAddExpense, loading: submitting }: AddExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [currency, setCurrency] = useState('USD');
  const [rememberCurrency, setRememberCurrency] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const { currencies } = useCurrencies();
  const { profile, updateProfile } = useProfile();

  // Load saved currency preference on mount
  useEffect(() => {
    if (profile?.default_currency) {
      setCurrency(profile.default_currency);
      setRememberCurrency(true);
    }
  }, [profile?.default_currency]);

  useEffect(() => {
    if (description.length > 2) {
      setIsPredicting(true);
      const timer = setTimeout(() => {
        const predicted = predictCategory(description);
        if (predicted !== 'overall') {
          setCategory(predicted);
        }
        setIsPredicting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [description]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    
    if (rememberCurrency) {
      try {
        await updateProfile({ default_currency: newCurrency });
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const handleRememberCurrencyChange = async (checked: boolean) => {
    setRememberCurrency(checked);
    
    if (checked) {
      try {
        await updateProfile({ default_currency: currency });
        toast.success('Currency preference saved');
      } catch (error) {
        setRememberCurrency(false);
      }
    } else {
      try {
        await updateProfile({ default_currency: null });
      } catch (error) {
        // Silent fail
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await onAddExpense({
        description: description.trim(),
        amount: parsedAmount,
        currency,
        category,
        date: new Date().toISOString().split('T')[0],
      });

      toast.success('Expense added!', {
        description: `${categoryIcons[category]} ${description}`,
      });

      setAmount('');
      setDescription('');
      setCategory('other');
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        Add Expense
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={handleCurrencyChange} disabled={submitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-2">
              Category
              {isPredicting && (
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              )}
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as Category)} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      <span>{categoryIcons[cat]}</span>
                      {categoryLabels[cat]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="e.g., Lunch at restaurant"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
          {description && category !== 'other' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Auto-detected: {categoryIcons[category]} {categoryLabels[category]}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberCurrency"
              checked={rememberCurrency}
              onCheckedChange={handleRememberCurrencyChange}
              disabled={submitting}
            />
            <label
              htmlFor="rememberCurrency"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember currency preference
            </label>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Expense
        </Button>
      </form>
    </div>
  );
}
