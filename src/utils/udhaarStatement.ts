import { jsPDF } from 'jspdf';
import { ToolTranslationBundle } from '../i18n/toolTranslations';
import { Language } from '../types';
import {
  GeneratedPdfResult,
  getMonthRange,
  isValidISODate,
  PdfPreviewBundle,
} from './expenseReport';
import {
  getCurrentMonthISO,
  getTodayISO,
  UdhaarContact,
  UdhaarDirection,
  UdhaarTransaction,
} from './storage';
import {
  getTransactionPaidAmount,
  getTransactionRemaining,
  getTransactionStatus,
  roundCurrency,
  UdhaarStatus,
} from './udhaarEngine';

export type StatementDatePreset =
  | 'all'
  | 'current-month'
  | 'previous-month'
  | 'custom';

export interface StatementDateRangeInput {
  preset: StatementDatePreset;
  customStartDate?: string;
  customEndDate?: string;
  anchorDateISO?: string;
}

export interface StatementResolvedRange {
  preset: StatementDatePreset;
  startDate: string | null;
  endDate: string | null;
}

export type CustomerAccountStanding = 'receivable' | 'payable' | 'settled';

export interface StatementEntryRow {
  id: string;
  date: string;
  dueDate?: string;
  direction: UdhaarDirection;
  description: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: UdhaarStatus;
}

export interface StatementPaymentHistoryRow {
  id: string;
  txId: string;
  date: string;
  direction: UdhaarDirection;
  amount: number;
  description: string;
  entryDescription: string;
  paymentNote: string;
  /** Customer's entry balance (or signed net exposure for this entry) before this payment */
  previousBalance: number;
  /** Remaining balance on that Udhaar entry after this payment */
  remainingBalance: number;
  /** Overall signed net customer balance before this payment (+ receive, - pay) */
  accountPreviousNetBalance: number;
  /** Overall signed net customer balance after this payment (+ receive, - pay) */
  accountRemainingNetBalance: number;
  createdAt: number;
}

export interface CustomerStatementData {
  contact: UdhaarContact;
  generatedAt: Date;
  range: StatementResolvedRange;
  // Customer overall current account standing across ALL entries
  overallGivenOriginal: number;
  overallGivenPaid: number;
  overallGivenRemaining: number;
  overallBorrowedOriginal: number;
  overallBorrowedPaid: number;
  overallBorrowedRemaining: number;
  overallTotalOriginal: number;
  overallTotalPaid: number;
  overallNetBalance: number; // + To Receive, - To Pay, 0 Settled
  accountStanding: CustomerAccountStanding;
  // Selected period activity totals (equal to overall totals when preset === 'all')
  periodTotalOriginal: number;
  periodTotalPaid: number;
  periodGivenOriginal: number;
  periodBorrowedOriginal: number;
  periodPaymentsReceived: number;
  periodPaymentsMade: number;
  periodEntriesCount: number;
  periodPaymentsCount: number;
  entriesInPeriod: StatementEntryRow[];
  paymentHistory: StatementPaymentHistoryRow[];
}

const A4_PT_WIDTH = 595.28;
const A4_PT_HEIGHT = 841.89;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getPreviousMonthISO(anchorMonthISO = getCurrentMonthISO()): string {
  const [y, m] = anchorMonthISO.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return `${prev.getUTCFullYear()}-${pad2(prev.getUTCMonth() + 1)}`;
}

export function resolveStatementDateRange(
  input: StatementDateRangeInput
): StatementResolvedRange {
  const todayISO =
    input.anchorDateISO && isValidISODate(input.anchorDateISO)
      ? input.anchorDateISO
      : getTodayISO();
  const currentMonth = todayISO.slice(0, 7);

  if (input.preset === 'all') {
    return { preset: 'all', startDate: null, endDate: null };
  }

  if (input.preset === 'current-month') {
    const r = getMonthRange(currentMonth);
    return { preset: 'current-month', startDate: r.startDate, endDate: r.endDate };
  }

  if (input.preset === 'previous-month') {
    const prevMonth = getPreviousMonthISO(currentMonth);
    const r = getMonthRange(prevMonth);
    return { preset: 'previous-month', startDate: r.startDate, endDate: r.endDate };
  }

  const rawStart =
    input.customStartDate && isValidISODate(input.customStartDate)
      ? input.customStartDate
      : `${currentMonth}-01`;
  const rawEnd =
    input.customEndDate && isValidISODate(input.customEndDate)
      ? input.customEndDate
      : todayISO;

  if (rawStart <= rawEnd) {
    return { preset: 'custom', startDate: rawStart, endDate: rawEnd };
  }
  return { preset: 'custom', startDate: rawEnd, endDate: rawStart };
}

function isDateInRange(
  dateISO: string,
  range: StatementResolvedRange
): boolean {
  if (range.preset === 'all' || !range.startDate || !range.endDate) return true;
  return dateISO >= range.startDate && dateISO <= range.endDate;
}

export function formatStatementCurrencyRs(
  amount: number,
  signed = false
): string {
  const abs = Math.abs(roundCurrency(amount));
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `-Rs. ${formatted}`;
  if (signed && amount > 0) return `+Rs. ${formatted}`;
  return `Rs. ${formatted}`;
}

export function formatStatementCurrencyPKR(
  amount: number,
  signed = false
): string {
  const abs = Math.abs(roundCurrency(amount));
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `-PKR ${formatted}`;
  if (signed && amount > 0) return `+PKR ${formatted}`;
  return `PKR ${formatted}`;
}

