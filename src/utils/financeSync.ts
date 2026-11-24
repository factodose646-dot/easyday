import { Language } from '../types';
import {
  computeNextBillDueDate,
  markBillAsPaidWithRecurrence,
  roundCurrency,
} from './billsEngine';
import {
  BillItem,
  BillPaymentRecord,
  billsStorage,
  generateId,
  getStorageErrorMessage,
  getTodayISO,
  StorageWriteResult,
  TransactionItem,
  transactionsStorage,
  UdhaarContact,
  UdhaarDirection,
  UdhaarPayment,
  udhaarStorage,
  UdhaarTransaction,
} from './storage';
import {
  getTransactionPaidAmount,
  getTransactionRemaining,
} from './udhaarEngine';

export const FINANCE_UPDATED_EVENT = 'easyday:finance-updated';

export function emitFinanceUpdatedEvent(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(FINANCE_UPDATED_EVENT));
    } catch {
      // Ignore event dispatch errors in restricted environments
    }
  }
}

export function isUdhaarRepaymentTransaction(
  tx: Pick<TransactionItem, 'accountingKind' | 'category'>
): boolean {
  return (
    tx.accountingKind === 'udhaar_repaid' || tx.category === 'udhaar_repayment'
  );
}

export function isUdhaarCollectionTransaction(
  tx: Pick<TransactionItem, 'accountingKind' | 'category'>
): boolean {
  return (
    tx.accountingKind === 'udhaar_collected' ||
    tx.category === 'udhaar_collection'
  );
}

export function isCountedAsExpense(
  tx: Pick<TransactionItem, 'type' | 'accountingKind' | 'category'>
): boolean {
  return tx.type === 'expense' && !isUdhaarRepaymentTransaction(tx);
}

export function isCountedAsEarnedIncome(
  tx: Pick<TransactionItem, 'type' | 'accountingKind' | 'category'>
): boolean {
  return tx.type === 'income' && !isUdhaarCollectionTransaction(tx);
}

export function buildBillExpenseDescription(
  bill: Pick<BillItem, 'name' | 'provider'>
): string {
  const cleanName = bill.name.trim();
  const cleanProvider = bill.provider.trim();
  return cleanProvider ? `${cleanName} (${cleanProvider})` : cleanName;
}

export function buildUdhaarPaymentDescription(
  contactName: string,
  direction: UdhaarDirection,
  note: string,
  originalDescription: string
): string {
  const prefix =
    direction === 'given' ? 'Udhaar Collected' : 'Udhaar Repaid';
  const namePart = contactName.trim() || 'Contact';
  const detail = note.trim() || originalDescription.trim();
  return detail
    ? `${prefix} · ${namePart} (${detail})`
    : `${prefix} · ${namePart}`;
}

export function findLinkedExpenseForBill(
  expenses: TransactionItem[],
  bill: Pick<BillItem, 'id' | 'linkedExpenseId'>
): TransactionItem | undefined {
  return expenses.find(
    (tx) =>
      (tx.sourceType === 'bill' && tx.sourceId === bill.id) ||
      (Boolean(bill.linkedExpenseId) && tx.id === bill.linkedExpenseId)
  );
}

export function findLinkedBillForExpense(
  bills: BillItem[],
  tx: Pick<TransactionItem, 'id' | 'sourceType' | 'sourceId'>
): BillItem | undefined {
  if (tx.sourceType !== 'bill') return undefined;
  return bills.find(
    (b) => b.id === tx.sourceId || b.linkedExpenseId === tx.id
  );
}

export function findLinkedUdhaarForExpense(
  udhaarTxs: UdhaarTransaction[],
  tx: Pick<TransactionItem, 'id' | 'sourceType' | 'sourceId' | 'parentSourceId'>
): { udhaarTx: UdhaarTransaction; payment: UdhaarPayment } | undefined {
  if (tx.sourceType !== 'udhaar_payment') return undefined;
  for (const utx of udhaarTxs) {
    if (tx.parentSourceId && utx.id !== tx.parentSourceId) continue;
    const matchPay = utx.payments.find(
      (p) =>
        (tx.sourceId && p.id === tx.sourceId) ||
        p.linkedTransactionId === tx.id
    );
    if (matchPay) {
      return { udhaarTx: utx, payment: matchPay };
    }
  }
  // Fallback scan ignoring parentSourceId if legacy/edited
  for (const utx of udhaarTxs) {
    const matchPay = utx.payments.find(
      (p) =>
        (tx.sourceId && p.id === tx.sourceId) ||
        p.linkedTransactionId === tx.id
    );
    if (matchPay) {
      return { udhaarTx: utx, payment: matchPay };
    }
  }
  return undefined;
}

export function findLinkedTransactionForUdhaarPayment(
  expenses: TransactionItem[],
  payment: Pick<UdhaarPayment, 'id' | 'linkedTransactionId'>,
  udhaarTxId?: string
): TransactionItem | undefined {
  return expenses.find(
    (tx) =>
      (tx.sourceType === 'udhaar_payment' &&
        (tx.sourceId === payment.id ||
          (Boolean(udhaarTxId) &&
            tx.parentSourceId === udhaarTxId &&
            tx.id === payment.linkedTransactionId))) ||
      (Boolean(payment.linkedTransactionId) &&
        tx.id === payment.linkedTransactionId)
  );
}

export interface MarkBillPaidSyncResult {
  changed: boolean;
  alreadyPaid: boolean;
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
  generatedNextBill: BillItem | null;
  linkedExpense: TransactionItem | null;
}

/**
 * Marks an unpaid bill as Paid, schedules its next recurring bill if configured,
 * and creates (or idempotently links) ONE corresponding Expense entry.
 */
