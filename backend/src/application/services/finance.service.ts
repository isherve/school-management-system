import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma.client.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app.error.js';
import {
  getPaginationParams,
  buildPaginatedResult,
  generateInvoiceNumber,
  generateReceiptNumber,
} from '../../shared/utils/index.js';

export class FinanceService {
  async getFeeStructures(schoolId: string) {
    return prisma.feeStructure.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createFeeStructure(schoolId: string, data: {
    name: string;
    description?: string;
    classId?: string;
    amount: number;
    frequency?: string;
    dueDate?: string;
  }) {
    return prisma.feeStructure.create({
      data: {
        schoolId,
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async getInvoices(schoolId: string, query: Record<string, unknown>) {
    const { page, limit, sortBy, sortOrder, search } = getPaginationParams(query);
    const status = query.status as InvoiceStatus | undefined;
    const studentId = query.studentId as string | undefined;

    const where: Prisma.FeeInvoiceWhereInput = {
      student: { schoolId },
      ...(status && { status }),
      ...(studentId && { studentId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { student: { user: { firstName: { contains: search } } } },
          { student: { user: { lastName: { contains: search } } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.feeInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              class: { select: { name: true } },
            },
          },
          feeStructure: { select: { name: true } },
          payments: true,
        },
      }),
      prisma.feeInvoice.count({ where }),
    ]);

    return buildPaginatedResult(invoices, total, page, limit);
  }

  async createInvoice(data: {
    studentId: string;
    feeStructureId?: string;
    termId?: string;
    amount: number;
    discount?: number;
    scholarship?: number;
    dueDate?: string;
  }) {
    const discount = data.discount || 0;
    const scholarship = data.scholarship || 0;
    const totalAmount = data.amount - discount - scholarship;

    return prisma.feeInvoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        termId: data.termId,
        amount: data.amount,
        discount,
        scholarship,
        totalAmount,
        balance: totalAmount,
        status: 'SENT',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  async recordPayment(invoiceId: string, data: {
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    receivedBy?: string;
    notes?: string;
  }) {
    const invoice = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError('Invoice');

    if (data.amount <= 0) throw new ValidationError('Payment amount must be positive');
    if (data.amount > Number(invoice.balance)) {
      throw new ValidationError('Payment exceeds outstanding balance');
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          receiptNumber: generateReceiptNumber(),
          amount: data.amount,
          method: data.method,
          transactionId: data.transactionId,
          receivedBy: data.receivedBy,
          notes: data.notes,
        },
      });

      const newPaidAmount = Number(invoice.paidAmount) + data.amount;
      const newBalance = Number(invoice.totalAmount) - newPaidAmount;
      let status: InvoiceStatus = 'PARTIAL';
      if (newBalance <= 0) status = 'PAID';
      else if (new Date() > (invoice.dueDate || new Date())) status = 'OVERDUE';

      await tx.feeInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balance: Math.max(0, newBalance),
          status,
        },
      });

      return payment;
    });
  }

  async getFinancialSummary(schoolId: string) {
    const [invoices, expenses, payments] = await Promise.all([
      prisma.feeInvoice.findMany({
        where: { student: { schoolId } },
        select: { totalAmount: true, paidAmount: true, balance: true, status: true },
      }),
      prisma.expense.aggregate({
        where: { schoolId },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { invoice: { student: { schoolId } } },
        select: { amount: true, paidAt: true, method: true },
      }),
    ]);

    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balance), 0);
    const totalExpenses = Number(expenses._sum.amount || 0);

    return {
      totalRevenue,
      totalOutstanding,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      invoiceStats: {
        total: invoices.length,
        paid: invoices.filter((i) => i.status === 'PAID').length,
        partial: invoices.filter((i) => i.status === 'PARTIAL').length,
        overdue: invoices.filter((i) => i.status === 'OVERDUE').length,
      },
      recentPayments: payments.slice(-10),
    };
  }
}

export const financeService = new FinanceService();
