import { jsPDF } from 'jspdf';
import { ToolTranslationBundle } from '../i18n/toolTranslations';
import { Language } from '../types';
import {
  getCurrentMonthISO,
  getTodayISO,
  TransactionCategory,
  TransactionItem,
} from './storage';

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly';

export interface CategoryBreakdownItem {
  category: TransactionCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseReportData {
  period: ReportPeriodType;
  periodValue: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  expenseCategories: CategoryBreakdownItem[];
  incomeCategories: CategoryBreakdownItem[];
  transactions: TransactionItem[];
}

export interface CreateExpenseReportPdfOptions {
  language: Language;
  t: ToolTranslationBundle['expense'];
  generatedAt?: Date;
}

export interface GeneratedPdfResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  mode: 'vector' | 'canvas';
}

const A4_PT_WIDTH = 595.28;
const A4_PT_HEIGHT = 841.89;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatUTCDateISO(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isValidISOMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [, m] = value.split('-').map(Number);
  return m >= 1 && m <= 12;
}

/**
 * Returns Monday–Sunday ISO dates for the week containing `anchorDateISO`.
 */
export function getWeekRange(anchorDateISO: string): {
  startDate: string;
  endDate: string;
} {
  const safeAnchor = isValidISODate(anchorDateISO)
    ? anchorDateISO
    : getTodayISO();
  const [y, m, d] = safeAnchor.split('-').map(Number);
  const anchorMs = Date.UTC(y, m - 1, d);
  const utcDay = new Date(anchorMs).getUTCDay(); // 0 = Sun ... 6 = Sat
  const offsetFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  const dayMs = 24 * 60 * 60 * 1000;
  const startMs = anchorMs - offsetFromMonday * dayMs;
  const endMs = startMs + 6 * dayMs;
  return {
    startDate: formatUTCDateISO(startMs),
    endDate: formatUTCDateISO(endMs),
  };
}

/**
 * Returns first and last day ISO dates for `monthISO` (`YYYY-MM`).
 */
export function getMonthRange(monthISO: string): {
  startDate: string;
  endDate: string;
} {
  const safeMonth = isValidISOMonth(monthISO)
    ? monthISO
    : getCurrentMonthISO();
  const [y, m] = safeMonth.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    startDate: `${y}-${pad2(m)}-01`,
    endDate: `${y}-${pad2(m)}-${pad2(lastDay)}`,
  };
}

function buildCategoryBreakdown(
  items: TransactionItem[],
  grandTotal: number
): CategoryBreakdownItem[] {
  const map = new Map<TransactionCategory, { total: number; count: number }>();
  for (const tx of items) {
    const existing = map.get(tx.category) ?? { total: 0, count: 0 };
    existing.total += tx.amount;
    existing.count += 1;
    map.set(tx.category, existing);
  }
  return Array.from(map.entries())
    .map(([category, stats]) => ({
      category,
      total: Number(stats.total.toFixed(2)),
      count: stats.count,
      percentage:
        grandTotal > 0
          ? Number(((stats.total / grandTotal) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.category.localeCompare(b.category);
    });
}

export function buildExpenseReport(
  transactions: TransactionItem[],
  period: ReportPeriodType,
  anchorValue: string
): ExpenseReportData {
  let startDate: string;
  let endDate: string;
  let periodValue: string;

  if (period === 'daily') {
    const safeDay = isValidISODate(anchorValue) ? anchorValue : getTodayISO();
    startDate = safeDay;
    endDate = safeDay;
    periodValue = safeDay;
  } else if (period === 'weekly') {
    const safeDay = isValidISODate(anchorValue) ? anchorValue : getTodayISO();
    const range = getWeekRange(safeDay);
    startDate = range.startDate;
    endDate = range.endDate;
    periodValue = safeDay;
  } else {
    const safeMonth = isValidISOMonth(anchorValue)
      ? anchorValue
      : getCurrentMonthISO();
    const range = getMonthRange(safeMonth);
    startDate = range.startDate;
    endDate = range.endDate;
    periodValue = safeMonth;
  }

  const filtered = [...transactions]
    .filter((tx) => tx.date >= startDate && tx.date <= endDate)
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.updatedAt - a.updatedAt;
    });

  const incomeItems: TransactionItem[] = [];
  const expenseItems: TransactionItem[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of filtered) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      incomeItems.push(tx);
    } else {
      totalExpense += tx.amount;
      expenseItems.push(tx);
    }
  }

  const roundedIncome = Number(totalIncome.toFixed(2));
  const roundedExpense = Number(totalExpense.toFixed(2));

  return {
    period,
    periodValue,
    startDate,
    endDate,
    totalIncome: roundedIncome,
    totalExpense: roundedExpense,
    netBalance: Number((roundedIncome - roundedExpense).toFixed(2)),
    transactionCount: filtered.length,
    incomeCount: incomeItems.length,
    expenseCount: expenseItems.length,
    expenseCategories: buildCategoryBreakdown(expenseItems, roundedExpense),
    incomeCategories: buildCategoryBreakdown(incomeItems, roundedIncome),
    transactions: filtered,
  };
}