export function syncMarkBillPaid(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  expenses: TransactionItem[],
  billId: string,
  paidDateISO: string,
  note = ''
): MarkBillPaidSyncResult {
  const target = bills.find((b) => b.id === billId);
  if (!target) {
    return {
      changed: false,
      alreadyPaid: false,
      bills,
      payments,
      expenses,
      generatedNextBill: null,
      linkedExpense: null,
    };
  }

  // Strict idempotency / duplicate-tap protection
  if (target.status === 'paid') {
    const existingExp = findLinkedExpenseForBill(expenses, target) || null;
    return {
      changed: false,
      alreadyPaid: true,
      bills,
      payments,
      expenses,
      generatedNextBill: null,
      linkedExpense: existingExp,
    };
  }

  const baseResult = markBillAsPaidWithRecurrence(
    bills,
    payments,
    billId,
    paidDateISO,
    note
  );

  // Check if an expense with permanent sourceType='bill' & sourceId=billId already exists
  const existingExpense = findLinkedExpenseForBill(expenses, target);
  const createdPaymentRecord = baseResult.payments.find(
    (p) => p.billId === target.id && p.paidAt === baseResult.bills.find((b) => b.id === target.id)?.paidAt
  );
  const now = Date.now();
  const expenseAmount = roundCurrency(target.amount);
  const expenseDescription = buildBillExpenseDescription(target);

  let linkedExpense: TransactionItem;
  let nextExpenses: TransactionItem[];

  if (existingExpense) {
    linkedExpense = {
      ...existingExpense,
      type: 'expense',
      amount: expenseAmount,
      description: expenseDescription,
      category: 'bills',
      date: paidDateISO,
      sourceType: 'bill',
      sourceId: target.id,
      parentSourceId: target.seriesId,
      billPaymentId: createdPaymentRecord?.id ?? existingExpense.billPaymentId,
      accountingKind: 'bill_payment',
      updatedAt: now,
    };
    nextExpenses = expenses.map((tx) =>
      tx.id === existingExpense.id ? linkedExpense : tx
    );
  } else {
    linkedExpense = {
      id: generateId('tx'),
      type: 'expense',
      amount: expenseAmount,
      description: expenseDescription,
      category: 'bills',
      date: paidDateISO,
      createdAt: now,
      updatedAt: now,
      sourceType: 'bill',
      sourceId: target.id,
      parentSourceId: target.seriesId,
      billPaymentId: createdPaymentRecord?.id,
      accountingKind: 'bill_payment',
    };
    nextExpenses = [linkedExpense, ...expenses];
  }

  const nextBills = baseResult.bills.map((b) =>
    b.id === billId ? { ...b, linkedExpenseId: linkedExpense.id } : b
  );
  const nextPayments = baseResult.payments.map((p) =>
    createdPaymentRecord && p.id === createdPaymentRecord.id
      ? { ...p, linkedExpenseId: linkedExpense.id }
      : p
  );

  return {
    changed: true,
    alreadyPaid: false,
    bills: nextBills,
    payments: nextPayments,
    expenses: nextExpenses,
    generatedNextBill: baseResult.generatedNextBill,
    linkedExpense,
  };
}

/**
 * Updates a bill and, if it is already paid, cleanly synchronizes its linked
 * expense entry and matching BillPaymentRecord without duplicating records.
 */
export function syncEditBill(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  expenses: TransactionItem[],
  updatedBill: BillItem
): {
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
  linkedExpenseUpdated: boolean;
} {
  const now = Date.now();
  const nextBills = bills.map((b) =>
    b.id === updatedBill.id ? { ...updatedBill, updatedAt: now } : b
  );

  const nextPayments = payments.map((p) =>
    p.billId === updatedBill.id
      ? {
          ...p,
          billName: updatedBill.name,
          category: updatedBill.category,
          provider: updatedBill.provider,
          amount: updatedBill.amount,
          dueDate: updatedBill.dueDate,
        }
      : p
  );

  let linkedExpenseUpdated = false;
  let nextExpenses = expenses;

  if (updatedBill.status === 'paid') {
    const linkedExpense = findLinkedExpenseForBill(expenses, updatedBill);
    if (linkedExpense) {
      linkedExpenseUpdated = true;
      nextExpenses = expenses.map((tx) =>
        tx.id === linkedExpense.id
          ? {
              ...tx,
              amount: roundCurrency(updatedBill.amount),
              description: buildBillExpenseDescription(updatedBill),
              category: 'bills',
              date: updatedBill.paidDate || tx.date,
              sourceType: 'bill',
              sourceId: updatedBill.id,
              parentSourceId: updatedBill.seriesId,
              accountingKind: 'bill_payment',
              updatedAt: now,
            }
          : tx
      );
    }
  }

  return {
    bills: nextBills,
    payments: nextPayments,
    expenses: nextExpenses,
    linkedExpenseUpdated,
  };
}

/**
 * Reverts a Paid bill back to Pending/Unpaid and handles its linked expense
 * consistently ('remove' deletes ONLY its linked expense; 'keep' unlinks it safely).
 */
export function syncMarkBillUnpaid(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  expenses: TransactionItem[],
  billId: string,
  expenseAction: 'remove' | 'keep' = 'remove'
): {
  changed: boolean;
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
} {
  const target = bills.find((b) => b.id === billId);
  if (!target || target.status !== 'paid') {
    return { changed: false, bills, payments, expenses };
  }

  const now = Date.now();
  const linkedExpense = findLinkedExpenseForBill(expenses, target);

  const nextBills = bills.map((b) => {
    if (b.id !== billId) return b;
    const copy: BillItem = {
      ...b,
      status: 'pending',
      updatedAt: now,
    };
    delete copy.paidAt;
    delete copy.paidDate;
    delete copy.linkedExpenseId;
    return copy;
  });

  // Also check if a future recurring unpaid cycle exists; keep nextCycleGenerated
  // consistent with whether a next cycle is actually present so marking Paid later doesn't duplicate it
  const nextDue = computeNextBillDueDate(
    target.dueDate,
    target.repeat,
    target.customIntervalDays
  );
  const reconciledBills = nextBills.map((b) => {
    if (b.id !== billId) return b;
    const stillHasNext =
      nextDue !== null &&
      nextBills.some(
        (other) =>
          other.id !== b.id &&
          other.seriesId === b.seriesId &&
          other.dueDate === nextDue
      );
    return { ...b, nextCycleGenerated: stillHasNext };
  });

  const nextPayments = payments.filter((p) => p.billId !== billId);

  let nextExpenses = expenses;
  if (linkedExpense) {
    if (expenseAction === 'remove') {
      nextExpenses = expenses.filter((tx) => tx.id !== linkedExpense.id);
    } else {
      nextExpenses = expenses.map((tx) => {
        if (tx.id !== linkedExpense.id) return tx;
        const copy: TransactionItem = {
          ...tx,
          sourceType: 'manual',
          accountingKind: 'standard',
          updatedAt: now,
        };
        delete copy.sourceId;
        delete copy.parentSourceId;
        delete copy.billPaymentId;
        return copy;
      });
    }
  }

  return {
    changed: true,
    bills: reconciledBills,
    payments: nextPayments,
    expenses: nextExpenses,
  };
}

