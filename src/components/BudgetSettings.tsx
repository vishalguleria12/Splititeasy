import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Category, categoryLabels, categoryIcons } from '@/lib/expense-data';
import { useBudgets } from '@/hooks/useBudgets';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Settings, Plus, Trash2, Wallet, PieChart } from 'lucide-react';
import { toast } from 'sonner';

// Categories excluding 'overall' for category budgets
const categoryBudgetOptions = (Object.keys(categoryLabels) as Category[]).filter(c => c !== 'overall');

export function BudgetSettings() {
  const { budgets, upsertBudget, deleteBudget } = useBudgets();
  const { currencies } = useCurrencies();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('food');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [threshold, setThreshold] = useState('80');

  // Overall budget state
  const [overallAmount, setOverallAmount] = useState('');
  const [overallCurrency, setOverallCurrency] = useState('USD');
  const [overallPeriod, setOverallPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [overallThreshold, setOverallThreshold] = useState('80');

  const overallBudget = budgets.find(b => b.category === 'overall');
  const categoryBudgets = budgets.filter(b => b.category !== 'overall');

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    await upsertBudget({
      category,
      amount: parseFloat(amount),
      currency,
      period,
      warning_threshold: parseFloat(threshold) / 100,
    });

    setAmount('');
    setCategory('food');
  };

  const handleOverallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!overallAmount || parseFloat(overallAmount) <= 0) {
      toast.error('Please enter a valid overall budget amount');
      return;
    }

    await upsertBudget({
      category: 'overall' as Category,
      amount: parseFloat(overallAmount),
      currency: overallCurrency,
      period: overallPeriod,
      warning_threshold: parseFloat(overallThreshold) / 100,
    });

    setOverallAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Manage Budgets</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Budget Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overall" className="gap-2">
              <Wallet className="w-4 h-4" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-2">
              <PieChart className="w-4 h-4" />
              By Category
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <form onSubmit={handleOverallSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set a total budget limit across all categories.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="2000.00"
                    value={overallAmount}
                    onChange={(e) => setOverallAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={overallCurrency} onValueChange={setOverallCurrency}>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={overallPeriod} onValueChange={(v) => setOverallPeriod(v as 'weekly' | 'monthly' | 'yearly')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Warning at</Label>
                  <Select value={overallThreshold} onValueChange={setOverallThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="90">90%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4" />
                Set Overall Budget
              </Button>
            </form>

            {overallBudget && (
              <div className="mt-4 p-3 rounded-lg bg-muted flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  💰 Overall Budget
                  <span className="text-muted-foreground">
                    {overallBudget.amount} {overallBudget.currency}/{overallBudget.period}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteBudget(overallBudget.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="category" className="space-y-4">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryBudgetOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <span className="flex items-center gap-2">
                            {categoryIcons[cat]} {categoryLabels[cat]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
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
                  <Label>Period</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly' | 'yearly')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Warning at</Label>
                  <Select value={threshold} onValueChange={setThreshold}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="70">70%</SelectItem>
                      <SelectItem value="80">80%</SelectItem>
                      <SelectItem value="90">90%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4" />
                Set Category Budget
              </Button>
            </form>

            {categoryBudgets.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Current Budgets</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categoryBudgets.map((budget) => (
                    <div key={budget.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                      <span className="text-sm flex items-center gap-2">
                        {categoryIcons[budget.category as Category]}
                        {categoryLabels[budget.category as Category]}
                        <span className="text-muted-foreground">
                          {budget.amount} {budget.currency}/{budget.period}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
