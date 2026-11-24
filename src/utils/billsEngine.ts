import {
  BillItem,
  BillPaymentRecord,
  BillReminderTiming,
  BillRepeat,
  generateId,
} from './storage';

export type ComputedBillStatus = 'paid' | 'overdue' | 'pending';

export interface BillsDashboardMetrics {
  upcomingCount: number;
  totalPendingAmount: number;
  paidThisMonthCount: number;
  paidThisMonthAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function computeBillStatus(
  bill: BillItem,
  todayISO: string
): ComputedBillStatus {
  if (bill.status === 'paid') return 'paid';
  if (bill.dueDate < todayISO) return 'overdue';
  return 'pending';
}

export function computeBillsDashboard(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  todayISO: string,
  monthISO: string
): BillsDashboardMetrics {
  let upcomingCount = 0;
  let totalPendingAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const bill of bills) {
    const status = computeBillStatus(bill, todayISO);
    if (status === 'paid') continue;

    totalPendingAmount = roundCurrency(totalPendingAmount + bill.amount);
    if (status === 'overdue') {
      overdueCount += 1;
      overdueAmount = roundCurrency(overdueAmount + bill.amount);
    } else {
      upcomingCount += 1;
    }
  }

  let paidThisMonthCount = 0;
  let paidThisMonthAmount = 0;

  for (const payment of payments) {
    if (payment.paidDate.startsWith(monthISO)) {
      paidThisMonthCount += 1;
      paidThisMonthAmount = roundCurrency(paidThisMonthAmount + payment.amount);
    }
  }

  return {
    upcomingCount,
    totalPendingAmount,
    paidThisMonthCount,
    paidThisMonthAmount,
    overdueCount,
    overdueAmount,
  };
}

export function parseISODateParts(
  iso: string
): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function formatISODateParts(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function addDaysToISO(iso: string, deltaDays: number): string {
  const parts = parseISODateParts(iso);
  if (!parts) return iso;
  const ms = Date.UTC(parts.year, parts.month - 1, parts.day + deltaDays);
  const dt = new Date(ms);
  return formatISODateParts(
    dt.getUTCFullYear(),
    dt.getUTCMonth() + 1,
    dt.getUTCDate()
  );
}

export function diffDaysISO(fromISO: string, toISO: string): number {
  const a = parseISODateParts(fromISO);
  const b = parseISODateParts(toISO);
  if (!a || !b) return 0;
  const msA = Date.UTC(a.year, a.month - 1, a.day);
  const msB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((msB - msA) / 86_400_000);
}

export function computeNextBillDueDate(
  currentDueDateISO: string,
  repeat: BillRepeat,
  customIntervalDays = 30
): string | null {
  if (repeat === 'one-time') return null;

  const parts = parseISODateParts(currentDueDateISO);
  if (!parts) return null;

  if (repeat === 'monthly') {
    const nextMonthZero = parts.month; // 0-indexed next month relative to month-1 + 1
    const targetYear = parts.year + Math.floor(nextMonthZero / 12);
    const targetMonth = (nextMonthZero % 12) + 1;
    const maxDay = getDaysInMonth(targetYear, targetMonth);
    const targetDay = Math.min(parts.day, maxDay);
    return formatISODateParts(targetYear, targetMonth, targetDay);
  }

  const safeDays = Math.max(1, Math.min(3650, Math.round(customIntervalDays || 30)));
  return addDaysToISO(currentDueDateISO, safeDays);
}

export function computeReminderDateISO(
  dueDateISO: string,
  timing: BillReminderTiming
): string {
  if (timing === '3-days') return addDaysToISO(dueDateISO, -3);
  if (timing === '1-day') return addDaysToISO(dueDateISO, -1);
  return dueDateISO;
}

export function computeReminderTriggerTimestamp(
  dueDateISO: string,
  timing: BillReminderTiming
): number | null {
  const targetISO = computeReminderDateISO(dueDateISO, timing);
  const parts = parseISODateParts(targetISO);
  if (!parts) return null;
  // Schedule at 09:00 AM local device time on the reminder day
  const dt = new Date(parts.year, parts.month - 1, parts.day, 9, 0, 0, 0);
  return dt.getTime();
}

export function buildReminderRequestCode(key: string): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
  }
  const positive = Math.abs(hash) % 2_000_000_000;
  return positive === 0 ? 1 : positive;
}

export interface MarkPaidResult {
  bills: BillItem[];
  payments: BillPaymentRecord[];
  generatedNextBill: BillItem | null;
}

/**
 * Marks a bill as paid, appends a payment history entry, and generates the next
 * recurring bill idempotently (preventing duplicate recurring bills).
 */
export function markBillAsPaidWithRecurrence(
  bills: BillItem[],
  payments: BillPaymentRecord[],
  billId: string,
  todayISO: string,
  note = ''
): MarkPaidResult {
  const target = bills.find((b) => b.id === billId);
  if (!target || target.status === 'paid') {
    return { bills, payments, generatedNextBill: null };
  }

  const now = Date.now();
  const nextDue = computeNextBillDueDate(
    target.dueDate,
    target.repeat,
    target.customIntervalDays
  );

  const alreadyHasNextCycle =
    Boolean(target.nextCycleGenerated) ||
    (nextDue !== null &&
      bills.some(
        (b) =>
          b.id !== target.id &&
          b.seriesId === target.seriesId &&
          b.dueDate === nextDue
      ));

  let generatedNextBill: BillItem | null = null;
  if (nextDue && !alreadyHasNextCycle) {
    generatedNextBill = {
      id: generateId('bill'),
      seriesId: target.seriesId,
      name: target.name,
      category: target.category,
      provider: target.provider,
      amount: target.amount,
      dueDate: nextDue,
      accountNumber: target.accountNumber,
      photoId: target.photoId,
      photoDataUrl: target.photoDataUrl,
      repeat: target.repeat,
      customIntervalDays: target.customIntervalDays,
      reminderTiming: target.reminderTiming,
      status: 'pending',
      nextCycleGenerated: false,
      createdAt: now + 1,
      updatedAt: now + 1,
    };
  }

  const updatedBills = bills.map((b) =>
    b.id === billId
      ? {
          ...b,
          status: 'paid' as const,
          paidAt: now,
          paidDate: todayISO,
          nextCycleGenerated: Boolean(nextDue),
          updatedAt: now,
        }
      : b
  );

  if (generatedNextBill) {
    updatedBills.unshift(generatedNextBill);
  }

  const paymentRecord: BillPaymentRecord = {
    id: generateId('bpay'),
    billId: target.id,
    billName: target.name,
    category: target.category,
    provider: target.provider,
    amount: target.amount,
    dueDate: target.dueDate,
    paidDate: todayISO,
    paidAt: now,
    note: note.trim(),
  };

  return {
    bills: updatedBills,
    payments: [paymentRecord, ...payments],
    generatedNextBill,
  };
}