/**
 * Deletes a bill and safely handles its linked expense & payment record.
 * Never deletes unrelated expenses.
 */
export function syncDeleteBill(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  expenses: TransactionItem[],
  billId: string,
  expenseAction: 'remove' | 'keep' = 'keep'
): {
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
  removedBill: BillItem | undefined;
} {
  const removedBill = bills.find((b) => b.id === billId);
  if (!removedBill) {
    return { bills, payments, expenses, removedBill: undefined };
  }

  const now = Date.now();
  const linkedExpense = findLinkedExpenseForBill(expenses, removedBill);
  const nextBills = bills.filter((b) => b.id !== billId);
  const nextPayments = payments.filter((p) => p.billId !== billId);

  let nextExpenses = expenses;
  if (linkedExpense) {
    if (expenseAction === 'remove') {
      nextExpenses = expenses.filter((tx) => tx.id !== linkedExpense.id);
    } else {
      nextExpenses = expenses.map((tx) => {
        if (tx.id !== linkedExpense.id) return tx;
        const copy: TransactionItem = {
          ...tx,
          sourceType: 'manual',
          accountingKind: 'standard',
          updatedAt: now,
        };
        delete copy.sourceId;
        delete copy.parentSourceId;
        delete copy.billPaymentId;
        return copy;
      });
    }
  }

  return { bills: nextBills, payments: nextPayments, expenses: nextExpenses, removedBill };
}

export interface AddUdhaarPaymentSyncResult {
  changed: boolean;
  duplicateBlocked: boolean;
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
  createdPayment: UdhaarPayment | null;
  createdCashTransaction: TransactionItem | null;
}

/**
 * Records a partial or full payment against an Udhaar transaction and
 * creates ONE linked cashflow entry with proper accounting categorization:
 * - 'given' (Lena Hai collection) -> type: 'income', category: 'udhaar_collection', accountingKind: 'udhaar_collected'
 * - 'borrowed' (Dena Hai repayment) -> type: 'expense', category: 'udhaar_repayment', accountingKind: 'udhaar_repaid'
 *   (excluded from purchase/bill Total Expenses so debt repayment never inflates expenses!)
 */
export function syncAddUdhaarPayment(
  udhaarTransactions: UdhaarTransaction[],
  contacts: UdhaarContact[],
  expenses: TransactionItem[],
  txId: string,
  rawAmount: number,
  dateISO: string,
  note: string,
  explicitPaymentId?: string
): AddUdhaarPaymentSyncResult {
  const targetTx = udhaarTransactions.find((t) => t.id === txId);
  if (!targetTx) {
    return {
      changed: false,
      duplicateBlocked: false,
      udhaarTransactions,
      expenses,
      createdPayment: null,
      createdCashTransaction: null,
    };
  }

  const remaining = getTransactionRemaining(targetTx);
  if (remaining <= 0.009) {
    return {
      changed: false,
      duplicateBlocked: true,
      udhaarTransactions,
      expenses,
      createdPayment: null,
      createdCashTransaction: null,
    };
  }

  if (
    explicitPaymentId &&
    targetTx.payments.some((p) => p.id === explicitPaymentId)
  ) {
    return {
      changed: false,
      duplicateBlocked: true,
      udhaarTransactions,
      expenses,
      createdPayment: null,
      createdCashTransaction: null,
    };
  }

  const payAmount = Math.min(roundCurrency(rawAmount), remaining);
  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    return {
      changed: false,
      duplicateBlocked: false,
      udhaarTransactions,
      expenses,
      createdPayment: null,
      createdCashTransaction: null,
    };
  }

  const now = Date.now();
  const paymentId = explicitPaymentId || generateId('upay');
  const contact = contacts.find((c) => c.id === targetTx.contactId);
  const cashTxId = generateId('tx');
  const isCollection = targetTx.direction === 'given';

  const newPayment: UdhaarPayment = {
    id: paymentId,
    amount: payAmount,
    date: dateISO,
    note: note.trim(),
    createdAt: now,
    updatedAt: now,
    linkedTransactionId: cashTxId,
  };

  const createdCashTransaction: TransactionItem = {
    id: cashTxId,
    type: isCollection ? 'income' : 'expense',
    amount: payAmount,
    description: buildUdhaarPaymentDescription(
      contact?.name || '',
      targetTx.direction,
      note,
      targetTx.description
    ),
    category: isCollection ? 'udhaar_collection' : 'udhaar_repayment',
    date: dateISO,
    createdAt: now,
    updatedAt: now,
    sourceType: 'udhaar_payment',
    sourceId: paymentId,
    parentSourceId: targetTx.id,
    accountingKind: isCollection ? 'udhaar_collected' : 'udhaar_repaid',
  };

  const nextUdhaarTxs = udhaarTransactions.map((tx) => {
    if (tx.id !== txId) return tx;
    const updatedPayments = [newPayment, ...tx.payments];
    const totalPaid = roundCurrency(
      updatedPayments.reduce((s, p) => s + (p.amount > 0 ? p.amount : 0), 0)
    );
    return {
      ...tx,
      payments: updatedPayments,
      paidAmount: Math.min(tx.amount, totalPaid),
      updatedAt: now,
    };
  });

  // Prevent any duplicate cash transaction linked to same paymentId
  const alreadyHasCash = expenses.some(
    (e) => e.sourceType === 'udhaar_payment' && e.sourceId === paymentId
  );
  const nextExpenses = alreadyHasCash
    ? expenses
    : [createdCashTransaction, ...expenses];

  return {
    changed: true,
    duplicateBlocked: false,
    udhaarTransactions: nextUdhaarTxs,
    expenses: nextExpenses,
    createdPayment: newPayment,
    createdCashTransaction: alreadyHasCash ? null : createdCashTransaction,
  };
}