/**
 * Builds an accurate, strictly customer-isolated financial statement with:
 * - Overall current ledger standing (never inflated or distorted by other contacts)
 * - Selected date-range totals (period Udhaar + period payments)
 * - Chronological payment history with accurate Previous Balance & Remaining Balance
 */
export function buildCustomerUdhaarStatement(
  contact: UdhaarContact,
  allTransactions: UdhaarTransaction[],
  rangeInput: StatementDateRangeInput = { preset: 'all' },
  generatedAt: Date = new Date()
): CustomerStatementData {
  // Strictly isolate transactions belonging ONLY to this contact
  const customerTxs = allTransactions.filter((tx) => tx.contactId === contact.id);
  const range = resolveStatementDateRange(rangeInput);

  // 1. Overall Account Totals (across all transactions of this customer)
  let overallGivenOriginal = 0;
  let overallGivenPaid = 0;
  let overallGivenRemaining = 0;
  let overallBorrowedOriginal = 0;
  let overallBorrowedPaid = 0;
  let overallBorrowedRemaining = 0;

  for (const tx of customerTxs) {
    const paid = getTransactionPaidAmount(tx);
    const rem = getTransactionRemaining(tx);
    if (tx.direction === 'given') {
      overallGivenOriginal = roundCurrency(overallGivenOriginal + tx.amount);
      overallGivenPaid = roundCurrency(overallGivenPaid + paid);
      overallGivenRemaining = roundCurrency(overallGivenRemaining + rem);
    } else {
      overallBorrowedOriginal = roundCurrency(overallBorrowedOriginal + tx.amount);
      overallBorrowedPaid = roundCurrency(overallBorrowedPaid + paid);
      overallBorrowedRemaining = roundCurrency(overallBorrowedRemaining + rem);
    }
  }

  const overallTotalOriginal = roundCurrency(
    overallGivenOriginal + overallBorrowedOriginal
  );
  const overallTotalPaid = roundCurrency(overallGivenPaid + overallBorrowedPaid);
  const overallNetBalance = roundCurrency(
    overallGivenRemaining - overallBorrowedRemaining
  );
  const accountStanding: CustomerAccountStanding =
    overallNetBalance > 0.009
      ? 'receivable'
      : overallNetBalance < -0.009
        ? 'payable'
        : 'settled';

  // 2. Entries created inside selected period
  const entriesInPeriod: StatementEntryRow[] = customerTxs
    .filter((tx) => isDateInRange(tx.date, range))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .map((tx) => ({
      id: tx.id,
      date: tx.date,
      dueDate: tx.dueDate,
      direction: tx.direction,
      description: tx.description,
      originalAmount: roundCurrency(tx.amount),
      paidAmount: getTransactionPaidAmount(tx),
      remainingAmount: getTransactionRemaining(tx),
      status: getTransactionStatus(tx),
    }));

  let periodGivenOriginal = 0;
  let periodBorrowedOriginal = 0;
  for (const row of entriesInPeriod) {
    if (row.direction === 'given') {
      periodGivenOriginal = roundCurrency(periodGivenOriginal + row.originalAmount);
    } else {
      periodBorrowedOriginal = roundCurrency(
        periodBorrowedOriginal + row.originalAmount
      );
    }
  }
  const periodTotalOriginal = roundCurrency(
    periodGivenOriginal + periodBorrowedOriginal
  );

  // 3. Reconstruct full chronological ledger timeline so every payment has exact
  // previousBalance & remainingBalance matching the real ledger
  type TimelineEvent =
    | {
        kind: 'entry';
        date: string;
        createdAt: number;
        tx: UdhaarTransaction;
      }
    | {
        kind: 'payment';
        date: string;
        createdAt: number;
        tx: UdhaarTransaction;
        paymentId: string;
        amount: number;
        note: string;
      };

  const timeline: TimelineEvent[] = [];
  for (const tx of customerTxs) {
    timeline.push({
      kind: 'entry',
      date: tx.date,
      createdAt: tx.createdAt,
      tx,
    });
    const sortedPays = [...(tx.payments || [])].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt
    );
    for (const p of sortedPays) {
      if (!Number.isFinite(p.amount) || p.amount <= 0) continue;
      // Ensure a backdated payment never sequences ahead of its parent entry
      const effectiveDate = p.date < tx.date ? tx.date : p.date;
      const effectiveCreated =
        p.date < tx.date ? Math.max(tx.createdAt + 1, p.createdAt) : p.createdAt;
      timeline.push({
        kind: 'payment',
        date: effectiveDate,
        createdAt: effectiveCreated,
        tx,
        paymentId: p.id,
        amount: roundCurrency(p.amount),
        note: p.note || '',
      });
    }
  }

  timeline.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    if (a.kind !== b.kind) return a.kind === 'entry' ? -1 : 1;
    return a.createdAt - b.createdAt;
  });

  // Track per-entry remaining + overall account signed net balance sequentially
  const entryRemainingMap = new Map<string, number>();
  let runningNetBalance = 0;
  const allPaymentRows: StatementPaymentHistoryRow[] = [];

  for (const ev of timeline) {
    if (ev.kind === 'entry') {
      entryRemainingMap.set(ev.tx.id, roundCurrency(ev.tx.amount));
      const delta = ev.tx.direction === 'given' ? ev.tx.amount : -ev.tx.amount;
      runningNetBalance = roundCurrency(runningNetBalance + delta);
      continue;
    }

    const tx = ev.tx;
    const prevEntryRem = entryRemainingMap.get(tx.id) ?? roundCurrency(tx.amount);
    const applied = Math.min(prevEntryRem, ev.amount);
    const nextEntryRem = Math.max(0, roundCurrency(prevEntryRem - applied));
    entryRemainingMap.set(tx.id, nextEntryRem);

    const prevNet = runningNetBalance;
    const netDelta = tx.direction === 'given' ? -applied : applied;
    const nextNet = roundCurrency(prevNet + netDelta);
    runningNetBalance = nextNet;

    // Look up actual recorded payment date from original payment object
    const originalPayment = tx.payments.find((p) => p.id === ev.paymentId);
    const actualPayDate = originalPayment?.date || ev.date;

    if (isDateInRange(actualPayDate, range)) {
      const descParts = [tx.description.trim(), ev.note.trim()].filter(Boolean);
      allPaymentRows.push({
        id: ev.paymentId,
        txId: tx.id,
        date: actualPayDate,
        direction: tx.direction,
        amount: applied,
        description: descParts.join(' — ') || (tx.direction === 'given' ? 'Payment Received' : 'Payment Made'),
        entryDescription: tx.description.trim(),
        paymentNote: ev.note.trim(),
        previousBalance: prevEntryRem,
        remainingBalance: nextEntryRem,
        accountPreviousNetBalance: prevNet,
        accountRemainingNetBalance: nextNet,
        createdAt: ev.createdAt,
      });
    }
  }

  // Keep payment history in chronological order so Previous -> Remaining Balance progresses naturally
  const paymentHistory = [...allPaymentRows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt
  );

  let periodPaymentsReceived = 0;
  let periodPaymentsMade = 0;
  for (const row of paymentHistory) {
    if (row.direction === 'given') {
      periodPaymentsReceived = roundCurrency(periodPaymentsReceived + row.amount);
    } else {
      periodPaymentsMade = roundCurrency(periodPaymentsMade + row.amount);
    }
  }
  const periodTotalPaid = roundCurrency(
    periodPaymentsReceived + periodPaymentsMade
  );

  return {
    contact,
    generatedAt,
    range,
    overallGivenOriginal,
    overallGivenPaid,
    overallGivenRemaining,
    overallBorrowedOriginal,
    overallBorrowedPaid,
    overallBorrowedRemaining,
    overallTotalOriginal,
    overallTotalPaid,
    overallNetBalance,
    accountStanding,
    periodTotalOriginal,
    periodTotalPaid,
    periodGivenOriginal,
    periodBorrowedOriginal,
    periodPaymentsReceived,
    periodPaymentsMade,
    periodEntriesCount: entriesInPeriod.length,
    periodPaymentsCount: paymentHistory.length,
    entriesInPeriod,
    paymentHistory,
  };
}