export function formatReportPKR(amount: number, signed = false): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `-PKR ${formatted}`;
  if (signed && amount > 0) return `+PKR ${formatted}`;
  return `PKR ${formatted}`;
}

export function formatReportRangeLabel(report: ExpenseReportData): string {
  if (report.period === 'daily') return report.startDate;
  if (report.period === 'weekly') {
    return `${report.startDate} to ${report.endDate}`;
  }
  return `${report.periodValue} (${report.startDate} to ${report.endDate})`;
}

export function getReportFilename(report: ExpenseReportData): string {
  if (report.period === 'daily') {
    return `EasyDay-Daily-Report-${report.startDate}.pdf`;
  }
  if (report.period === 'weekly') {
    return `EasyDay-Weekly-Report-${report.startDate}_to_${report.endDate}.pdf`;
  }
  return `EasyDay-Monthly-Report-${report.periodValue}.pdf`;
}

function hasNonLatin1(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 255) return true;
  }
  return false;
}

function reportContainsNonLatin1(
  report: ExpenseReportData,
  t: ToolTranslationBundle['expense']
): boolean {
  if (hasNonLatin1(t.pdfLabels.reportTitle)) return true;
  for (const tx of report.transactions) {
    if (hasNonLatin1(tx.description)) return true;
  }
  return false;
}

function toAsciiSafe(text: string): string {
  return text.replace(/[^\x20-\xFF]/g, '?');
}