export function syncEditUdhaarEntry(
  udhaarTransactions: UdhaarTransaction[],
  contacts: UdhaarContact[],
  expenses: TransactionItem[],
  updatedEntry: UdhaarTransaction
): {
  ok: boolean;
  paidAmountConflict?: number;
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const existing = udhaarTransactions.find((tx) => tx.id === updatedEntry.id);
  if (!existing) {
    return {
      ok: true,
      udhaarTransactions,
      expenses,
    };
  }

  const paidFromHistory = getTransactionPaidAmount(existing);
  if (roundCurrency(updatedEntry.amount) < paidFromHistory - 0.009) {
    return {
      ok: false,
      paidAmountConflict: paidFromHistory,
      udhaarTransactions,
      expenses,
    };
  }

  const now = Date.now();
  const nextUdhaarTxs = udhaarTransactions.map((tx) =>
    tx.id === updatedEntry.id
      ? {
          ...updatedEntry,
          amount: roundCurrency(updatedEntry.amount),
          paidAmount: Math.min(roundCurrency(updatedEntry.amount), paidFromHistory),
          payments: existing.payments,
          updatedAt: now,
        }
      : tx
  );

  const contact = contacts.find((c) => c.id === updatedEntry.contactId);
  const paymentById = new Map(existing.payments.map((p) => [p.id, p]));
  const isCollection = updatedEntry.direction === 'given';

  const nextExpenses = expenses.map((tx) => {
    if (
      tx.sourceType !== 'udhaar_payment' ||
      tx.parentSourceId !== updatedEntry.id
    ) {
      return tx;
    }
    const matchingPay = tx.sourceId ? paymentById.get(tx.sourceId) : undefined;
    return {
      ...tx,
      type: isCollection ? ('income' as const) : ('expense' as const),
      category: isCollection
        ? ('udhaar_collection' as const)
        : ('udhaar_repayment' as const),
      accountingKind: isCollection
        ? ('udhaar_collected' as const)
        : ('udhaar_repaid' as const),
      description: buildUdhaarPaymentDescription(
        contact?.name || '',
        updatedEntry.direction,
        matchingPay?.note || '',
        updatedEntry.description
      ),
      updatedAt: now,
    };
  });

  return {
    ok: true,
    udhaarTransactions: nextUdhaarTxs,
    expenses: nextExpenses,
  };
}

export function syncDeleteUdhaarPayment(
  udhaarTransactions: UdhaarTransaction[],
  expenses: TransactionItem[],
  txId: string,
  paymentId: string
): {
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const now = Date.now();
  const targetTx = udhaarTransactions.find((tx) => tx.id === txId);
  const targetPay = targetTx?.payments.find((p) => p.id === paymentId);

  const nextUdhaarTxs = udhaarTransactions.map((tx) => {
    if (tx.id !== txId) return tx;
    const remainingPayments = tx.payments.filter((p) => p.id !== paymentId);
    const totalPaid = roundCurrency(
      remainingPayments.reduce((s, p) => s + (p.amount > 0 ? p.amount : 0), 0)
    );
    return {
      ...tx,
      payments: remainingPayments,
      paidAmount: Math.min(tx.amount, totalPaid),
      updatedAt: now,
    };
  });

  const nextExpenses = expenses.filter(
    (exp) =>
      !(
        (exp.sourceType === 'udhaar_payment' && exp.sourceId === paymentId) ||
        (targetPay?.linkedTransactionId &&
          exp.id === targetPay.linkedTransactionId)
      )
  );

  return {
    udhaarTransactions: nextUdhaarTxs,
    expenses: nextExpenses,
  };
}

export function syncDeleteUdhaarEntry(
  udhaarTransactions: UdhaarTransaction[],
  expenses: TransactionItem[],
  txId: string
): {
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const targetTx = udhaarTransactions.find((tx) => tx.id === txId);
  const paymentIds = new Set(targetTx?.payments.map((p) => p.id) ?? []);
  const linkedTxIds = new Set(
    targetTx?.payments
      .map((p) => p.linkedTransactionId)
      .filter((id): id is string => Boolean(id)) ?? []
  );

  const nextUdhaarTxs = udhaarTransactions.filter((tx) => tx.id !== txId);
  const nextExpenses = expenses.filter(
    (exp) =>
      !(
        (exp.sourceType === 'udhaar_payment' &&
          (exp.parentSourceId === txId ||
            (exp.sourceId && paymentIds.has(exp.sourceId)))) ||
        linkedTxIds.has(exp.id)
      )
  );

  return {
    udhaarTransactions: nextUdhaarTxs,
    expenses: nextExpenses,
  };
}

export function syncDeleteUdhaarContact(
  contacts: UdhaarContact[],
  udhaarTransactions: UdhaarTransaction[],
  expenses: TransactionItem[],
  contactId: string
): {
  contacts: UdhaarContact[];
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const personTxs = udhaarTransactions.filter((tx) => tx.contactId === contactId);
  const personTxIds = new Set(personTxs.map((tx) => tx.id));
  const paymentIds = new Set<string>();
  const linkedTxIds = new Set<string>();

  for (const tx of personTxs) {
    for (const p of tx.payments) {
      paymentIds.add(p.id);
      if (p.linkedTransactionId) linkedTxIds.add(p.linkedTransactionId);
    }
  }

  return {
    contacts: contacts.filter((c) => c.id !== contactId),
    udhaarTransactions: udhaarTransactions.filter(
      (tx) => tx.contactId !== contactId
    ),
    expenses: expenses.filter(
      (exp) =>
        !(
          (exp.sourceType === 'udhaar_payment' &&
            ((exp.parentSourceId && personTxIds.has(exp.parentSourceId)) ||
              (exp.sourceId && paymentIds.has(exp.sourceId)))) ||
          linkedTxIds.has(exp.id)
        )
    ),
  };
}

/**
 * Bi-directional safe editing when a user edits a linked expense/cashflow item
 * from inside ExpenseTrackerTool.
 */
