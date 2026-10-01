import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, AlertCircle, Receipt, Plus, CreditCard } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { financeApi, studentApi } from '@/services/endpoints';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { useTranslation } from '@/i18n';

export function FinancePage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const currency = useAppStore((s) => s.currency);
  const fmt = (n: number) => formatCurrency(n, currency);

  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', amount: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'CASH' });

  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: financeApi.getSummary,
  });

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => financeApi.getInvoices({ limit: '20' }),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-list-finance'],
    queryFn: () => studentApi.getAll({ limit: '100' }),
    enabled: showInvoice,
  });

  const createInvoice = useMutation({
    mutationFn: () =>
      financeApi.createInvoice({
        studentId: invoiceForm.studentId,
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setShowInvoice(false);
      setInvoiceForm({ studentId: '', amount: '', dueDate: '' });
    },
  });

  const recordPayment = useMutation({
    mutationFn: () =>
      financeApi.recordPayment(showPayment!, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      setShowPayment(null);
      setPaymentForm({ amount: '', method: 'CASH' });
    },
  });

  const invoices = invoicesData?.data || [];
  const students = studentsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('finance.title')}</h1>
          <p className="text-muted-foreground">{t('finance.subtitle')}</p>
        </div>
        <Button onClick={() => setShowInvoice(true)}>
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={fmt(summary?.totalRevenue || 0)} icon={Wallet} />
        <StatCard title="Outstanding" value={fmt(summary?.totalOutstanding || 0)} icon={AlertCircle} />
        <StatCard title="Expenses" value={fmt(summary?.totalExpenses || 0)} icon={Receipt} />
        <StatCard title="Net Income" value={fmt(summary?.netIncome || 0)} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices yet. Create one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Invoice</th>
                    <th className="text-left py-3 px-2 font-medium">Student</th>
                    <th className="text-left py-3 px-2 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 font-medium">Balance</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-right py-3 px-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: {
                    id: string;
                    invoiceNumber: string;
                    totalAmount: number;
                    balance: number;
                    status: string;
                    student: { user: { firstName: string; lastName: string } };
                  }) => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="py-3 px-2">{inv.student.user.firstName} {inv.student.user.lastName}</td>
                      <td className="py-3 px-2 font-medium">{fmt(Number(inv.totalAmount))}</td>
                      <td className="py-3 px-2">{fmt(Number(inv.balance))}</td>
                      <td className="py-3 px-2"><StatusBadge status={inv.status} /></td>
                      <td className="py-3 px-2 text-right">
                        {inv.status !== 'PAID' && Number(inv.balance) > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setShowPayment(inv.id)}>
                            <CreditCard className="h-3 w-3" /> Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showInvoice} onClose={() => setShowInvoice(false)} title="Create Invoice">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Student</label>
            <select
              value={invoiceForm.studentId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select student...</option>
              {students.map((s: { id: string; user: { firstName: string; lastName: string }; admissionNumber: string }) => (
                <option key={s.id} value={s.id}>
                  {s.user.firstName} {s.user.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>
          <Input
            label={`Amount (${currency})`}
            type="number"
            value={invoiceForm.amount}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
            placeholder="500000"
          />
          <Input
            label="Due Date"
            type="date"
            value={invoiceForm.dueDate}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => createInvoice.mutate()}
              disabled={!invoiceForm.studentId || !invoiceForm.amount || createInvoice.isPending}
            >
              {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button variant="outline" onClick={() => setShowInvoice(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title="Record Payment">
        <div className="space-y-4">
          <Input
            label={`Payment Amount (${currency})`}
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Payment Method</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => recordPayment.mutate()}
              disabled={!paymentForm.amount || recordPayment.isPending}
            >
              {recordPayment.isPending ? 'Processing...' : 'Record Payment'}
            </Button>
            <Button variant="outline" onClick={() => setShowPayment(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