function formatGeneratedTimestamp(date: Date, language: Language): string {
  try {
    return date.toLocaleString(language === 'ur' ? 'ur-PK' : 'en-PK', {
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

function getPeriodBadgeText(
  period: ReportPeriodType,
  t: ToolTranslationBundle['expense']
): string {
  if (period === 'daily') return t.pdfLabels.dailyBadge;
  if (period === 'weekly') return t.pdfLabels.weeklyBadge;
  return t.pdfLabels.monthlyBadge;
}

function renderVectorPdf(
  report: ExpenseReportData,
  options: CreateExpenseReportPdfOptions
): GeneratedPdfResult {
  const { language, t, generatedAt = new Date() } = options;
  const labels = t.pdfLabels;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const marginX = 36;
  const contentW = A4_PT_WIDTH - marginX * 2;
  const footerReserveY = A4_PT_HEIGHT - 40;
  let y = 32;

  // Header Banner
  doc.setFillColor(11, 111, 242); // #0B6FF2
  doc.roundedRect(marginX, y, contentW, 74, 10, 10, 'F');
  doc.setFillColor(13, 148, 136); // #0D9488 accent bar
  doc.rect(marginX, y + 66, contentW, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(toAsciiSafe(labels.reportTitle), marginX + 16, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(224, 242, 254);
  doc.text(toAsciiSafe(labels.subtitle), marginX + 16, y + 46);

  // Badge on right of banner
  const badgeText = toAsciiSafe(getPeriodBadgeText(report.period, t));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const badgeW = Math.max(92, doc.getTextWidth(badgeText) + 20);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(
    marginX + contentW - badgeW - 14,
    y + 16,
    badgeW,
    22,
    6,
    6,
    'F'
  );
  doc.setTextColor(11, 111, 242);
  doc.text(
    badgeText,
    marginX + contentW - badgeW / 2 - 14,
    y + 30.5,
    { align: 'center' }
  );

  y += 90;

  // Meta bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentW, 30, 6, 6, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const periodStr = `${toAsciiSafe(labels.periodLabel)}: ${formatReportRangeLabel(report)}`;
  const generatedStr = `${toAsciiSafe(labels.generatedLabel)}: ${toAsciiSafe(formatGeneratedTimestamp(generatedAt, language))}`;
  const countStr = `${toAsciiSafe(labels.recordsLabel)}: ${report.transactionCount}`;
  doc.text(periodStr, marginX + 10, y + 18.5);
  doc.text(generatedStr, marginX + contentW / 2 - 20, y + 18.5);
  doc.text(countStr, marginX + contentW - 10, y + 18.5, { align: 'right' });

  y += 42;

  // 3 Summary Cards
  type RgbTuple = readonly [number, number, number];
  const cardGap = 10;
  const cardW = (contentW - cardGap * 2) / 3;
  const cards: Array<{
    label: string;
    value: string;
    bg: RgbTuple;
    border: RgbTuple;
    text: RgbTuple;
  }> = [
    {
      label: toAsciiSafe(labels.totalIncomeLabel),
      value: `+${formatReportPKR(report.totalIncome)}`,
      bg: [240, 253, 250],
      border: [153, 246, 228],
      text: [15, 118, 110],
    },
    {
      label: toAsciiSafe(labels.totalExpensesLabel),
      value: `-${formatReportPKR(report.totalExpense)}`,
      bg: [255, 247, 237],
      border: [254, 215, 170],
      text: [194, 65, 12],
    },
    {
      label: toAsciiSafe(labels.netBalanceLabel),
      value: formatReportPKR(report.netBalance),
      bg: report.netBalance >= 0 ? [239, 246, 255] : [254, 242, 242],
      border: report.netBalance >= 0 ? [191, 219, 254] : [254, 202, 202],
      text: report.netBalance >= 0 ? [29, 78, 216] : [185, 28, 28],
    },
  ];

  cards.forEach((card, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.roundedRect(cx, y, cardW, 54, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(card.label, cx + 12, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.value, cx + 12, y + 40);
  });

  y += 72;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > footerReserveY) {
      doc.addPage();
      y = 36;
      return true;
    }
    return false;
  };

  // Category Breakdown (Expenses & Income)
  const combinedCategories = [
    ...report.expenseCategories.map((c) => ({ ...c, kind: 'expense' as const })),
    ...report.incomeCategories.map((c) => ({ ...c, kind: 'income' as const })),
  ];

  if (combinedCategories.length > 0) {
    ensureSpace(58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(toAsciiSafe(labels.categoryHeading), marginX, y);
    y += 10;

    // Header bar
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, y, contentW, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(toAsciiSafe(labels.categoryCol), marginX + 8, y + 13);
    doc.text(toAsciiSafe(labels.typeCol), marginX + 220, y + 13);
    doc.text(toAsciiSafe(labels.countCol), marginX + 305, y + 13, { align: 'right' });
    doc.text(toAsciiSafe(labels.shareCol), marginX + 375, y + 13, { align: 'right' });
    doc.text(toAsciiSafe(labels.amountCol), marginX + contentW - 8, y + 13, {
      align: 'right',
    });
    y += 20;

    combinedCategories.forEach((row, idx) => {
      ensureSpace(22);
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, 20, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 20, marginX + contentW, y + 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text(toAsciiSafe(t.categories[row.category]), marginX + 8, y + 13.5);

      const typeLabel =
        row.kind === 'income' ? toAsciiSafe(t.typeIncome) : toAsciiSafe(t.typeExpense);
      if (row.kind === 'income') doc.setTextColor(15, 118, 110);
      else doc.setTextColor(194, 65, 12);
      doc.text(typeLabel, marginX + 220, y + 13.5);

      doc.setTextColor(71, 85, 105);
      doc.text(String(row.count), marginX + 305, y + 13.5, { align: 'right' });
      doc.text(`${row.percentage}%`, marginX + 375, y + 13.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatReportPKR(row.total), marginX + contentW - 8, y + 13.5, {
        align: 'right',
      });
      y += 20;
    });

    y += 18;
  }

  // Transactions Section
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${toAsciiSafe(labels.transactionsHeading)} (${report.transactions.length})`,
    marginX,
    y
  );
  y += 10;

  const drawTransactionsHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(labels.dateCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(labels.descriptionCol), marginX + 82, y + 14.5);
    doc.text(toAsciiSafe(labels.categoryCol), marginX + 286, y + 14.5);
    doc.text(toAsciiSafe(labels.typeCol), marginX + 382, y + 14.5);
    doc.text(toAsciiSafe(labels.amountCol), marginX + contentW - 8, y + 14.5, {
      align: 'right',
    });
    y += 22;
  };

  if (report.transactions.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, y, contentW, 44, 6, 6, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      toAsciiSafe(labels.noTransactionsInPeriod),
      marginX + contentW / 2,
      y + 25,
      { align: 'center' }
    );
    y += 52;
  } else {
    drawTransactionsHeader();

    report.transactions.forEach((tx, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.7);
      const wrappedDesc = doc.splitTextToSize(
        toAsciiSafe(tx.description),
        192
      ) as string[];
      const rowHeight = Math.max(22, wrappedDesc.length * 11 + 10);

      if (ensureSpace(rowHeight)) {
        drawTransactionsHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, rowHeight, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + rowHeight, marginX + contentW, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(tx.date, marginX + 8, y + 14);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      wrappedDesc.forEach((line, lineIdx) => {
        doc.text(line, marginX + 82, y + 14 + lineIdx * 11);
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(
        toAsciiSafe(t.categories[tx.category]),
        marginX + 286,
        y + 14
      );

      if (tx.type === 'income') {
        doc.setTextColor(15, 118, 110);
      } else {
        doc.setTextColor(194, 65, 12);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(
        toAsciiSafe(tx.type === 'income' ? t.typeIncome : t.typeExpense),
        marginX + 382,
        y + 14
      );
      doc.text(
        formatReportPKR(tx.type === 'income' ? tx.amount : -tx.amount, true),
        marginX + contentW - 8,
        y + 14,
        { align: 'right' }
      );

      y += rowHeight;
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
    doc.text(toAsciiSafe(labels.footerLeft), marginX, A4_PT_HEIGHT - 17);
    doc.text(
      `${toAsciiSafe(labels.pageLabel)} ${p} ${toAsciiSafe(labels.ofLabel)} ${pageCount}`,
      marginX + contentW,
      A4_PT_HEIGHT - 17,
      { align: 'right' }
    );
  }

  return {
    blob: doc.output('blob'),
    filename: getReportFilename(report),
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
  if (words.length === 0) return [''];
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

/**
 * High-DPI Canvas-to-PDF renderer used when Urdu RTL or non-Latin-1 scripts are present.
 */
function renderCanvasPdf(
  report: ExpenseReportData,
  options: CreateExpenseReportPdfOptions
): GeneratedPdfResult {
  const { language, t, generatedAt = new Date() } = options;
  const labels = t.pdfLabels;
  const isRtl = language === 'ur';
  const fontFamily = isRtl
    ? '"Noto Nastaliq Urdu", "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif'
    : '"Inter", "Segoe UI", Arial, sans-serif';

  // 2x A4 logical pixel canvas (1190 x 1684)
  const W = 1190;
  const H = 1684;
  const marginX = 72;
  const contentW = W - marginX * 2;
  const footerTopY = H - 80;

  const pages: HTMLCanvasElement[] = [];

  const createPageCanvas = (): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable');
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textBaseline = 'alphabetic';
    pages.push(canvas);
    return { canvas, ctx };
  };

  let { ctx } = createPageCanvas();
  let y = 64;

  // Header Banner
  const grad = ctx.createLinearGradient(marginX, y, marginX + contentW, y + 148);
  grad.addColorStop(0, '#0B6FF2');
  grad.addColorStop(1, '#0D9488');
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, marginX, y, contentW, 148, 20);
  ctx.fill();

  const headerPrimaryX = isRtl ? marginX + contentW - 32 : marginX + 32;
  const headerBadgeX = isRtl ? marginX + 32 : marginX + contentW - 32;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 32px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(labels.reportTitle, headerPrimaryX, y + 60);

  ctx.fillStyle = '#E0F2FE';
  ctx.font = `500 18px ${fontFamily}`;
  ctx.fillText(labels.subtitle, headerPrimaryX, y + 102);

  // Badge pill inside header
  const badgeText = getPeriodBadgeText(report.period, t);
  ctx.font = `700 18px ${fontFamily}`;
  const badgeWidth = Math.max(180, ctx.measureText(badgeText).width + 44);
  const badgeRectX = isRtl ? headerBadgeX : headerBadgeX - badgeWidth;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, badgeRectX, y + 36, badgeWidth, 44, 12);
  ctx.fill();
  ctx.fillStyle = '#0B6FF2';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeRectX + badgeWidth / 2, y + 64);

  y += 176;

  // Metadata Box
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, marginX, y, contentW, 60, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = `500 17px ${fontFamily}`;
  const periodLine = `${labels.periodLabel}: ${formatReportRangeLabel(report)}`;
  const genLine = `${labels.generatedLabel}: ${formatGeneratedTimestamp(generatedAt, language)}`;
  const recLine = `${labels.recordsLabel}: ${report.transactionCount}`;

  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(periodLine, isRtl ? marginX + contentW - 20 : marginX + 20, y + 37);
  ctx.textAlign = 'center';
  ctx.fillText(genLine, marginX + contentW / 2, y + 37);
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(recLine, isRtl ? marginX + 20 : marginX + contentW - 20, y + 37);

  y += 84;

  // 3 Summary Cards
  const cardGap = 20;
  const cardW = (contentW - cardGap * 2) / 3;
  const kpiCards = [
    {
      label: labels.totalIncomeLabel,
      value: `+${formatReportPKR(report.totalIncome)}`,
      bg: '#F0FDFA',
      border: '#99F6E4',
      text: '#0F766E',
    },
    {
      label: labels.totalExpensesLabel,
      value: `-${formatReportPKR(report.totalExpense)}`,
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#C2410C',
    },
    {
      label: labels.netBalanceLabel,
      value: formatReportPKR(report.netBalance),
      bg: report.netBalance >= 0 ? '#EFF6FF' : '#FEF2F2',
      border: report.netBalance >= 0 ? '#BFDBFE' : '#FECACA',
      text: report.netBalance >= 0 ? '#1D4ED8' : '#B91C1C',
    },
  ];

  kpiCards.forEach((card, idx) => {
    const cx = isRtl
      ? marginX + (2 - idx) * (cardW + cardGap)
      : marginX + idx * (cardW + cardGap);
    ctx.fillStyle = card.bg;
    ctx.strokeStyle = card.border;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cx, y, cardW, 112, 16);
    ctx.fill();
    ctx.stroke();

    const textX = isRtl ? cx + cardW - 24 : cx + 24;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#475569';
    ctx.font = `700 17px ${fontFamily}`;
    ctx.fillText(card.label, textX, y + 40);

    ctx.fillStyle = card.text;
    ctx.font = `700 26px ${fontFamily}`;
    ctx.direction = 'ltr';
    ctx.fillText(card.value, textX, y + 82);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
  });

  y += 144;

  const ensureSpace = (needed: number): boolean => {
    if (y + needed > footerTopY) {
      ({ ctx } = createPageCanvas());
      y = 72;
      return true;
    }
    return false;
  };

  // Category Breakdown
  const combinedCats = [
    ...report.expenseCategories.map((c) => ({ ...c, kind: 'expense' as const })),
    ...report.incomeCategories.map((c) => ({ ...c, kind: 'income' as const })),
  ];

  if (combinedCats.length > 0) {
    ensureSpace(120);
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 22px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(labels.categoryHeading, isRtl ? marginX + contentW : marginX, y);
    y += 18;

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(marginX, y, contentW, 42);
    ctx.fillStyle = '#334155';
    ctx.font = `700 17px ${fontFamily}`;

    const colCatX = isRtl ? marginX + contentW - 16 : marginX + 16;
    const colTypeX = isRtl ? marginX + contentW - 360 : marginX + 360;
    const colCntX = isRtl ? marginX + contentW - 560 : marginX + 560;
    const colShareX = isRtl ? marginX + contentW - 700 : marginX + 700;
    const colAmtX = isRtl ? marginX + 16 : marginX + contentW - 16;

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(labels.categoryCol, colCatX, y + 27);
    ctx.fillText(labels.typeCol, colTypeX, y + 27);
    ctx.textAlign = 'center';
    ctx.fillText(labels.countCol, colCntX, y + 27);
    ctx.fillText(labels.shareCol, colShareX, y + 27);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(labels.amountCol, colAmtX, y + 27);
    y += 42;

    combinedCats.forEach((row, idx) => {
      ensureSpace(44);
      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, 40);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + 40);
      ctx.lineTo(marginX + contentW, y + 40);
      ctx.stroke();

      ctx.font = `500 17px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(t.categories[row.category], colCatX, y + 26);

      ctx.fillStyle = row.kind === 'income' ? '#0F766E' : '#C2410C';
      ctx.fillText(
        row.kind === 'income' ? t.typeIncome : t.typeExpense,
        colTypeX,
        y + 26
      );

      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(String(row.count), colCntX, y + 26);
      ctx.fillText(`${row.percentage}%`, colShareX, y + 26);

      ctx.fillStyle = '#0F172A';
      ctx.font = `700 17px ${fontFamily}`;
      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillText(formatReportPKR(row.total), colAmtX, y + 26);
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      y += 40;
    });

    y += 36;
  }

  // Transactions Section
  ensureSpace(130);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${labels.transactionsHeading} (${report.transactions.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 18;

  const tDateX = isRtl ? marginX + contentW - 16 : marginX + 16;
  const tDescX = isRtl ? marginX + contentW - 165 : marginX + 165;
  const tCatX = isRtl ? marginX + contentW - 565 : marginX + 565;
  const tTypeX = isRtl ? marginX + contentW - 760 : marginX + 760;
  const tAmtX = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawTxHeader = () => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 17px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(labels.dateCol, tDateX, y + 28);
    ctx.fillText(labels.descriptionCol, tDescX, y + 28);
    ctx.fillText(labels.categoryCol, tCatX, y + 28);
    ctx.fillText(labels.typeCol, tTypeX, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(labels.amountCol, tAmtX, y + 28);
    y += 44;
  };

  if (report.transactions.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, marginX, y, contentW, 92, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = `500 19px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(labels.noTransactionsInPeriod, marginX + contentW / 2, y + 52);
    y += 108;
  } else {
    drawTxHeader();

    report.transactions.forEach((tx, idx) => {
      ctx.font = `700 17px ${fontFamily}`;
      const lines = wrapCanvasText(ctx, tx.description, 375);
      const rowH = Math.max(44, lines.length * 24 + 20);

      if (ensureSpace(rowH)) {
        drawTxHeader();
      }

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
      ctx.fillText(tx.date, tDateX, y + 28);

      ctx.font = `700 17px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      lines.forEach((line, lIdx) => {
        ctx.fillText(line, tDescX, y + 28 + lIdx * 24);
      });

      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(t.categories[tx.category], tCatX, y + 28);

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = tx.type === 'income' ? '#0F766E' : '#C2410C';
      ctx.fillText(
        tx.type === 'income' ? t.typeIncome : t.typeExpense,
        tTypeX,
        y + 28
      );

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillText(
        formatReportPKR(tx.type === 'income' ? tx.amount : -tx.amount, true),
        tAmtX,
        y + 28
      );
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      y += rowH;
    });
  }

  // Footers across all canvases + build PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const totalPages = pages.length;
  pages.forEach((canvas, idx) => {
    const pCtx = canvas.getContext('2d');
    if (pCtx) {
      pCtx.strokeStyle = '#E2E8F0';
      pCtx.lineWidth = 1.5;
      pCtx.beginPath();
      pCtx.moveTo(marginX, H - 60);
      pCtx.lineTo(marginX + contentW, H - 60);
      pCtx.stroke();

      pCtx.fillStyle = '#64748B';
      pCtx.font = `500 16px ${fontFamily}`;
      pCtx.direction = isRtl ? 'rtl' : 'ltr';
      pCtx.textAlign = isRtl ? 'right' : 'left';
      pCtx.fillText(labels.footerLeft, isRtl ? marginX + contentW : marginX, H - 32);

      pCtx.textAlign = isRtl ? 'left' : 'right';
      pCtx.fillText(
        `${labels.pageLabel} ${idx + 1} ${labels.ofLabel} ${totalPages}`,
        isRtl ? marginX : marginX + contentW,
        H - 32
      );
    }

    if (idx > 0) doc.addPage();
    doc.addImage(
      canvas.toDataURL('image/png'),
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
    blob: doc.output('blob'),
    filename: getReportFilename(report),
    pageCount: totalPages,
    mode: 'canvas',
  };
}

export function createExpenseReportPdf(
  report: ExpenseReportData,
  options: CreateExpenseReportPdfOptions
): GeneratedPdfResult {
  const canUseCanvas =
    typeof document !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined';
  const needsUnicodeCanvas =
    options.language === 'ur' || reportContainsNonLatin1(report, options.t);

  if (canUseCanvas && needsUnicodeCanvas) {
    try {
      return renderCanvasPdf(report, options);
    } catch {
      // Fallback to vector jsPDF if canvas context is unavailable (e.g., jsdom)
      return renderVectorPdf(report, options);
    }
  }

  return renderVectorPdf(report, options);
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Browser document environment is required to download PDF.');
  }
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 30_000);
}

export function canSharePdfFiles(): boolean {
  try {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function' ||
      typeof File === 'undefined'
    ) {
      return false;
    }
    const probe = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test.pdf', {
      type: 'application/pdf',
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function sharePdfBlob(
  blob: Blob,
  filename: string,
  title: string
): Promise<'shared' | 'cancelled'> {
  if (typeof File === 'undefined' || typeof navigator.share !== 'function') {
    throw new Error('File sharing is not supported on this device.');
  }
  const file = new File([blob], filename, { type: 'application/pdf' });
  try {
    await navigator.share({
      title,
      files: [file],
    });
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'cancelled';
    }
    throw err;
  }
}