export function syncEditFromExpenseTracker(
  expenses: TransactionItem[],
  bills: BillItem[],
  billPayments: BillPaymentRecord[],
  udhaarTransactions: UdhaarTransaction[],
  updatedTx: TransactionItem
): {
  ok: boolean;
  maxAllowedUdhaarPayment?: number;
  expenses: TransactionItem[];
  bills: BillItem[];
  billPayments: BillPaymentRecord[];
  udhaarTransactions: UdhaarTransaction[];
} {
  const now = Date.now();
  let nextBills = bills;
  let nextBillPayments = billPayments;
  let nextUdhaarTxs = udhaarTransactions;

  if (updatedTx.sourceType === 'udhaar_payment') {
    const match = findLinkedUdhaarForExpense(udhaarTransactions, updatedTx);
    if (match) {
      const otherPaid = roundCurrency(
        match.udhaarTx.payments
          .filter((p) => p.id !== match.payment.id)
          .reduce((s, p) => s + (p.amount > 0 ? p.amount : 0), 0)
      );
      const maxAllowed = Math.max(
        0,
        roundCurrency(match.udhaarTx.amount - otherPaid)
      );
      if (roundCurrency(updatedTx.amount) > maxAllowed + 0.009) {
        return {
          ok: false,
          maxAllowedUdhaarPayment: maxAllowed,
          expenses,
          bills,
          billPayments,
          udhaarTransactions,
        };
      }

      nextUdhaarTxs = udhaarTransactions.map((utx) => {
        if (utx.id !== match.udhaarTx.id) return utx;
        const nextPays = utx.payments.map((p) =>
          p.id === match.payment.id
            ? {
                ...p,
                amount: roundCurrency(updatedTx.amount),
                date: updatedTx.date,
                updatedAt: now,
              }
            : p
        );
        const totalPaid = roundCurrency(
          nextPays.reduce((s, p) => s + (p.amount > 0 ? p.amount : 0), 0)
        );
        return {
          ...utx,
          payments: nextPays,
          paidAmount: Math.min(utx.amount, totalPaid),
          updatedAt: now,
        };
      });
    }
  } else if (updatedTx.sourceType === 'bill') {
    const linkedBill = findLinkedBillForExpense(bills, updatedTx);
    if (linkedBill) {
      nextBills = bills.map((b) =>
        b.id === linkedBill.id
          ? {
              ...b,
              amount: roundCurrency(updatedTx.amount),
              paidDate: b.status === 'paid' ? updatedTx.date : b.paidDate,
              updatedAt: now,
            }
          : b
      );
      nextBillPayments = billPayments.map((bp) =>
        bp.billId === linkedBill.id
          ? {
              ...bp,
              amount: roundCurrency(updatedTx.amount),
              paidDate: updatedTx.date,
            }
          : bp
      );
    }
  }

  const nextExpenses = expenses.map((tx) =>
    tx.id === updatedTx.id
      ? {
          ...updatedTx,
          amount: roundCurrency(updatedTx.amount),
          updatedAt: now,
        }
      : tx
  );

  return {
    ok: true,
    expenses: nextExpenses,
    bills: nextBills,
    billPayments: nextBillPayments,
    udhaarTransactions: nextUdhaarTxs,
  };
}

/**
 * Bi-directional safe deletion when a user deletes a linked item from
 * inside ExpenseTrackerTool.
 */
export function syncDeleteFromExpenseTracker(
  expenses: TransactionItem[],
  bills: BillItem[],
  billPayments: BillPaymentRecord[],
  udhaarTransactions: UdhaarTransaction[],
  txId: string,
  billAction: 'unpay' | 'unlink' = 'unlink'
): {
  expenses: TransactionItem[];
  bills: BillItem[];
  billPayments: BillPaymentRecord[];
  udhaarTransactions: UdhaarTransaction[];
} {
  const target = expenses.find((tx) => tx.id === txId);
  if (!target) {
    return { expenses, bills, billPayments, udhaarTransactions };
  }

  if (target.sourceType === 'bill') {
    const linkedBill = findLinkedBillForExpense(bills, target);
    if (linkedBill) {
      if (billAction === 'unpay') {
        const res = syncMarkBillUnpaid(
          bills,
          billPayments,
          expenses,
          linkedBill.id,
          'remove'
        );
        return {
          expenses: res.expenses.filter((tx) => tx.id !== txId),
          bills: res.bills,
          billPayments: res.payments,
          udhaarTransactions,
        };
      }
      // 'unlink': delete only the expense and clear linkedExpenseId on bill
      const nextBills = bills.map((b) => {
        if (b.id !== linkedBill.id) return b;
        const copy = { ...b, updatedAt: Date.now() };
        delete copy.linkedExpenseId;
        return copy;
      });
      const nextBillPayments = billPayments.map((bp) => {
        if (bp.billId !== linkedBill.id) return bp;
        const copy = { ...bp };
        delete copy.linkedExpenseId;
        return copy;
      });
      return {
        expenses: expenses.filter((tx) => tx.id !== txId),
        bills: nextBills,
        billPayments: nextBillPayments,
        udhaarTransactions,
      };
    }
  }

  if (target.sourceType === 'udhaar_payment') {
    const match = findLinkedUdhaarForExpense(udhaarTransactions, target);
    if (match) {
      const res = syncDeleteUdhaarPayment(
        udhaarTransactions,
        expenses,
        match.udhaarTx.id,
        match.payment.id
      );
      return {
        expenses: res.expenses.filter((tx) => tx.id !== txId),
        bills,
        billPayments,
        udhaarTransactions: res.udhaarTransactions,
      };
    }
  }

  return {
    expenses: expenses.filter((tx) => tx.id !== txId),
    bills,
    billPayments,
    udhaarTransactions,
  };
}

/**
 * Atomic multi-collection writer: if any save fails (e.g., QuotaExceededError),
 * restores all touched LocalStorage collections to their exact previous arrays.
 */
function commitMultiCollectionWrite(writes: {
  bills?: BillItem[];
  billPayments?: BillPaymentRecord[];
  expenses?: TransactionItem[];
  udhaarContacts?: UdhaarContact[];
  udhaarTransactions?: UdhaarTransaction[];
}): StorageWriteResult {
  const prevBills = writes.bills !== undefined ? billsStorage.loadBills() : undefined;
  const prevPayments =
    writes.billPayments !== undefined ? billsStorage.loadPayments() : undefined;
  const prevExpenses =
    writes.expenses !== undefined ? transactionsStorage.load() : undefined;
  const prevContacts =
    writes.udhaarContacts !== undefined ? udhaarStorage.loadContacts() : undefined;
  const prevUdhaarTxs =
    writes.udhaarTransactions !== undefined
      ? udhaarStorage.loadTransactions()
      : undefined;

  const applied: Array<() => void> = [];

  const rollbackAll = () => {
    for (let i = applied.length - 1; i >= 0; i -= 1) {
      applied[i]();
    }
  };

  if (writes.udhaarContacts !== undefined && prevContacts !== undefined) {
    const r = udhaarStorage.saveContacts(writes.udhaarContacts);
    if (!r.ok) {
      rollbackAll();
      return r;
    }
    applied.push(() => udhaarStorage.saveContacts(prevContacts));
  }

  if (writes.udhaarTransactions !== undefined && prevUdhaarTxs !== undefined) {
    const r = udhaarStorage.saveTransactions(writes.udhaarTransactions);
    if (!r.ok) {
      rollbackAll();
      return r;
    }
    applied.push(() => udhaarStorage.saveTransactions(prevUdhaarTxs));
  }

  if (writes.bills !== undefined && prevBills !== undefined) {
    const r = billsStorage.saveBills(writes.bills);
    if (!r.ok) {
      rollbackAll();
      return r;
    }
    applied.push(() => billsStorage.saveBills(prevBills));
  }

  if (writes.billPayments !== undefined && prevPayments !== undefined) {
    const r = billsStorage.savePayments(writes.billPayments);
    if (!r.ok) {
      rollbackAll();
      return r;
    }
    applied.push(() => billsStorage.savePayments(prevPayments));
  }

  if (writes.expenses !== undefined && prevExpenses !== undefined) {
    const r = transactionsStorage.save(writes.expenses);
    if (!r.ok) {
      rollbackAll();
      return r;
    }
    applied.push(() => transactionsStorage.save(prevExpenses));
  }

  emitFinanceUpdatedEvent();
  return { ok: true };
}