export function getUdhaarStatementFilename(
  statement: CustomerStatementData
): string {
  const safePerson =
    statement.contact.name
      .trim()
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '-') || 'Customer';
  if (
    statement.range.preset === 'all' ||
    !statement.range.startDate ||
    !statement.range.endDate
  ) {
    return `EasyDay-Statement-${safePerson}-AllTime.pdf`;
  }
  return `EasyDay-Statement-${safePerson}-${statement.range.startDate}_to_${statement.range.endDate}.pdf`;
}

export function formatStatementRangeText(
  range: StatementResolvedRange,
  labels: ToolTranslationBundle['udhaar']['statement']
): string {
  if (range.preset === 'all' || !range.startDate || !range.endDate) {
    return labels.rangeAllTime;
  }
  if (range.preset === 'current-month') {
    return `${labels.rangeCurrentMonth} (${range.startDate} – ${range.endDate})`;
  }
  if (range.preset === 'previous-month') {
    return `${labels.rangePreviousMonth} (${range.startDate} – ${range.endDate})`;
  }
  return `${range.startDate} – ${range.endDate}`;
}

/**
 * Generates an editable WhatsApp payment reminder message using live customer data
 * with distinct natural wording for Money to Receive, Money to Pay, and Settled accounts.
 */
export function buildUdhaarReminderMessage(
  contact: UdhaarContact,
  allTransactions: UdhaarTransaction[],
  lang: Language
): {
  mode: CustomerAccountStanding;
  netBalance: number;
  message: string;
} {
  const statement = buildCustomerUdhaarStatement(contact, allTransactions, {
    preset: 'all',
  });
  const net = statement.overallNetBalance;
  const absFormatted = formatStatementCurrencyRs(Math.abs(net));

  if (statement.accountStanding === 'receivable') {
    const message =
      lang === 'ur'
        ? [
            `السلام علیکم ${contact.name}!`,
            ``,
            `آپ کے ذمہ آپ کا موجودہ واجب الادا بقایا ${absFormatted} ہے۔`,
            `براہِ کرم اپنی زیرِ التواء ادائیگی کے حوالے سے رابطہ کریں۔`,
            ``,
            `شکریہ۔`,
            `— EasyDay`,
          ].join('\n')
        : [
            `Assalam-o-Alaikum!`,
            ``,
            `${contact.name}, your current outstanding balance is ${absFormatted}.`,
            ``,
            `Please contact us regarding your pending payment.`,
            ``,
            `Thank you.`,
          ].join('\n');

    return { mode: 'receivable', netBalance: net, message };
  }

  if (statement.accountStanding === 'payable') {
    const message =
      lang === 'ur'
        ? [
            `السلام علیکم ${contact.name}!`,
            ``,
            `ہماری طرف آپ کی کل بقایا رقم ${absFormatted} واجب الادا ہے۔`,
            `ہم ادائیگی کی ترتیب کے لیے جلد آپ سے رابطہ کریں گے۔`,
            ``,
            `شکریہ۔`,
            `— EasyDay`,
          ].join('\n')
        : [
            `Assalam-o-Alaikum!`,
            ``,
            `${contact.name}, this is a quick update regarding our pending payable balance of ${absFormatted} due to you.`,
            ``,
            `We will coordinate with you shortly to arrange settlement.`,
            ``,
            `Thank you.`,
          ].join('\n');

    return { mode: 'payable', netBalance: net, message };
  }

  const message =
    lang === 'ur'
      ? [
          `السلام علیکم ${contact.name}!`,
          ``,
          `آپ کے کھاتے کا موجودہ بقایا Rs. 0 ہے۔ آپ کا تمام حساب مکمل ہو چکا ہے۔`,
          ``,
          `شکریہ۔`,
          `— EasyDay`,
        ].join('\n')
      : [
          `Assalam-o-Alaikum!`,
          ``,
          `${contact.name}, your account balance is currently Rs. 0 and all entries are settled.`,
          ``,
          `Thank you.`,
        ].join('\n');

  return { mode: 'settled', netBalance: 0, message };
}

