import { Language } from '../types';
import { UdhaarContact, UdhaarTransaction } from './storage';

export type UdhaarStatus = 'pending' | 'partial' | 'paid';

export interface UdhaarDashboardMetrics {
  totalGivenRemaining: number;
  totalBorrowedRemaining: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  netOutstanding: number; // positive = net receivable, negative = net payable
  activeTransactionsCount: number;
  paidTransactionsCount: number;
  totalTransactionsCount: number;
}

export interface UdhaarMonthlySummary {
  monthISO: string;
  givenAdded: number;
  borrowedAdded: number;
  paymentsCollected: number;
  paymentsReturned: number;
  netChange: number;
  entryCount: number;
}

export interface UdhaarContactSummary {
  contact: UdhaarContact;
  givenRemaining: number;
  borrowedRemaining: number;
  netBalance: number; // + receivable (Mujhe lene hain), - payable (Mujhe dene hain)
  activeCount: number;
  paidCount: number;
  totalCount: number;
  lastActivityDate: string;
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function getTransactionPaidAmount(tx: UdhaarTransaction): number {
  const fromPayments = Array.isArray(tx.payments)
    ? tx.payments.reduce(
        (sum, p) => sum + (Number.isFinite(p.amount) && p.amount > 0 ? p.amount : 0),
        0
      )
    : 0;
  const rawPaid =
    Array.isArray(tx.payments) && tx.payments.length > 0
      ? fromPayments
      : Number.isFinite(tx.paidAmount)
        ? tx.paidAmount
        : 0;
  return Math.min(roundCurrency(tx.amount), Math.max(0, roundCurrency(rawPaid)));
}

export function getTransactionRemaining(tx: UdhaarTransaction): number {
  const paid = getTransactionPaidAmount(tx);
  return Math.max(0, roundCurrency(tx.amount - paid));
}

export function getTransactionStatus(tx: UdhaarTransaction): UdhaarStatus {
  const remaining = getTransactionRemaining(tx);
  if (remaining <= 0.009) return 'paid';
  const paid = getTransactionPaidAmount(tx);
  if (paid > 0.009) return 'partial';
  return 'pending';
}

export function computeUdhaarDashboard(
  transactions: UdhaarTransaction[]
): UdhaarDashboardMetrics {
  let totalGivenRemaining = 0;
  let totalBorrowedRemaining = 0;
  let totalPaymentsReceived = 0;
  let totalPaymentsMade = 0;
  let activeTransactionsCount = 0;
  let paidTransactionsCount = 0;

  for (const tx of transactions) {
    const paid = getTransactionPaidAmount(tx);
    const remaining = getTransactionRemaining(tx);
    const status = getTransactionStatus(tx);

    if (status === 'paid') {
      paidTransactionsCount += 1;
    } else {
      activeTransactionsCount += 1;
    }

    if (tx.direction === 'given') {
      totalGivenRemaining = roundCurrency(totalGivenRemaining + remaining);
      totalPaymentsReceived = roundCurrency(totalPaymentsReceived + paid);
    } else {
      totalBorrowedRemaining = roundCurrency(totalBorrowedRemaining + remaining);
      totalPaymentsMade = roundCurrency(totalPaymentsMade + paid);
    }
  }

  return {
    totalGivenRemaining,
    totalBorrowedRemaining,
    totalPaymentsReceived,
    totalPaymentsMade,
    netOutstanding: roundCurrency(totalGivenRemaining - totalBorrowedRemaining),
    activeTransactionsCount,
    paidTransactionsCount,
    totalTransactionsCount: transactions.length,
  };
}

export function computeUdhaarMonthlySummary(
  transactions: UdhaarTransaction[],
  monthISO: string
): UdhaarMonthlySummary {
  let givenAdded = 0;
  let borrowedAdded = 0;
  let paymentsCollected = 0;
  let paymentsReturned = 0;
  let entryCount = 0;

  for (const tx of transactions) {
    if (tx.date.startsWith(monthISO)) {
      entryCount += 1;
      if (tx.direction === 'given') {
        givenAdded = roundCurrency(givenAdded + tx.amount);
      } else {
        borrowedAdded = roundCurrency(borrowedAdded + tx.amount);
      }
    }

    for (const payment of tx.payments) {
      if (payment.date.startsWith(monthISO)) {
        if (tx.direction === 'given') {
          paymentsCollected = roundCurrency(paymentsCollected + payment.amount);
        } else {
          paymentsReturned = roundCurrency(paymentsReturned + payment.amount);
        }
      }
    }
  }

  return {
    monthISO,
    givenAdded,
    borrowedAdded,
    paymentsCollected,
    paymentsReturned,
    netChange: roundCurrency(
      givenAdded - paymentsCollected - (borrowedAdded - paymentsReturned)
    ),
    entryCount,
  };
}

export function computeContactSummaries(
  contacts: UdhaarContact[],
  transactions: UdhaarTransaction[]
): UdhaarContactSummary[] {
  return contacts
    .map((contact) => {
      const personTxs = transactions.filter((tx) => tx.contactId === contact.id);
      let givenRemaining = 0;
      let borrowedRemaining = 0;
      let activeCount = 0;
      let paidCount = 0;
      let lastActivityDate = '';

      for (const tx of personTxs) {
        const remaining = getTransactionRemaining(tx);
        const status = getTransactionStatus(tx);
        if (status === 'paid') {
          paidCount += 1;
        } else {
          activeCount += 1;
        }
        if (tx.direction === 'given') {
          givenRemaining = roundCurrency(givenRemaining + remaining);
        } else {
          borrowedRemaining = roundCurrency(borrowedRemaining + remaining);
        }
        if (!lastActivityDate || tx.date > lastActivityDate) {
          lastActivityDate = tx.date;
        }
      }

      return {
        contact,
        givenRemaining,
        borrowedRemaining,
        netBalance: roundCurrency(givenRemaining - borrowedRemaining),
        activeCount,
        paidCount,
        totalCount: personTxs.length,
        lastActivityDate,
      };
    })
    .sort((a, b) => {
      const absDiff = Math.abs(b.netBalance) - Math.abs(a.netBalance);
      if (absDiff !== 0) return absDiff;
      return b.contact.updatedAt - a.contact.updatedAt;
    });
}

export function formatPKR(amount: number): string {
  return `PKR ${Math.abs(roundCurrency(amount)).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '').replace(/\+/g, '');
  if (!digits) return '';
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  const encoded = encodeURIComponent(text);
  return normalized
    ? `https://wa.me/${normalized}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export function formatWhatsAppAccountStatement(
  contact: UdhaarContact,
  transactions: UdhaarTransaction[],
  lang: Language
): string {
  const personTxs = transactions
    .filter((tx) => tx.contactId === contact.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  let givenRem = 0;
  let borrowedRem = 0;
  for (const tx of personTxs) {
    const rem = getTransactionRemaining(tx);
    if (tx.direction === 'given') givenRem = roundCurrency(givenRem + rem);
    else borrowedRem = roundCurrency(borrowedRem + rem);
  }
  const net = roundCurrency(givenRem - borrowedRem);

  const lines: string[] = [];
  if (lang === 'ur') {
    lines.push(`*EasyDay — ادھار کھاتہ تفصیل*`);
    lines.push(`شخص: ${contact.name}`);
    if (contact.phone) lines.push(`فون: ${contact.phone}`);
    lines.push(`------------------`);
    lines.push(`مجھے لینے ہیں (Given): ${formatPKR(givenRem)}`);
    lines.push(`مجھے دینے ہیں (Borrowed): ${formatPKR(borrowedRem)}`);
    if (net > 0) {
      lines.push(`*کل واجب الوصول (آپ پر باقی): ${formatPKR(net)}*`);
    } else if (net < 0) {
      lines.push(`*کل واجب الادا (مجھ پر باقی): ${formatPKR(Math.abs(net))}*`);
    } else {
      lines.push(`*حساب برابر ہے (PKR 0)*`);
    }
    if (personTxs.length > 0) {
      lines.push(``);
      lines.push(`حالیہ لین دین:`);
      for (const tx of personTxs.slice(0, 8)) {
        const rem = getTransactionRemaining(tx);
        const dirText = tx.direction === 'given' ? 'دیا' : 'لیا';
        const statusText =
          rem <= 0 ? 'مکمل ادا' : `باقی: ${formatPKR(rem)}`;
        lines.push(
          `• ${tx.date} | ${dirText} ${formatPKR(tx.amount)} (${tx.description || '-'}) — ${statusText}`
        );
      }
    }
    lines.push(``);
    lines.push(`EasyDay · ZAIDI INTERACTIVE`);
  } else {
    lines.push(`*EasyDay — Udhaar Account Statement*`);
    lines.push(`Account: ${contact.name}`);
    if (contact.phone) lines.push(`Phone: ${contact.phone}`);
    lines.push(`------------------`);
    lines.push(`Receivable (Mujhe lene hain): ${formatPKR(givenRem)}`);
    lines.push(`Payable (Mujhe dene hain): ${formatPKR(borrowedRem)}`);
    if (net > 0) {
      lines.push(`*Net Receivable Balance: ${formatPKR(net)}*`);
    } else if (net < 0) {
      lines.push(`*Net Payable Balance: ${formatPKR(Math.abs(net))}*`);
    } else {
      lines.push(`*Account Settled (PKR 0)*`);
    }
    if (personTxs.length > 0) {
      lines.push(``);
      lines.push(`Recent Entries:`);
      for (const tx of personTxs.slice(0, 8)) {
        const rem = getTransactionRemaining(tx);
        const dirText = tx.direction === 'given' ? 'Given' : 'Borrowed';
        const statusText = rem <= 0 ? 'Paid' : `Remaining: ${formatPKR(rem)}`;
        lines.push(
          `• ${tx.date} | ${dirText} ${formatPKR(tx.amount)} (${tx.description || '-'}) — ${statusText}`
        );
      }
    }
    lines.push(``);
    lines.push(`Sent via EasyDay · ZAIDI INTERACTIVE`);
  }

  return lines.join('\n');
}

export function formatWhatsAppTransactionDetail(
  contact: UdhaarContact | undefined,
  tx: UdhaarTransaction,
  lang: Language
): string {
  const paid = getTransactionPaidAmount(tx);
  const remaining = getTransactionRemaining(tx);
  const name = contact?.name || 'Contact';

  if (lang === 'ur') {
    const dirLabel =
      tx.direction === 'given' ? 'دی گئی رقم (لینے ہیں)' : 'لی گئی رقم (دینے ہیں)';
    return [
      `*EasyDay — ادھار ریکارڈ*`,
      `نام: ${name}`,
      `قسم: ${dirLabel}`,
      `کل رقم: ${formatPKR(tx.amount)}`,
      `وصول/ادا شدہ: ${formatPKR(paid)}`,
      `باقی رقم: ${formatPKR(remaining)}`,
      `تاریخ: ${tx.date}`,
      tx.dueDate ? `واپسی کی تاریخ: ${tx.dueDate}` : '',
      tx.description ? `تفصیل: ${tx.description}` : '',
      `EasyDay · ZAIDI INTERACTIVE`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  const dirLabel =
    tx.direction === 'given' ? 'Money Given (Receivable)' : 'Money Borrowed (Payable)';
  return [
    `*EasyDay — Udhaar Entry*`,
    `Person: ${name}`,
    `Type: ${dirLabel}`,
    `Total Amount: ${formatPKR(tx.amount)}`,
    `Paid So Far: ${formatPKR(paid)}`,
    `Remaining Balance: ${formatPKR(remaining)}`,
    `Date: ${tx.date}`,
    tx.dueDate ? `Due Date: ${tx.dueDate}` : '',
    tx.description ? `Note: ${tx.description}` : '',
    `Sent via EasyDay · ZAIDI INTERACTIVE`,
  ]
    .filter(Boolean)
    .join('\n');
}