export function persistBillPaidSynced(
  billId: string,
  paidDateISO: string,
  language: Language,
  note = ''
): {
  ok: boolean;
  errorMessage?: string;
  result: MarkBillPaidSyncResult;
} {
  const bills = billsStorage.loadBills();
  const payments = billsStorage.loadPayments();
  const expenses = transactionsStorage.load();
  const result = syncMarkBillPaid(
    bills,
    payments,
    expenses,
    billId,
    paidDateISO,
    note
  );
  if (!result.changed) {
    return { ok: true, result };
  }
  const writeRes = commitMultiCollectionWrite({
    bills: result.bills,
    billPayments: result.payments,
    expenses: result.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      result: {
        ...result,
        changed: false,
        bills,
        payments,
        expenses,
      },
    };
  }
  return { ok: true, result };
}

export function persistBillEditedSynced(
  updatedBill: BillItem,
  language: Language
): {
  ok: boolean;
  errorMessage?: string;
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
} {
  const bills = billsStorage.loadBills();
  const payments = billsStorage.loadPayments();
  const expenses = transactionsStorage.load();
  const synced = syncEditBill(bills, payments, expenses, updatedBill);
  const writeRes = commitMultiCollectionWrite({
    bills: synced.bills,
    billPayments: synced.payments,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      bills,
      payments,
      expenses,
    };
  }
  return {
    ok: true,
    bills: synced.bills,
    payments: synced.payments,
    expenses: synced.expenses,
  };
}

export function persistBillUnpaidSynced(
  billId: string,
  expenseAction: 'remove' | 'keep',
  language: Language
): {
  ok: boolean;
  errorMessage?: string;
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
} {
  const bills = billsStorage.loadBills();
  const payments = billsStorage.loadPayments();
  const expenses = transactionsStorage.load();
  const synced = syncMarkBillUnpaid(
    bills,
    payments,
    expenses,
    billId,
    expenseAction
  );
  if (!synced.changed) {
    return { ok: true, bills, payments, expenses };
  }
  const writeRes = commitMultiCollectionWrite({
    bills: synced.bills,
    billPayments: synced.payments,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      bills,
      payments,
      expenses,
    };
  }
  return {
    ok: true,
    bills: synced.bills,
    payments: synced.payments,
    expenses: synced.expenses,
  };
}

export function persistBillDeletedSynced(
  billId: string,
  expenseAction: 'remove' | 'keep',
  language: Language
): {
  ok: boolean;
  errorMessage?: string;
  bills: BillItem[];
  payments: BillPaymentRecord[];
  expenses: TransactionItem[];
  removedBill?: BillItem;
} {
  const bills = billsStorage.loadBills();
  const payments = billsStorage.loadPayments();
  const expenses = transactionsStorage.load();
  const synced = syncDeleteBill(bills, payments, expenses, billId, expenseAction);
  if (!synced.removedBill) {
    return { ok: true, bills, payments, expenses };
  }
  const writeRes = commitMultiCollectionWrite({
    bills: synced.bills,
    billPayments: synced.payments,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      bills,
      payments,
      expenses,
    };
  }
  return {
    ok: true,
    bills: synced.bills,
    payments: synced.payments,
    expenses: synced.expenses,
    removedBill: synced.removedBill,
  };
}

export function persistUdhaarPaymentAddedSynced(
  txId: string,
  amount: number,
  dateISO: string,
  note: string,
  language: Language,
  explicitPaymentId?: string
): {
  ok: boolean;
  duplicateBlocked: boolean;
  errorMessage?: string;
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
  createdPayment: UdhaarPayment | null;
} {
  const udhaarTransactions = udhaarStorage.loadTransactions();
  const contacts = udhaarStorage.loadContacts();
  const expenses = transactionsStorage.load();
  const synced = syncAddUdhaarPayment(
    udhaarTransactions,
    contacts,
    expenses,
    txId,
    amount,
    dateISO,
    note,
    explicitPaymentId
  );
  if (!synced.changed) {
    return {
      ok: true,
      duplicateBlocked: synced.duplicateBlocked,
      udhaarTransactions,
      expenses,
      createdPayment: null,
    };
  }
  const writeRes = commitMultiCollectionWrite({
    udhaarTransactions: synced.udhaarTransactions,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      duplicateBlocked: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      udhaarTransactions,
      expenses,
      createdPayment: null,
    };
  }
  return {
    ok: true,
    duplicateBlocked: false,
    udhaarTransactions: synced.udhaarTransactions,
    expenses: synced.expenses,
    createdPayment: synced.createdPayment,
  };
}

export function persistUdhaarEntryEditSynced(
  nextContacts: UdhaarContact[],
  updatedEntry: UdhaarTransaction,
  language: Language
): {
  ok: boolean;
  paidAmountConflict?: number;
  errorMessage?: string;
  contacts: UdhaarContact[];
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const contacts = udhaarStorage.loadContacts();
  const udhaarTransactions = udhaarStorage.loadTransactions();
  const expenses = transactionsStorage.load();
  const synced = syncEditUdhaarEntry(
    udhaarTransactions,
    nextContacts,
    expenses,
    updatedEntry
  );
  if (!synced.ok) {
    return {
      ok: false,
      paidAmountConflict: synced.paidAmountConflict,
      contacts,
      udhaarTransactions,
      expenses,
    };
  }
  const writeRes = commitMultiCollectionWrite({
    udhaarContacts: nextContacts,
    udhaarTransactions: synced.udhaarTransactions,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      contacts,
      udhaarTransactions,
      expenses,
    };
  }
  return {
    ok: true,
    contacts: nextContacts,
    udhaarTransactions: synced.udhaarTransactions,
    expenses: synced.expenses,
  };
}

