import { Button } from '@/components/ui/button';
import { GroupExpense, ExpenseSplit } from '@/hooks/useGroupExpenses';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GroupExportButtonsProps {
  expenses: GroupExpense[];
  splits: ExpenseSplit[];
  groupName: string;
  currencySymbol: string;
  currentUserId: string;
}

export function GroupExportButtons({ 
  expenses, 
  splits, 
  groupName,
  currencySymbol,
  currentUserId 
}: GroupExportButtonsProps) {
  // Filter out settlements for export
  const regularExpenses = expenses.filter((e) => e.kind !== 'settlement');

  const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy');

  const getSplitDetails = (expenseId: string) => {
    const expenseSplits = splits.filter((s) => s.expense_id === expenseId);
    return expenseSplits.map((s) => {
      const username = s.user_id === currentUserId ? 'You' : (s.profile?.username || 'Unknown');
      return `${username}: ${currencySymbol}${Number(s.amount).toFixed(2)}`;
    }).join('; ');
  };

  const exportCSV = () => {
    if (regularExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Amount', 'Paid By', 'Split Details'];
    const rows = regularExpenses.map((e) => {
      const payerName = e.paid_by === currentUserId ? 'You' : (e.payer?.username || 'Unknown');
      return [
        formatDate(e.date),
        `"${e.description.replace(/"/g, '""')}"`,
        `${currencySymbol}${Number(e.amount).toFixed(2)}`,
        payerName,
        `"${getSplitDetails(e.id)}"`,
      ];
    });

    const total = regularExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    rows.push(['', '', '', '', '']);
    rows.push(['Total', '', `${currencySymbol}${total.toFixed(2)}`, '', '']);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${groupName.replace(/\s+/g, '-')}-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exported successfully');
  };

  const exportPDF = () => {
    if (regularExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const total = regularExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Group Expenses - ${groupName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #0d9488; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0fdfa; color: #0d9488; }
          .amount { font-family: monospace; }
          .total-row { font-weight: bold; background-color: #f0fdfa; }
          .split-details { font-size: 12px; color: #666; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${groupName}</h1>
        <p class="subtitle">Expense Report • Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Paid By</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${regularExpenses.map((e) => {
              const payerName = e.paid_by === currentUserId ? 'You' : (e.payer?.username || 'Unknown');
              const splitInfo = getSplitDetails(e.id);
              return `
                <tr>
                  <td>${formatDate(e.date)}</td>
                  <td>
                    ${e.description}
                    <div class="split-details">${splitInfo}</div>
                  </td>
                  <td>${payerName}</td>
                  <td class="amount">${currencySymbol}${Number(e.amount).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td class="amount">${currencySymbol}${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <p class="footer">
          ${regularExpenses.length} expense${regularExpenses.length !== 1 ? 's' : ''} • 
          Exported from Expense Tracker
        </p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }

    toast.success('PDF ready for printing');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">CSV</span>
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF}>
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  );
}
