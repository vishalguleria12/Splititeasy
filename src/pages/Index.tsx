import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { BudgetProgress } from '@/components/BudgetProgress';
import { ExpenseList } from '@/components/ExpenseList';
import { CategoryChart } from '@/components/CategoryChart';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseFilters } from '@/components/ExpenseFilters';
import { MonthlyChart } from '@/components/MonthlyChart';
import { BudgetWarnings } from '@/components/BudgetWarnings';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { useCurrencies } from '@/hooks/useCurrencies';
import { useProfile } from '@/hooks/useProfile';
import { getCategoryTotals, Category } from '@/lib/expense-data';
import { DollarSign, TrendingDown, CreditCard, Target, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { currencies } = useCurrencies();
  const { profile } = useProfile();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesDateFrom = !dateFrom || expense.date >= dateFrom;
      const matchesDateTo = !dateTo || expense.date <= dateTo;
      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  }, [expenses, searchQuery, categoryFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleAddExpense = async (expense: {
    description: string;
    amount: number;
    currency: string;
    category: Category;
    date: string;
  }) => {
    await addExpense(expense);
  };

  // Stats
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Calculate average expense per day
  const averagePerDay = useMemo(() => {
    if (expenses.length === 0) return 0;
    
    const dates = expenses.map(e => new Date(e.date).getTime());
    const earliestDate = Math.min(...dates);
    const latestDate = Math.max(...dates);
    
    // Calculate days between earliest and latest expense (minimum 1 day)
    const daysDiff = Math.max(1, Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)) + 1);
    
    return totalSpent / daysDiff;
  }, [expenses, totalSpent]);
  const categoryTotals = getCategoryTotals(
    expenses.map((e) => ({ ...e, amount: Number(e.amount), date: new Date(e.date) }))
  );
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const budgetSpent = useMemo(() => {
    return budgets.reduce((sum, budget) => {
      const spent = expenses
        .filter((e) => 
          (budget.category === 'overall' || e.category === budget.category) && 
          e.currency === budget.currency
        )
        .reduce((s, e) => s + Number(e.amount), 0);
      return sum + spent;
    }, 0);
  }, [budgets, expenses]);

  const primaryCurrency = profile?.default_currency || 'USD';
  const currencySymbol = currencies.find((c) => c.code === primaryCurrency)?.symbol || '$';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>SplitItEasy - Smart Expense Management</title>
        <meta
          name="description"
          content="Track your expenses intelligently with AI-powered categorization, budget alerts, and insightful analytics."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header expenses={expenses} />

        <main className="container mx-auto px-4 py-8">
          {/* Budget Warnings */}
          <BudgetWarnings expenses={expenses} budgets={budgets} />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Spent"
              value={`${currencySymbol}${totalSpent.toFixed(2)}`}
              icon={<DollarSign className="w-6 h-6" />}
              delay={0}
            />
            <StatCard
              title="Avg. Daily Spend"
              value={`${currencySymbol}${averagePerDay.toFixed(2)}`}
              icon={<TrendingDown className="w-6 h-6" />}
              delay={50}
            />
            <StatCard
              title="Transactions"
              value={expenses.length.toString()}
              icon={<CreditCard className="w-6 h-6" />}
              delay={100}
            />
            <StatCard
              title="Budget Used"
              value={totalBudget > 0 ? `${Math.round((budgetSpent / totalBudget) * 100)}%` : 'N/A'}
              icon={<Target className="w-6 h-6" />}
              delay={150}
            />
          </div>

          {/* Filters */}
          <ExpenseFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            onClearFilters={clearFilters}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <AddExpenseForm onAddExpense={handleAddExpense} loading={expensesLoading} />
              <MonthlyChart expenses={expenses} currency={primaryCurrency} currencySymbol={currencySymbol} />
              <ExpenseList expenses={filteredExpenses} limit={10} onDelete={deleteExpense} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <CategoryChart categoryTotals={categoryTotals} />
              <BudgetProgress budgets={budgets} expenses={expenses} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card mt-12">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              SplitItEasy © {new Date().getFullYear()} • Track smarter, spend wiser
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