export function persistUdhaarDeleteSynced(
  target:
    | { kind: 'person'; contactId: string }
    | { kind: 'entry'; txId: string }
    | { kind: 'payment'; txId: string; paymentId: string },
  language: Language
): {
  ok: boolean;
  errorMessage?: string;
  contacts: UdhaarContact[];
  udhaarTransactions: UdhaarTransaction[];
  expenses: TransactionItem[];
} {
  const contacts = udhaarStorage.loadContacts();
  const udhaarTransactions = udhaarStorage.loadTransactions();
  const expenses = transactionsStorage.load();

  if (target.kind === 'person') {
    const synced = syncDeleteUdhaarContact(
      contacts,
      udhaarTransactions,
      expenses,
      target.contactId
    );
    const writeRes = commitMultiCollectionWrite({
      udhaarContacts: synced.contacts,
      udhaarTransactions: synced.udhaarTransactions,
      expenses: synced.expenses,
    });
    if (!writeRes.ok) {
      return {
        ok: false,
        errorMessage: getStorageErrorMessage(
          writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
          language
        ),
        contacts,
        udhaarTransactions,
        expenses,
      };
    }
    return { ok: true, ...synced };
  }

  if (target.kind === 'entry') {
    const synced = syncDeleteUdhaarEntry(
      udhaarTransactions,
      expenses,
      target.txId
    );
    const writeRes = commitMultiCollectionWrite({
      udhaarTransactions: synced.udhaarTransactions,
      expenses: synced.expenses,
    });
    if (!writeRes.ok) {
      return {
        ok: false,
        errorMessage: getStorageErrorMessage(
          writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
          language
        ),
        contacts,
        udhaarTransactions,
        expenses,
      };
    }
    return { ok: true, contacts, ...synced };
  }

  const synced = syncDeleteUdhaarPayment(
    udhaarTransactions,
    expenses,
    target.txId,
    target.paymentId
  );
  const writeRes = commitMultiCollectionWrite({
    udhaarTransactions: synced.udhaarTransactions,
    expenses: synced.expenses,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      contacts,
      udhaarTransactions,
      expenses,
    };
  }
  return { ok: true, contacts, ...synced };
}

export function persistExpenseEditSynced(
  updatedTx: TransactionItem,
  language: Language
): {
  ok: boolean;
  maxAllowedUdhaarPayment?: number;
  errorMessage?: string;
  expenses: TransactionItem[];
} {
  const expenses = transactionsStorage.load();
  const bills = billsStorage.loadBills();
  const billPayments = billsStorage.loadPayments();
  const udhaarTxs = udhaarStorage.loadTransactions();

  const synced = syncEditFromExpenseTracker(
    expenses,
    bills,
    billPayments,
    udhaarTxs,
    updatedTx
  );
  if (!synced.ok) {
    return {
      ok: false,
      maxAllowedUdhaarPayment: synced.maxAllowedUdhaarPayment,
      expenses,
    };
  }

  const writeRes = commitMultiCollectionWrite({
    expenses: synced.expenses,
    bills: synced.bills,
    billPayments: synced.billPayments,
    udhaarTransactions: synced.udhaarTransactions,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      expenses,
    };
  }
  return { ok: true, expenses: synced.expenses };
}

export function persistExpenseDeleteSynced(
  txId: string,
  billAction: 'unpay' | 'unlink',
  language: Language
): {
  ok: boolean;
  errorMessage?: string;
  expenses: TransactionItem[];
} {
  const expenses = transactionsStorage.load();
  const bills = billsStorage.loadBills();
  const billPayments = billsStorage.loadPayments();
  const udhaarTxs = udhaarStorage.loadTransactions();

  const synced = syncDeleteFromExpenseTracker(
    expenses,
    bills,
    billPayments,
    udhaarTxs,
    txId,
    billAction
  );

  const writeRes = commitMultiCollectionWrite({
    expenses: synced.expenses,
    bills: synced.bills,
    billPayments: synced.billPayments,
    udhaarTransactions: synced.udhaarTransactions,
  });
  if (!writeRes.ok) {
    return {
      ok: false,
      errorMessage: getStorageErrorMessage(
        writeRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
        language
      ),
      expenses,
    };
  }
  return { ok: true, expenses: synced.expenses };
}

export interface UnifiedFinancialSummary {
  // Core 6 metrics (Zero double-counting)
  totalMoneyToReceive: number;
  totalMoneyToPay: number;
  totalOutstandingBills: number;
  totalExpenses: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  // Phase 3 Daily & Monthly Home Dashboard metrics (Zero double-counting)
  todayExpenses: number;
  todayExpensesCount: number;
  monthlyExpenses: number;
  monthlyExpensesCount: number;
  billsDueTodayCount: number;
  billsDueTodayAmount: number;
  overdueBillsAmount: number;
  futureUpcomingBillsCount: number;
  futureUpcomingBillsAmount: number;
  unpaidBillsCount: number;
  paidBillsThisMonthCount: number;
  paidBillsThisMonthAmount: number;
  activeUdhaarCount: number;
  // Detailed cashflow & breakdowns
  paidBillsTotal: number;
  paidBillsCount: number;
  manualExpensesTotal: number;
  standardIncomeTotal: number;
  totalCashInflow: number;
  totalCashOutflow: number;
  netCashBalance: number;
  overdueBillsCount: number;
  upcomingBillsCount: number;
}