export function buildStatementShareCaption(
  statement: CustomerStatementData,
  lang: Language,
  sLabels: ToolTranslationBundle['udhaar']['statement']
): string {
  const rangeText = formatStatementRangeText(statement.range, sLabels);
  const netAbs = formatStatementCurrencyRs(Math.abs(statement.overallNetBalance));
  if (lang === 'ur') {
    const statusLine =
      statement.accountStanding === 'receivable'
        ? `واجب الوصول بقایا: ${netAbs}`
        : statement.accountStanding === 'payable'
          ? `واجب الادا بقایا: ${netAbs}`
          : 'حساب برابر (Rs. 0)';
    return `${statement.contact.name} — ${sLabels.pdf.title}\nمدت: ${rangeText}\n${statusLine}\n— EasyDay`;
  }
  const statusLine =
    statement.accountStanding === 'receivable'
      ? `Remaining Balance (To Receive): ${netAbs}`
      : statement.accountStanding === 'payable'
        ? `Remaining Balance (To Pay): ${netAbs}`
        : 'Account Settled (Rs. 0)';
  return `${statement.contact.name} — ${sLabels.pdf.title}\nPeriod: ${rangeText}\n${statusLine}\n— EasyDay`;
}

function hasNonLatin1(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 255) return true;
  }
  return false;
}

function statementContainsNonLatin1(statement: CustomerStatementData): boolean {
  if (hasNonLatin1(statement.contact.name)) return true;
  for (const e of statement.entriesInPeriod) {
    if (hasNonLatin1(e.description)) return true;
  }
  for (const p of statement.paymentHistory) {
    if (hasNonLatin1(p.description)) return true;
  }
  return false;
}

function toAsciiSafe(text?: string | null): string {
  return (text ?? '').replace(/[^\x20-\xFF]/g, '?');
}

