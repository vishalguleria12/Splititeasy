import { Button } from '@/components/ui/button';
import { ExpenseRecord } from '@/hooks/useExpenses';
import { categoryLabels, formatDate } from '@/lib/expense-data';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  expenses: ExpenseRecord[];
}

export function ExportButtons({ expenses }: ExportButtonsProps) {
  const exportCSV = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency'];
    const rows = expenses.map((e) => [
      formatDate(new Date(e.date)),
      `"${e.description.replace(/"/g, '""')}"`,
      categoryLabels[e.category] || e.category,
      e.amount.toFixed(2),
      e.currency,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exported successfully');
  };

  const exportPDF = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    // Create printable HTML
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currencies = [...new Set(expenses.map((e) => e.currency))];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0d9488; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f0fdfa; }
          .total { font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Expense Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((e) => `
              <tr>
                <td>${formatDate(new Date(e.date))}</td>
                <td>${e.description}</td>
                <td>${categoryLabels[e.category] || e.category}</td>
                <td>${e.amount.toFixed(2)} ${e.currency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">Total: ${total.toFixed(2)} ${currencies.length === 1 ? currencies[0] : '(multiple currencies)'}</p>
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