export function computeUnifiedFinancialSummaryFromData(params: {
  udhaarTransactions: UdhaarTransaction[];
  bills: BillItem[];
  billPayments: BillPaymentRecord[];
  expenses: TransactionItem[];
  todayISO?: string;
}): UnifiedFinancialSummary {
  const todayISO = params.todayISO || getTodayISO();
  const monthISO = todayISO.slice(0, 7);

  let totalMoneyToReceive = 0;
  let totalMoneyToPay = 0;
  let totalPaymentsReceived = 0;
  let totalPaymentsMade = 0;
  let activeUdhaarCount = 0;

  for (const tx of params.udhaarTransactions) {
    const paid = getTransactionPaidAmount(tx);
    const remaining = getTransactionRemaining(tx);
    if (remaining > 0.009) {
      activeUdhaarCount += 1;
    }
    if (tx.direction === 'given') {
      totalMoneyToReceive = roundCurrency(totalMoneyToReceive + remaining);
      totalPaymentsReceived = roundCurrency(totalPaymentsReceived + paid);
    } else {
      totalMoneyToPay = roundCurrency(totalMoneyToPay + remaining);
      totalPaymentsMade = roundCurrency(totalPaymentsMade + paid);
    }
  }

  let totalOutstandingBills = 0;
  let overdueBillsCount = 0;
  let overdueBillsAmount = 0;
  let billsDueTodayCount = 0;
  let billsDueTodayAmount = 0;
  let futureUpcomingBillsCount = 0;
  let futureUpcomingBillsAmount = 0;
  let upcomingBillsCount = 0;

  for (const bill of params.bills) {
    if (bill.status === 'paid') continue;
    totalOutstandingBills = roundCurrency(totalOutstandingBills + bill.amount);
    if (bill.dueDate < todayISO) {
      overdueBillsCount += 1;
      overdueBillsAmount = roundCurrency(overdueBillsAmount + bill.amount);
    } else {
      upcomingBillsCount += 1;
      if (bill.dueDate === todayISO) {
        billsDueTodayCount += 1;
        billsDueTodayAmount = roundCurrency(billsDueTodayAmount + bill.amount);
      } else {
        futureUpcomingBillsCount += 1;
        futureUpcomingBillsAmount = roundCurrency(
          futureUpcomingBillsAmount + bill.amount
        );
      }
    }
  }

  const unpaidBillsCount = overdueBillsCount + upcomingBillsCount;

  let paidBillsThisMonthCount = 0;
  let paidBillsThisMonthAmount = 0;
  for (const bp of params.billPayments) {
    if (bp.paidDate.startsWith(monthISO)) {
      paidBillsThisMonthCount += 1;
      paidBillsThisMonthAmount = roundCurrency(
        paidBillsThisMonthAmount + (Number.isFinite(bp.amount) ? bp.amount : 0)
      );
    }
  }

  let totalExpenses = 0;
  let todayExpenses = 0;
  let todayExpensesCount = 0;
  let monthlyExpenses = 0;
  let monthlyExpensesCount = 0;
  let paidBillsFromExpenseTotal = 0;
  let manualExpensesTotal = 0;
  let standardIncomeTotal = 0;
  let syncedUdhaarCollectedInCash = 0;
  let syncedUdhaarRepaidInCash = 0;

  for (const tx of params.expenses) {
    if (tx.type === 'income') {
      if (isUdhaarCollectionTransaction(tx)) {
        syncedUdhaarCollectedInCash = roundCurrency(
          syncedUdhaarCollectedInCash + tx.amount
        );
      } else {
        standardIncomeTotal = roundCurrency(standardIncomeTotal + tx.amount);
      }
      continue;
    }

    // Expense vs Debt Repayment outflow (Udhaar repayments NEVER inflate Expenses)
    if (isUdhaarRepaymentTransaction(tx)) {
      syncedUdhaarRepaidInCash = roundCurrency(
        syncedUdhaarRepaidInCash + tx.amount
      );
      continue;
    }

    totalExpenses = roundCurrency(totalExpenses + tx.amount);
    if (tx.date === todayISO) {
      todayExpenses = roundCurrency(todayExpenses + tx.amount);
      todayExpensesCount += 1;
    }
    if (tx.date.startsWith(monthISO)) {
      monthlyExpenses = roundCurrency(monthlyExpenses + tx.amount);
      monthlyExpensesCount += 1;
    }

    if (tx.sourceType === 'bill') {
      paidBillsFromExpenseTotal = roundCurrency(
        paidBillsFromExpenseTotal + tx.amount
      );
    } else {
      manualExpensesTotal = roundCurrency(manualExpensesTotal + tx.amount);
    }
  }

  const paidBillsCount = params.billPayments.length;
  const paidBillsTotal =
    paidBillsFromExpenseTotal > 0
      ? paidBillsFromExpenseTotal
      : roundCurrency(
          params.billPayments.reduce(
            (s, p) => s + (Number.isFinite(p.amount) ? p.amount : 0),
            0
          )
        );

  const effectiveCashCollected =
    syncedUdhaarCollectedInCash > 0
      ? syncedUdhaarCollectedInCash
      : totalPaymentsReceived;
  const effectiveCashRepaid =
    syncedUdhaarRepaidInCash > 0
      ? syncedUdhaarRepaidInCash
      : totalPaymentsMade;

  const totalCashInflow = roundCurrency(
    standardIncomeTotal + effectiveCashCollected
  );
  const totalCashOutflow = roundCurrency(totalExpenses + effectiveCashRepaid);
  const netCashBalance = roundCurrency(totalCashInflow - totalCashOutflow);

  return {
    totalMoneyToReceive,
    totalMoneyToPay,
    totalOutstandingBills,
    totalExpenses,
    totalPaymentsReceived,
    totalPaymentsMade,
    todayExpenses,
    todayExpensesCount,
    monthlyExpenses,
    monthlyExpensesCount,
    billsDueTodayCount,
    billsDueTodayAmount,
    overdueBillsAmount,
    futureUpcomingBillsCount,
    futureUpcomingBillsAmount,
    unpaidBillsCount,
    paidBillsThisMonthCount,
    paidBillsThisMonthAmount,
    activeUdhaarCount,
    paidBillsTotal,
    paidBillsCount,
    manualExpensesTotal,
    standardIncomeTotal,
    totalCashInflow,
    totalCashOutflow,
    netCashBalance,
    overdueBillsCount,
    upcomingBillsCount,
  };
}

export function computeUnifiedFinancialSummary(
  todayISO: string = getTodayISO()
): UnifiedFinancialSummary {
  return computeUnifiedFinancialSummaryFromData({
    udhaarTransactions: udhaarStorage.loadTransactions(),
    bills: billsStorage.loadBills(),
    billPayments: billsStorage.loadPayments(),
    expenses: transactionsStorage.load(),
    todayISO,
  });
}