function formatDateTime(date: Date, lang: Language): string {
  try {
    return date.toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

function getStandingLabel(
  standing: CustomerAccountStanding,
  labels: ToolTranslationBundle['udhaar']['statement']
): string {
  if (standing === 'receivable') return labels.statusReceivable;
  if (standing === 'payable') return labels.statusPayable;
  return labels.statusSettled;
}

function renderVectorStatementPdf(
  statement: CustomerStatementData,
  t: ToolTranslationBundle['udhaar'],
  language: Language
): GeneratedPdfResult {
  const sLabels = t.statement;
  const pdf = sLabels.pdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const marginX = 34;
  const contentW = A4_PT_WIDTH - marginX * 2;
  const footerReserveY = A4_PT_HEIGHT - 42;
  let y = 30;

  // Header Banner — EasyDay Navy + Cyan + Yellow branding
  doc.setFillColor(4, 13, 33);
  doc.roundedRect(marginX, y, contentW, 78, 10, 10, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(marginX, y + 70, contentW * 0.72, 8, 'F');
  doc.setFillColor(250, 204, 21);
  doc.rect(marginX + contentW * 0.72, y + 70, contentW * 0.28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(toAsciiSafe(pdf.title), marginX + 16, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(165, 243, 252);
  doc.text(toAsciiSafe(pdf.subtitle), marginX + 16, y + 46);

  const badgeText = toAsciiSafe(getStandingLabel(statement.accountStanding, sLabels));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  const badgeW = Math.max(106, doc.getTextWidth(badgeText) + 22);
  if (statement.accountStanding === 'settled') {
    doc.setFillColor(16, 185, 129);
    doc.setTextColor(255, 255, 255);
  } else if (statement.accountStanding === 'receivable') {
    doc.setFillColor(6, 182, 212);
    doc.setTextColor(4, 13, 33);
  } else {
    doc.setFillColor(250, 204, 21);
    doc.setTextColor(4, 13, 33);
  }
  doc.roundedRect(
    marginX + contentW - badgeW - 14,
    y + 18,
    badgeW,
    22,
    6,
    6,
    'F'
  );
  doc.text(
    badgeText,
    marginX + contentW - badgeW / 2 - 14,
    y + 32.5,
    { align: 'center' }
  );

  y += 92;

  // Customer & Statement Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentW, 56, 7, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const customerLine = `${toAsciiSafe(pdf.customerLabel)}: ${toAsciiSafe(statement.contact.name)}${
    statement.contact.phone ? `  (${toAsciiSafe(statement.contact.phone)})` : ''
  }`;
  doc.text(customerLine, marginX + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.7);
  doc.setTextColor(71, 85, 105);
  const rangeStr = `${toAsciiSafe(pdf.dateRangeLabel)}: ${toAsciiSafe(
    formatStatementRangeText(statement.range, sLabels)
  )}`;
  const genStr = `${toAsciiSafe(pdf.generatedLabel)}: ${toAsciiSafe(
    formatDateTime(statement.generatedAt, language)
  )}`;
  doc.text(rangeStr, marginX + 12, y + 40);
  doc.text(genStr, marginX + contentW - 12, y + 40, { align: 'right' });

  y += 70;

  // 3 Overall Summary KPI Cards
  type RgbTuple = readonly [number, number, number];
  const cardGap = 10;
  const cardW = (contentW - cardGap * 2) / 3;
  const showPeriodSub = statement.range.preset !== 'all';

  const summaryCards: Array<{
    label: string;
    value: string;
    sub: string;
    bg: RgbTuple;
    border: RgbTuple;
    valColor: RgbTuple;
  }> = [
    {
      label: toAsciiSafe(pdf.totalOriginalLabel),
      value: formatStatementCurrencyPKR(statement.overallTotalOriginal),
      sub: showPeriodSub
        ? `${toAsciiSafe(pdf.inPeriodLabel)}: ${formatStatementCurrencyPKR(statement.periodTotalOriginal)}`
        : `${toAsciiSafe(pdf.givenShort)}: ${formatStatementCurrencyPKR(statement.overallGivenOriginal)}`,
      bg: [240, 249, 255],
      border: [186, 230, 253],
      valColor: [14, 116, 144],
    },
    {
      label: toAsciiSafe(pdf.totalPaidLabel),
      value: formatStatementCurrencyPKR(statement.overallTotalPaid),
      sub: showPeriodSub
        ? `${toAsciiSafe(pdf.inPeriodLabel)}: ${formatStatementCurrencyPKR(statement.periodTotalPaid)}`
        : `${toAsciiSafe(pdf.paymentsCountLabel)}: ${statement.paymentHistory.length}`,
      bg: [236, 253, 245],
      border: [167, 243, 208],
      valColor: [4, 120, 87],
    },
    {
      label: toAsciiSafe(pdf.remainingBalanceLabel),
      value: formatStatementCurrencyPKR(Math.abs(statement.overallNetBalance)),
      sub: toAsciiSafe(getStandingLabel(statement.accountStanding, sLabels)),
      bg:
        statement.accountStanding === 'settled'
          ? [236, 253, 245]
          : statement.accountStanding === 'receivable'
            ? [239, 246, 255]
            : [255, 247, 237],
      border:
        statement.accountStanding === 'settled'
          ? [167, 243, 208]
          : statement.accountStanding === 'receivable'
            ? [191, 219, 254]
            : [254, 215, 170],
      valColor:
        statement.accountStanding === 'settled'
          ? [4, 120, 87]
          : statement.accountStanding === 'receivable'
            ? [29, 78, 216]
            : [194, 65, 12],
    },
  ];

  summaryCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(cx, y, cardW, 64, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(c.label, cx + 10, y + 17);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(c.valColor[0], c.valColor[1], c.valColor[2]);
    doc.text(c.value, cx + 10, y + 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cx + 10, y + 53);
  });

  y += 78;

  if (showPeriodSub) {
    doc.setFillColor(254, 252, 232);
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(marginX, y, contentW, 24, 5, 5, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(133, 77, 14);
    doc.text(toAsciiSafe(pdf.periodDistinctionNote), marginX + 10, y + 15);
    y += 34;
  }

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > footerReserveY) {
      doc.addPage();
      y = 34;
      return true;
    }
    return false;
  };

  // Section 1: Udhaar Entries in Period
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${toAsciiSafe(pdf.entriesHeading)} (${statement.entriesInPeriod.length})`,
    marginX,
    y
  );
  y += 10;

  const drawEntriesHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.dateCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.typeCol), marginX + 76, y + 14.5);
    doc.text(toAsciiSafe(pdf.descCol), marginX + 140, y + 14.5);
    doc.text(toAsciiSafe(pdf.originalCol), marginX + 365, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.paidCol), marginX + 442, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.balanceCol), marginX + contentW - 8, y + 14.5, {
      align: 'right',
    });
    y += 22;
  };

  if (statement.entriesInPeriod.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, y, contentW, 36, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noEntriesInPeriod), marginX + contentW / 2, y + 21, {
      align: 'center',
    });
    y += 46;
  } else {
    drawEntriesHeader();
    statement.entriesInPeriod.forEach((entry, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.3);
      const descText = toAsciiSafe(
        entry.description ||
          (entry.direction === 'given' ? t.filterGiven : t.filterBorrowed)
      );
      const wrappedDesc = doc.splitTextToSize(descText, 152) as string[];
      const rowH = Math.max(22, wrappedDesc.length * 10.5 + 10);

      if (ensureSpace(rowH)) {
        drawEntriesHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, rowH, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + rowH, marginX + contentW, y + rowH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text(entry.date, marginX + 8, y + 14);

      doc.setFont('helvetica', 'bold');
      if (entry.direction === 'given') doc.setTextColor(14, 116, 144);
      else doc.setTextColor(194, 65, 12);
      doc.text(
        toAsciiSafe(entry.direction === 'given' ? pdf.givenShort : pdf.borrowedShort),
        marginX + 76,
        y + 14
      );

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      wrappedDesc.forEach((line, lIdx) => {
        doc.text(line, marginX + 140, y + 14 + lIdx * 10.5);
      });

      doc.text(formatStatementCurrencyPKR(entry.originalAmount), marginX + 365, y + 14, {
        align: 'right',
      });
      doc.setTextColor(4, 120, 87);
      doc.text(formatStatementCurrencyPKR(entry.paidAmount), marginX + 442, y + 14, {
        align: 'right',
      });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatStatementCurrencyPKR(entry.remainingAmount),
        marginX + contentW - 8,
        y + 14,
        { align: 'right' }
      );
      y += rowH;
    });
    y += 18;
  }

  // Section 2: Payment History (Date, Amount, Description, Previous Balance, Remaining Balance)
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${toAsciiSafe(pdf.paymentHistoryHeading)} (${statement.paymentHistory.length})`,
    marginX,
    y
  );
  y += 10;

  const drawPaymentsHeader = () => {
    doc.setFillColor(4, 13, 33);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.dateCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.descCol), marginX + 78, y + 14.5);
    doc.text(toAsciiSafe(pdf.amountCol), marginX + 340, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.prevBalanceCol), marginX + 432, y + 14.5, {
      align: 'right',
    });
    doc.text(toAsciiSafe(pdf.remBalanceCol), marginX + contentW - 8, y + 14.5, {
      align: 'right',
    });
    y += 22;
  };

  if (statement.paymentHistory.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, y, contentW, 36, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noPaymentsInPeriod), marginX + contentW / 2, y + 21, {
      align: 'center',
    });
    y += 46;
  } else {
    drawPaymentsHeader();
    statement.paymentHistory.forEach((pay, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.3);
      const wrappedDesc = doc.splitTextToSize(
        toAsciiSafe(pay.description),
        180
      ) as string[];
      const rowH = Math.max(22, wrappedDesc.length * 10.5 + 10);

      if (ensureSpace(rowH)) {
        drawPaymentsHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, rowH, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + rowH, marginX + contentW, y + rowH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(71, 85, 105);
      doc.text(pay.date, marginX + 8, y + 14);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      wrappedDesc.forEach((line, lIdx) => {
        doc.text(line, marginX + 78, y + 14 + lIdx * 10.5);
      });

      doc.setTextColor(4, 120, 87);
      doc.text(formatStatementCurrencyPKR(pay.amount), marginX + 340, y + 14, {
        align: 'right',
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(formatStatementCurrencyPKR(pay.previousBalance), marginX + 432, y + 14, {
        align: 'right',
      });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(
        formatStatementCurrencyPKR(pay.remainingBalance),
        marginX + contentW - 8,
        y + 14,
        { align: 'right' }
      );

      y += rowH;
    });
  }

  // Footers across all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, A4_PT_HEIGHT - 30, marginX + contentW, A4_PT_HEIGHT - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.footerLeft), marginX, A4_PT_HEIGHT - 17);
    doc.text(
      `${toAsciiSafe(pdf.pageLabel)} ${p} ${toAsciiSafe(pdf.ofLabel)} ${pageCount}`,
      marginX + contentW,
      A4_PT_HEIGHT - 17,
      { align: 'right' }
    );
  }

  return {
    blob: doc.output('blob'),
    filename: getUdhaarStatementFilename(statement),
    pageCount,
    mode: 'vector',
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function renderCanvasStatementPdf(
  statement: CustomerStatementData,
  t: ToolTranslationBundle['udhaar'],
  language: Language
): PdfPreviewBundle {
  const sLabels = t.statement;
  const pdf = sLabels.pdf;
  const isRtl = language === 'ur';
  const fontFamily = isRtl
    ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Segoe UI", Tahoma, sans-serif'
    : '"DM Sans", "Plus Jakarta Sans", "Noto Sans Arabic", "Segoe UI", Arial, sans-serif';

  const W = 1190;
  const H = 1684;
  const marginX = 68;
  const contentW = W - marginX * 2;
  const footerTopY = H - 84;
  const pages: HTMLCanvasElement[] = [];

  const createPageCanvas = (): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textBaseline = 'alphabetic';
    pages.push(canvas);
    return { canvas, ctx };
  };

  let { ctx } = createPageCanvas();
  let y = 60;

  // Header Banner
  const grad = ctx.createLinearGradient(marginX, y, marginX + contentW, y + 156);
  grad.addColorStop(0, '#040D21');
  grad.addColorStop(1, '#0F2552');
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, marginX, y, contentW, 156, 20);
  ctx.fill();

  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(marginX, y + 142, contentW * 0.72, 14);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(marginX + contentW * 0.72, y + 142, contentW * 0.28, 14);

  const primaryX = isRtl ? marginX + contentW - 32 : marginX + 32;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 32px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(pdf.title, primaryX, y + 58);

  ctx.fillStyle = '#A5F3FC';
  ctx.font = `500 18px ${fontFamily}`;
  ctx.fillText(pdf.subtitle, primaryX, y + 100);

  const badgeText = getStandingLabel(statement.accountStanding, sLabels);
  ctx.font = `700 18px ${fontFamily}`;
  const badgeW = Math.max(210, ctx.measureText(badgeText).width + 44);
  const badgeRectX = isRtl ? marginX + 30 : marginX + contentW - badgeW - 30;
  ctx.fillStyle =
    statement.accountStanding === 'settled'
      ? '#10B981'
      : statement.accountStanding === 'receivable'
        ? '#06B6D4'
        : '#FACC15';
  drawRoundedRect(ctx, badgeRectX, y + 36, badgeW, 44, 12);
  ctx.fill();
  ctx.fillStyle = statement.accountStanding === 'settled' ? '#FFFFFF' : '#040D21';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeRectX + badgeW / 2, y + 64);

  y += 184;

  // Customer Metadata Box
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, marginX, y, contentW, 112, 14);
  ctx.fill();
  ctx.stroke();

  const metaLeftX = isRtl ? marginX + contentW - 24 : marginX + 24;
  const metaRightX = isRtl ? marginX + 24 : marginX + contentW - 24;

  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  const phonePart = statement.contact.phone ? ` (${statement.contact.phone})` : '';
  ctx.fillText(`${pdf.customerLabel}: ${statement.contact.name}${phonePart}`, metaLeftX, y + 42);

  ctx.fillStyle = '#475569';
  ctx.font = `500 17px ${fontFamily}`;
  ctx.fillText(
    `${pdf.dateRangeLabel}: ${formatStatementRangeText(statement.range, sLabels)}`,
    metaLeftX,
    y + 82
  );
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(
    `${pdf.generatedLabel}: ${formatDateTime(statement.generatedAt, language)}`,
    metaRightX,
    y + 82
  );

  y += 140;

  // 3 Overall KPI Cards
  const showPeriodSub = statement.range.preset !== 'all';
  const cardGap = 20;
  const cardW = (contentW - cardGap * 2) / 3;
  const cards = [
    {
      label: pdf.totalOriginalLabel,
      value: formatStatementCurrencyPKR(statement.overallTotalOriginal),
      sub: showPeriodSub
        ? `${pdf.inPeriodLabel}: ${formatStatementCurrencyPKR(statement.periodTotalOriginal)}`
        : `${pdf.givenShort}: ${formatStatementCurrencyPKR(statement.overallGivenOriginal)}`,
      bg: '#F0F9FF',
      border: '#BAE6FD',
      valColor: '#0E7490',
    },
    {
      label: pdf.totalPaidLabel,
      value: formatStatementCurrencyPKR(statement.overallTotalPaid),
      sub: showPeriodSub
        ? `${pdf.inPeriodLabel}: ${formatStatementCurrencyPKR(statement.periodTotalPaid)}`
        : `${pdf.paymentsCountLabel}: ${statement.paymentHistory.length}`,
      bg: '#ECFDF5',
      border: '#A7F3D0',
      valColor: '#047857',
    },
    {
      label: pdf.remainingBalanceLabel,
      value: formatStatementCurrencyPKR(Math.abs(statement.overallNetBalance)),
      sub: getStandingLabel(statement.accountStanding, sLabels),
      bg:
        statement.accountStanding === 'settled'
          ? '#ECFDF5'
          : statement.accountStanding === 'receivable'
            ? '#EFF6FF'
            : '#FFF7ED',
      border:
        statement.accountStanding === 'settled'
          ? '#A7F3D0'
          : statement.accountStanding === 'receivable'
            ? '#BFDBFE'
            : '#FED7AA',
      valColor:
        statement.accountStanding === 'settled'
          ? '#047857'
          : statement.accountStanding === 'receivable'
            ? '#1D4ED8'
            : '#C2410C',
    },
  ];

  cards.forEach((c, idx) => {
    const cx = isRtl
      ? marginX + (2 - idx) * (cardW + cardGap)
      : marginX + idx * (cardW + cardGap);
    ctx.fillStyle = c.bg;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cx, y, cardW, 130, 16);
    ctx.fill();
    ctx.stroke();

    const textX = isRtl ? cx + cardW - 22 : cx + 22;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#475569';
    ctx.font = `700 17px ${fontFamily}`;
    ctx.fillText(c.label, textX, y + 36);

    ctx.fillStyle = c.valColor;
    ctx.font = `700 26px ${fontFamily}`;
    ctx.direction = 'ltr';
    ctx.fillText(c.value, textX, y + 76);
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    ctx.fillStyle = '#64748B';
    ctx.font = `500 15px ${fontFamily}`;
    ctx.fillText(c.sub, textX, y + 108);
  });

  y += 156;

  if (showPeriodSub) {
    ctx.fillStyle = '#FEFCE8';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, marginX, y, contentW, 48, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#854D0E';
    ctx.font = `600 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(
      pdf.periodDistinctionNote,
      isRtl ? marginX + contentW - 18 : marginX + 18,
      y + 30
    );
    y += 68;
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > footerTopY) {
      ({ ctx } = createPageCanvas());
      y = 70;
      return true;
    }
    return false;
  };

  // Section 1: Udhaar Entries
  ensureSpace(130);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.entriesHeading} (${statement.entriesInPeriod.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 18;

  const eDateX = isRtl ? marginX + contentW - 16 : marginX + 16;
  const eTypeX = isRtl ? marginX + contentW - 155 : marginX + 155;
  const eDescX = isRtl ? marginX + contentW - 285 : marginX + 285;
  const eOrigX = isRtl ? marginX + contentW - 690 : marginX + 690;
  const ePaidX = isRtl ? marginX + contentW - 860 : marginX + 860;
  const eRemX = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawEntriesHeader = () => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(pdf.dateCol, eDateX, y + 28);
    ctx.fillText(pdf.typeCol, eTypeX, y + 28);
    ctx.fillText(pdf.descCol, eDescX, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.originalCol, eOrigX, y + 28);
    ctx.fillText(pdf.paidCol, ePaidX, y + 28);
    ctx.fillText(pdf.balanceCol, eRemX, y + 28);
    y += 44;
  };

  if (statement.entriesInPeriod.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, marginX, y, contentW, 74, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noEntriesInPeriod, marginX + contentW / 2, y + 43);
    y += 96;
  } else {
    drawEntriesHeader();
    statement.entriesInPeriod.forEach((entry, idx) => {
      const descText =
        entry.description ||
        (entry.direction === 'given' ? t.filterGiven : t.filterBorrowed);
      ctx.font = `600 16px ${fontFamily}`;
      const lines = wrapCanvasText(ctx, descText, 270);
      const rowH = Math.max(44, lines.length * 24 + 20);

      if (ensureSpace(rowH)) drawEntriesHeader();

      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, rowH);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + rowH);
      ctx.lineTo(marginX + contentW, y + rowH);
      ctx.stroke();

      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(entry.date, eDateX, y + 28);

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = entry.direction === 'given' ? '#0E7490' : '#C2410C';
      ctx.fillText(
        entry.direction === 'given' ? pdf.givenShort : pdf.borrowedShort,
        eTypeX,
        y + 28
      );

      ctx.font = `600 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      lines.forEach((line, lIdx) => {
        ctx.fillText(line, eDescX, y + 28 + lIdx * 24);
      });

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatStatementCurrencyPKR(entry.originalAmount), eOrigX, y + 28);
      ctx.fillStyle = '#047857';
      ctx.fillText(formatStatementCurrencyPKR(entry.paidAmount), ePaidX, y + 28);
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatStatementCurrencyPKR(entry.remainingAmount), eRemX, y + 28);
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      y += rowH;
    });
    y += 38;
  }

  // Section 2: Payment History
  ensureSpace(130);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.paymentHistoryHeading} (${statement.paymentHistory.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 18;

  const pDateX = isRtl ? marginX + contentW - 16 : marginX + 16;
  const pDescX = isRtl ? marginX + contentW - 155 : marginX + 155;
  const pAmtX = isRtl ? marginX + contentW - 650 : marginX + 650;
  const pPrevX = isRtl ? marginX + contentW - 845 : marginX + 845;
  const pRemX = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawPaymentsHeader = () => {
    ctx.fillStyle = '#040D21';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(pdf.dateCol, pDateX, y + 28);
    ctx.fillText(pdf.descCol, pDescX, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.amountCol, pAmtX, y + 28);
    ctx.fillText(pdf.prevBalanceCol, pPrevX, y + 28);
    ctx.fillText(pdf.remBalanceCol, pRemX, y + 28);
    y += 44;
  };

  if (statement.paymentHistory.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, marginX, y, contentW, 74, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noPaymentsInPeriod, marginX + contentW / 2, y + 43);
    y += 96;
  } else {
    drawPaymentsHeader();
    statement.paymentHistory.forEach((pay, idx) => {
      ctx.font = `600 16px ${fontFamily}`;
      const lines = wrapCanvasText(ctx, pay.description, 325);
      const rowH = Math.max(44, lines.length * 24 + 20);

      if (ensureSpace(rowH)) drawPaymentsHeader();

      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, rowH);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + rowH);
      ctx.lineTo(marginX + contentW, y + rowH);
      ctx.stroke();

      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(pay.date, pDateX, y + 28);

      ctx.font = `600 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      lines.forEach((line, lIdx) => {
        ctx.fillText(line, pDescX, y + 28 + lIdx * 24);
      });

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#047857';
      ctx.fillText(formatStatementCurrencyPKR(pay.amount), pAmtX, y + 28);

      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(formatStatementCurrencyPKR(pay.previousBalance), pPrevX, y + 28);

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatStatementCurrencyPKR(pay.remainingBalance), pRemX, y + 28);
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      y += rowH;
    });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });
  const totalPages = pages.length;
  const pageImages: string[] = [];

  pages.forEach((canvas, idx) => {
    const pCtx = canvas.getContext('2d');
    if (pCtx) {
      pCtx.strokeStyle = '#E2E8F0';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.moveTo(marginX, H - 62);
      pCtx.lineTo(marginX + contentW, H - 62);
      pCtx.stroke();

      pCtx.fillStyle = '#64748B';
      pCtx.font = `500 16px ${fontFamily}`;
      pCtx.direction = isRtl ? 'rtl' : 'ltr';
      pCtx.textAlign = isRtl ? 'right' : 'left';
      pCtx.fillText(pdf.footerLeft, isRtl ? marginX + contentW : marginX, H - 34);

      pCtx.textAlign = isRtl ? 'left' : 'right';
      pCtx.fillText(
        `${pdf.pageLabel} ${idx + 1} ${pdf.ofLabel} ${totalPages}`,
        isRtl ? marginX : marginX + contentW,
        H - 34
      );
    }

    const dataUrl = canvas.toDataURL('image/png');
    pageImages.push(dataUrl);
    if (idx > 0) doc.addPage();
    doc.addImage(
      dataUrl,
      'PNG',
      0,
      0,
      A4_PT_WIDTH,
      A4_PT_HEIGHT,
      undefined,
      'FAST'
    );
  });

  return {
    pdf: {
      blob: doc.output('blob'),
      filename: getUdhaarStatementFilename(statement),
      pageCount: totalPages,
      mode: 'canvas',
    },
    pageImages,
  };
}

export function createUdhaarStatementPreviewBundle(
  statement: CustomerStatementData,
  t: ToolTranslationBundle['udhaar'],
  language: Language
): PdfPreviewBundle {
  const canUseCanvas =
    typeof document !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined';
  const needsUnicodeCanvas =
    language === 'ur' || statementContainsNonLatin1(statement);

  if (canUseCanvas) {
    try {
      const canvasBundle = renderCanvasStatementPdf(statement, t, language);
      if (!needsUnicodeCanvas) {
        const vectorPdf = renderVectorStatementPdf(statement, t, language);
        return {
          pdf: vectorPdf,
          pageImages: canvasBundle.pageImages,
        };
      }
      return canvasBundle;
    } catch {
      // Fallback cleanly to vector PDF when canvas context is unavailable (e.g. headless tests)
    }
  }

  return {
    pdf: renderVectorStatementPdf(statement, t, language),
    pageImages: [],
  };
}

export function createUdhaarStatementPdf(
  statement: CustomerStatementData,
  t: ToolTranslationBundle['udhaar'],
  language: Language
): GeneratedPdfResult {
  return createUdhaarStatementPreviewBundle(statement, t, language).pdf;
}
