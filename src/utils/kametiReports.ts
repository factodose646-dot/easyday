import { jsPDF } from 'jspdf';
import { ToolTranslationBundle } from '../i18n/toolTranslations';
import { Language } from '../types';
import { GeneratedPdfResult, PdfPreviewBundle } from './expenseReport';
import {
  formatKametiCurrencyPKR,
  formatKametiCurrencyRs,
  KametiCommitteeReportData,
  KametiMemberStatementData,
} from './kametiEngine';

const A4_PT_WIDTH = 595.28;
const A4_PT_HEIGHT = 841.89;

function hasNonLatin1(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 255) return true;
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

function slugPart(raw: string, fallback: string): string {
  return (
    raw
      .trim()
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '-') || fallback
  );
}

export function getKametiMemberStatementFilename(
  statement: KametiMemberStatementData
): string {
  const cSlug = slugPart(statement.committee.name, 'Kameti');
  const mSlug = slugPart(statement.member.name, 'Member');
  return `EasyDay-Kameti-${cSlug}-${mSlug}.pdf`;
}

export function getKametiCommitteeReportFilename(
  report: KametiCommitteeReportData
): string {
  const cSlug = slugPart(report.committee.name, 'Committee');
  const day = report.generatedAt.toISOString().slice(0, 10);
  return `EasyDay-Kameti-Report-${cSlug}-${day}.pdf`;
}

export function buildKametiMemberShareCaption(
  statement: KametiMemberStatementData,
  lang: Language,
  t: ToolTranslationBundle['kameti']
): string {
  const pdf = t.reportsUI.pdf;
  if (lang === 'ur') {
    return `${statement.member.name} — ${statement.committee.name} (${pdf.memberStatementTitle})\nادائیگی: ${formatKametiCurrencyRs(statement.totalPaid)} | باقی: ${formatKametiCurrencyRs(statement.outstandingAmount)}\n— EasyDay`;
  }
  return `${statement.member.name} — ${statement.committee.name} (${pdf.memberStatementTitle})\nPaid: ${formatKametiCurrencyRs(statement.totalPaid)} | Outstanding: ${formatKametiCurrencyRs(statement.outstandingAmount)}\n— EasyDay`;
}

export function buildKametiCommitteeShareCaption(
  report: KametiCommitteeReportData,
  lang: Language,
  t: ToolTranslationBundle['kameti']
): string {
  const pdf = t.reportsUI.pdf;
  const d = report.dashboard;
  if (lang === 'ur') {
    return `${report.committee.name} — ${pdf.committeeReportTitle}\nوصول شدہ: ${formatKametiCurrencyRs(d.totalCollected)} / ${formatKametiCurrencyRs(d.expectedTotalCollection)}\n— EasyDay`;
  }
  return `${report.committee.name} — ${pdf.committeeReportTitle}\nCollected: ${formatKametiCurrencyRs(d.totalCollected)} / ${formatKametiCurrencyRs(d.expectedTotalCollection)}\n— EasyDay`;
}

function memberStatementHasNonLatin1(statement: KametiMemberStatementData): boolean {
  if (hasNonLatin1(statement.committee.name)) return true;
  if (hasNonLatin1(statement.member.name)) return true;
  if (statement.member.address && hasNonLatin1(statement.member.address)) return true;
  for (const p of statement.paymentHistory) {
    if (hasNonLatin1(p.note)) return true;
  }
  return false;
}

function committeeReportHasNonLatin1(report: KametiCommitteeReportData): boolean {
  if (hasNonLatin1(report.committee.name)) return true;
  if (hasNonLatin1(report.committee.description)) return true;
  for (const m of report.memberSummaries) {
    if (hasNonLatin1(m.member.name)) return true;
  }
  for (const d of report.draws) {
    if (hasNonLatin1(d.memberName) || hasNonLatin1(d.notes)) return true;
  }
  return false;
}

function renderVectorMemberStatementPdf(
  statement: KametiMemberStatementData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): GeneratedPdfResult {
  const pdf = t.reportsUI.pdf;
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

  // Navy + Cyan + Yellow Banner
  doc.setFillColor(4, 13, 33);
  doc.roundedRect(marginX, y, contentW, 78, 10, 10, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(marginX, y + 70, contentW * 0.72, 8, 'F');
  doc.setFillColor(250, 204, 21);
  doc.rect(marginX + contentW * 0.72, y + 70, contentW * 0.28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(toAsciiSafe(pdf.memberStatementTitle), marginX + 16, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(165, 243, 252);
  doc.text(toAsciiSafe(pdf.subtitle), marginX + 16, y + 46);

  const turnBadge = statement.effectiveTurnNumber
    ? `Turn #${statement.effectiveTurnNumber} (${statement.drawRecord?.isCompleted ? 'Completed' : 'Assigned'})`
    : 'Turn Pending';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const badgeW = Math.max(104, doc.getTextWidth(turnBadge) + 20);
  doc.setFillColor(statement.drawRecord?.isCompleted ? 16 : 250, statement.drawRecord?.isCompleted ? 185 : 204, statement.drawRecord?.isCompleted ? 129 : 21);
  doc.setTextColor(statement.drawRecord?.isCompleted ? 255 : 4, statement.drawRecord?.isCompleted ? 255 : 13, statement.drawRecord?.isCompleted ? 255 : 33);
  doc.roundedRect(marginX + contentW - badgeW - 14, y + 18, badgeW, 22, 6, 6, 'F');
  doc.text(turnBadge, marginX + contentW - badgeW / 2 - 14, y + 32.5, { align: 'center' });

  y += 92;

  // Member + Committee Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentW, 56, 7, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${toAsciiSafe(pdf.memberLabel)}: #${statement.member.memberNumber} ${toAsciiSafe(statement.member.name)}${
      statement.member.phone ? ` (${toAsciiSafe(statement.member.phone)})` : ''
    }`,
    marginX + 12,
    y + 20
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${toAsciiSafe(pdf.committeeLabel)}: ${toAsciiSafe(statement.committee.name)}`,
    marginX + 12,
    y + 40
  );
  doc.text(
    `${toAsciiSafe(pdf.generatedLabel)}: ${toAsciiSafe(formatDateTime(statement.generatedAt, language))}`,
    marginX + contentW - 12,
    y + 40,
    { align: 'right' }
  );

  y += 70;

  // 3 KPI Cards
  type RgbTuple = readonly [number, number, number];
  const cardGap = 10;
  const cardW = (contentW - cardGap * 2) / 3;
  const cards: Array<{
    label: string;
    value: string;
    sub: string;
    bg: RgbTuple;
    border: RgbTuple;
    valColor: RgbTuple;
  }> = [
    {
      label: toAsciiSafe(pdf.memberExpectedLabel),
      value: formatKametiCurrencyPKR(statement.totalExpected),
      sub: `${statement.installments.length} ${toAsciiSafe(pdf.cycleCol)}s`,
      bg: [240, 249, 255],
      border: [186, 230, 253],
      valColor: [14, 116, 144],
    },
    {
      label: toAsciiSafe(pdf.memberPaidLabel),
      value: formatKametiCurrencyPKR(statement.totalPaid),
      sub: `${statement.paidCount} ${toAsciiSafe(t.installmentStatuses.paid)} · ${statement.partialCount} ${toAsciiSafe(t.installmentStatuses.partial)}`,
      bg: [236, 253, 245],
      border: [167, 243, 208],
      valColor: [4, 120, 87],
    },
    {
      label: toAsciiSafe(pdf.memberOutstandingLabel),
      value: formatKametiCurrencyPKR(statement.outstandingAmount),
      sub: `${statement.overdueCount} ${toAsciiSafe(t.installmentStatuses.overdue)}`,
      bg: statement.outstandingAmount <= 0 ? [236, 253, 245] : [255, 247, 237],
      border: statement.outstandingAmount <= 0 ? [167, 243, 208] : [254, 215, 170],
      valColor: statement.outstandingAmount <= 0 ? [4, 120, 87] : [194, 65, 12],
    },
  ];

  cards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.roundedRect(cx, y, cardW, 62, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(c.label, cx + 10, y + 17);

    doc.setFontSize(13);
    doc.setTextColor(c.valColor[0], c.valColor[1], c.valColor[2]);
    doc.text(c.value, cx + 10, y + 37);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cx + 10, y + 52);
  });

  y += 78;

  const ensureSpace = (needed: number) => {
    if (y + needed > footerReserveY) {
      doc.addPage();
      y = 34;
      return true;
    }
    return false;
  };

  // Installments Table
  ensureSpace(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.installmentsHeading)} (${statement.installments.length})`, marginX, y);
  y += 10;

  const drawInsHeader = () => {
    doc.setFillColor(4, 13, 33);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.cycleCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.dueDateCol), marginX + 74, y + 14.5);
    doc.text(toAsciiSafe(pdf.expectedCol), marginX + 235, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.paidCol), marginX + 325, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.remainingCol), marginX + 418, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.statusCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  if (statement.installments.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentW, 34, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noRowsMsg), marginX + contentW / 2, y + 21, { align: 'center' });
    y += 46;
  } else {
    drawInsHeader();
    statement.installments.forEach((v, idx) => {
      if (ensureSpace(22)) drawInsHeader();
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, 22, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 22, marginX + contentW, y + 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${v.installment.cycleNumber}`, marginX + 8, y + 14.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(v.installment.dueDate, marginX + 74, y + 14.5);

      doc.setTextColor(15, 23, 42);
      doc.text(formatKametiCurrencyPKR(v.installment.expectedAmount), marginX + 235, y + 14.5, { align: 'right' });
      doc.setTextColor(4, 120, 87);
      doc.text(formatKametiCurrencyPKR(v.paidAmount), marginX + 325, y + 14.5, { align: 'right' });
      doc.setTextColor(15, 23, 42);
      doc.text(formatKametiCurrencyPKR(v.remainingAmount), marginX + 418, y + 14.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      if (v.status === 'paid') doc.setTextColor(4, 120, 87);
      else if (v.status === 'overdue') doc.setTextColor(190, 18, 60);
      else if (v.status === 'partial') doc.setTextColor(180, 83, 9);
      else doc.setTextColor(71, 85, 105);
      doc.text(
        toAsciiSafe(t.installmentStatuses[v.status]),
        marginX + contentW - 8,
        y + 14.5,
        { align: 'right' }
      );
      y += 22;
    });
    y += 18;
  }

  // Payment History Table
  ensureSpace(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.paymentHistoryHeading)} (${statement.paymentHistory.length})`, marginX, y);
  y += 10;

  const drawPayHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.dateCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.cycleCol), marginX + 84, y + 14.5);
    doc.text(toAsciiSafe(pdf.methodCol), marginX + 135, y + 14.5);
    doc.text(toAsciiSafe(pdf.noteCol), marginX + 225, y + 14.5);
    doc.text(toAsciiSafe(pdf.amountCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  if (statement.paymentHistory.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentW, 34, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noRowsMsg), marginX + contentW / 2, y + 21, { align: 'center' });
  } else {
    drawPayHeader();
    statement.paymentHistory.forEach((pay, idx) => {
      const noteText = toAsciiSafe(pay.note || '-');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      const wrapped = doc.splitTextToSize(noteText, 195) as string[];
      const rowH = Math.max(22, wrapped.length * 10.5 + 10);
      if (ensureSpace(rowH)) drawPayHeader();

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, rowH, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + rowH, marginX + contentW, y + rowH);

      doc.setTextColor(71, 85, 105);
      doc.text(pay.paymentDate, marginX + 8, y + 14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`#${pay.cycleNumber}`, marginX + 84, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(toAsciiSafe(t.paymentMethods[pay.paymentMethod]), marginX + 135, y + 14);
      wrapped.forEach((ln, li) => {
        doc.text(ln, marginX + 225, y + 14 + li * 10.5);
      });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87);
      doc.text(formatKametiCurrencyPKR(pay.amount), marginX + contentW - 8, y + 14, { align: 'right' });
      y += rowH;
    });
  }

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
    filename: getKametiMemberStatementFilename(statement),
    pageCount,
    mode: 'vector',
  };
}

function renderCanvasMemberStatementPdf(
  statement: KametiMemberStatementData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): PdfPreviewBundle {
  const pdf = t.reportsUI.pdf;
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

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textBaseline = 'alphabetic';
    pages.push(canvas);
    return { canvas, ctx };
  };

  let { ctx } = createPageCanvas();
  let y = 60;

  // Banner
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
  ctx.fillText(pdf.memberStatementTitle, primaryX, y + 58);

  ctx.fillStyle = '#A5F3FC';
  ctx.font = `500 18px ${fontFamily}`;
  ctx.fillText(pdf.subtitle, primaryX, y + 100);

  const turnLabel = statement.effectiveTurnNumber
    ? `${pdf.turnCol} #${statement.effectiveTurnNumber}`
    : t.metrics.noRecipientYet;
  ctx.font = `700 18px ${fontFamily}`;
  const badgeW = Math.max(200, ctx.measureText(turnLabel).width + 44);
  const badgeX = isRtl ? marginX + 30 : marginX + contentW - badgeW - 30;
  ctx.fillStyle = statement.drawRecord?.isCompleted ? '#10B981' : '#FACC15';
  drawRoundedRect(ctx, badgeX, y + 36, badgeW, 44, 12);
  ctx.fill();
  ctx.fillStyle = statement.drawRecord?.isCompleted ? '#FFFFFF' : '#040D21';
  ctx.textAlign = 'center';
  ctx.fillText(turnLabel, badgeX + badgeW / 2, y + 64);

  y += 184;

  // Info Card
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
  const phoneText = statement.member.phone ? ` (${statement.member.phone})` : '';
  ctx.fillText(
    `${pdf.memberLabel}: #${statement.member.memberNumber} ${statement.member.name}${phoneText}`,
    metaLeftX,
    y + 42
  );
  ctx.fillStyle = '#475569';
  ctx.font = `500 17px ${fontFamily}`;
  ctx.fillText(`${pdf.committeeLabel}: ${statement.committee.name}`, metaLeftX, y + 82);
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(
    `${pdf.generatedLabel}: ${formatDateTime(statement.generatedAt, language)}`,
    metaRightX,
    y + 82
  );

  y += 140;

  // 3 KPI cards
  const cardGap = 20;
  const cardW = (contentW - cardGap * 2) / 3;
  const cards = [
    {
      label: pdf.memberExpectedLabel,
      value: formatKametiCurrencyPKR(statement.totalExpected),
      sub: `${statement.installments.length} ${pdf.cycleCol}`,
      bg: '#F0F9FF',
      border: '#BAE6FD',
      valColor: '#0E7490',
    },
    {
      label: pdf.memberPaidLabel,
      value: formatKametiCurrencyPKR(statement.totalPaid),
      sub: `${statement.paidCount} ${t.installmentStatuses.paid} · ${statement.partialCount} ${t.installmentStatuses.partial}`,
      bg: '#ECFDF5',
      border: '#A7F3D0',
      valColor: '#047857',
    },
    {
      label: pdf.memberOutstandingLabel,
      value: formatKametiCurrencyPKR(statement.outstandingAmount),
      sub: `${statement.overdueCount} ${t.installmentStatuses.overdue}`,
      bg: statement.outstandingAmount <= 0 ? '#ECFDF5' : '#FFF7ED',
      border: statement.outstandingAmount <= 0 ? '#A7F3D0' : '#FED7AA',
      valColor: statement.outstandingAmount <= 0 ? '#047857' : '#C2410C',
    },
  ];

  cards.forEach((c, idx) => {
    const cx = isRtl
      ? marginX + (2 - idx) * (cardW + cardGap)
      : marginX + idx * (cardW + cardGap);
    ctx.fillStyle = c.bg;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, cx, y, cardW, 126, 16);
    ctx.fill();
    ctx.stroke();

    const tx = isRtl ? cx + cardW - 22 : cx + 22;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#475569';
    ctx.font = `700 17px ${fontFamily}`;
    ctx.fillText(c.label, tx, y + 36);

    ctx.fillStyle = c.valColor;
    ctx.font = `700 26px ${fontFamily}`;
    ctx.direction = 'ltr';
    ctx.fillText(c.value, tx, y + 74);
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    ctx.fillStyle = '#64748B';
    ctx.font = `500 15px ${fontFamily}`;
    ctx.fillText(c.sub, tx, y + 106);
  });

  y += 154;

  const ensureSpace = (needed: number) => {
    if (y + needed > footerTopY) {
      ({ ctx } = createPageCanvas());
      y = 70;
      return true;
    }
    return false;
  };

  // Installments Table
  ensureSpace(120);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.installmentsHeading} (${statement.installments.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 18;

  const c1X = isRtl ? marginX + contentW - 16 : marginX + 16;
  const c2X = isRtl ? marginX + contentW - 140 : marginX + 140;
  const c3X = isRtl ? marginX + contentW - 460 : marginX + 460;
  const c4X = isRtl ? marginX + contentW - 640 : marginX + 640;
  const c5X = isRtl ? marginX + contentW - 825 : marginX + 825;
  const c6X = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawInsHeader = () => {
    ctx.fillStyle = '#040D21';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(pdf.cycleCol, c1X, y + 28);
    ctx.fillText(pdf.dueDateCol, c2X, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.expectedCol, c3X, y + 28);
    ctx.fillText(pdf.paidCol, c4X, y + 28);
    ctx.fillText(pdf.remainingCol, c5X, y + 28);
    ctx.fillText(pdf.statusCol, c6X, y + 28);
    y += 44;
  };

  if (statement.installments.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, marginX, y, contentW, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noRowsMsg, marginX + contentW / 2, y + 42);
    y += 90;
  } else {
    drawInsHeader();
    statement.installments.forEach((v, idx) => {
      if (ensureSpace(44)) drawInsHeader();
      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, 44);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + 44);
      ctx.lineTo(marginX + contentW, y + 44);
      ctx.stroke();

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(`#${v.installment.cycleNumber}`, c1X, y + 28);

      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(v.installment.dueDate, c2X, y + 28);

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatKametiCurrencyPKR(v.installment.expectedAmount), c3X, y + 28);
      ctx.fillStyle = '#047857';
      ctx.fillText(formatKametiCurrencyPKR(v.paidAmount), c4X, y + 28);
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatKametiCurrencyPKR(v.remainingAmount), c5X, y + 28);
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle =
        v.status === 'paid'
          ? '#047857'
          : v.status === 'overdue'
            ? '#BE123C'
            : v.status === 'partial'
              ? '#B45309'
              : '#475569';
      ctx.fillText(t.installmentStatuses[v.status], c6X, y + 28);
      y += 44;
    });
    y += 34;
  }

  // Payment History
  ensureSpace(120);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.paymentHistoryHeading} (${statement.paymentHistory.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 18;

  const p1X = isRtl ? marginX + contentW - 16 : marginX + 16;
  const p2X = isRtl ? marginX + contentW - 180 : marginX + 180;
  const p3X = isRtl ? marginX + contentW - 285 : marginX + 285;
  const p4X = isRtl ? marginX + contentW - 470 : marginX + 470;
  const p5X = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawPayHeader = () => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(pdf.dateCol, p1X, y + 28);
    ctx.fillText(pdf.cycleCol, p2X, y + 28);
    ctx.fillText(pdf.methodCol, p3X, y + 28);
    ctx.fillText(pdf.noteCol, p4X, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.amountCol, p5X, y + 28);
    y += 44;
  };

  if (statement.paymentHistory.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, marginX, y, contentW, 70, 12);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noRowsMsg, marginX + contentW / 2, y + 42);
  } else {
    drawPayHeader();
    statement.paymentHistory.forEach((pay, idx) => {
      ctx.font = `500 16px ${fontFamily}`;
      const lines = wrapCanvasText(ctx, pay.note || '-', 360);
      const rowH = Math.max(44, lines.length * 24 + 20);
      if (ensureSpace(rowH)) drawPayHeader();

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

      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillStyle = '#475569';
      ctx.fillText(pay.paymentDate, p1X, y + 28);
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`#${pay.cycleNumber}`, p2X, y + 28);
      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillText(t.paymentMethods[pay.paymentMethod], p3X, y + 28);
      lines.forEach((ln, li) => {
        ctx.fillText(ln, p4X, y + 28 + li * 24);
      });

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#047857';
      ctx.fillText(formatKametiCurrencyPKR(pay.amount), p5X, y + 28);
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
    doc.addImage(dataUrl, 'PNG', 0, 0, A4_PT_WIDTH, A4_PT_HEIGHT, undefined, 'FAST');
  });

  return {
    pdf: {
      blob: doc.output('blob'),
      filename: getKametiMemberStatementFilename(statement),
      pageCount: totalPages,
      mode: 'canvas',
    },
    pageImages,
  };
}

export function createKametiMemberStatementPreviewBundle(
  statement: KametiMemberStatementData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): PdfPreviewBundle {
  const canUseCanvas =
    typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined';
  const needsUnicodeCanvas =
    language === 'ur' || memberStatementHasNonLatin1(statement);

  if (canUseCanvas) {
    try {
      const canvasBundle = renderCanvasMemberStatementPdf(statement, t, language);
      if (!needsUnicodeCanvas) {
        return {
          pdf: renderVectorMemberStatementPdf(statement, t, language),
          pageImages: canvasBundle.pageImages,
        };
      }
      return canvasBundle;
    } catch {
      // Fallback to vector
    }
  }

  return {
    pdf: renderVectorMemberStatementPdf(statement, t, language),
    pageImages: [],
  };
}

function renderVectorCommitteeReportPdf(
  report: KametiCommitteeReportData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): GeneratedPdfResult {
  const pdf = t.reportsUI.pdf;
  const d = report.dashboard;
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

  // Header
  doc.setFillColor(4, 13, 33);
  doc.roundedRect(marginX, y, contentW, 78, 10, 10, 'F');
  doc.setFillColor(6, 182, 212);
  doc.rect(marginX, y + 70, contentW * 0.72, 8, 'F');
  doc.setFillColor(250, 204, 21);
  doc.rect(marginX + contentW * 0.72, y + 70, contentW * 0.28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(toAsciiSafe(pdf.committeeReportTitle), marginX + 16, y + 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(165, 243, 252);
  doc.text(toAsciiSafe(report.committee.name), marginX + 16, y + 46);

  const statusText = toAsciiSafe(t.statuses[report.committee.status]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  const badgeW = Math.max(88, doc.getTextWidth(statusText) + 22);
  doc.setFillColor(report.committee.status === 'active' ? 6 : 16, report.committee.status === 'active' ? 182 : 185, report.committee.status === 'active' ? 212 : 129);
  doc.setTextColor(report.committee.status === 'active' ? 4 : 255, report.committee.status === 'active' ? 13 : 255, report.committee.status === 'active' ? 33 : 255);
  doc.roundedRect(marginX + contentW - badgeW - 14, y + 18, badgeW, 22, 6, 6, 'F');
  doc.text(statusText, marginX + contentW - badgeW / 2 - 14, y + 32.5, { align: 'center' });

  y += 90;

  // Committee Meta Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentW, 56, 7, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${toAsciiSafe(pdf.startDateLabel)}: ${report.committee.startDate}  |  ${toAsciiSafe(pdf.durationLabel)}: ${report.committee.durationMonths}m  |  ${toAsciiSafe(pdf.collectionDayLabel)}: Day ${report.committee.collectionDay}`,
    marginX + 12,
    y + 20
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${toAsciiSafe(pdf.frequencyLabel)}: ${toAsciiSafe(t.frequencies[report.committee.paymentFrequency])}  |  ${toAsciiSafe(t.metrics.totalMembers)}: ${d.currentMembersCount}/${d.targetMemberCount}`,
    marginX + 12,
    y + 40
  );
  doc.text(
    `${toAsciiSafe(pdf.generatedLabel)}: ${toAsciiSafe(formatDateTime(report.generatedAt, language))}`,
    marginX + contentW - 12,
    y + 40,
    { align: 'right' }
  );

  y += 70;

  // 4 Dashboard Summary Boxes
  const gap = 8;
  const kpiW = (contentW - gap * 3) / 4;
  const kpis = [
    {
      label: toAsciiSafe(pdf.expectedMonthlyLabel),
      value: formatKametiCurrencyPKR(d.expectedMonthlyCollection),
      sub: `${formatKametiCurrencyPKR(d.monthlyInstallment)} / mem`,
    },
    {
      label: toAsciiSafe(pdf.expectedTotalLabel),
      value: formatKametiCurrencyPKR(d.expectedTotalCollection),
      sub: `${d.totalInstallmentsCount} schedules`,
    },
    {
      label: toAsciiSafe(pdf.collectedLabel),
      value: formatKametiCurrencyPKR(d.totalCollected),
      sub: `${d.collectionProgressPercent}% collected`,
    },
    {
      label: toAsciiSafe(pdf.remainingLabel),
      value: formatKametiCurrencyPKR(d.remainingCollection),
      sub: `Overdue: ${d.overdueInstallmentsCount}`,
    },
  ];
  kpis.forEach((k, idx) => {
    const kx = marginX + idx * (kpiW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(kx, y, kpiW, 56, 7, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(71, 85, 105);
    doc.text(k.label, kx + 8, y + 15);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, kx + 8, y + 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(100, 116, 139);
    doc.text(k.sub, kx + 8, y + 48);
  });

  y += 72;

  const ensureSpace = (needed: number) => {
    if (y + needed > footerReserveY) {
      doc.addPage();
      y = 34;
      return true;
    }
    return false;
  };

  // Section 1: Members Summary
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.membersHeading)} (${report.memberSummaries.length})`, marginX, y);
  y += 10;

  const drawMembersHeader = () => {
    doc.setFillColor(4, 13, 33);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text('#', marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.memberCol), marginX + 34, y + 14.5);
    doc.text(toAsciiSafe(pdf.turnCol), marginX + 230, y + 14.5);
    doc.text(toAsciiSafe(pdf.expectedCol), marginX + 340, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.paidCol), marginX + 432, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.remainingCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  if (report.memberSummaries.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentW, 32, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noRowsMsg), marginX + contentW / 2, y + 20, { align: 'center' });
    y += 42;
  } else {
    drawMembersHeader();
    report.memberSummaries.forEach((ms, idx) => {
      if (ensureSpace(22)) drawMembersHeader();
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, 22, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 22, marginX + contentW, y + 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`${ms.member.memberNumber}`, marginX + 8, y + 14.5);
      doc.text(toAsciiSafe(ms.member.name), marginX + 34, y + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(ms.effectiveTurnNumber ? `Turn #${ms.effectiveTurnNumber}` : '-', marginX + 230, y + 14.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formatKametiCurrencyPKR(ms.totalExpected), marginX + 340, y + 14.5, { align: 'right' });
      doc.setTextColor(4, 120, 87);
      doc.text(formatKametiCurrencyPKR(ms.totalPaid), marginX + 432, y + 14.5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatKametiCurrencyPKR(ms.outstandingAmount), marginX + contentW - 8, y + 14.5, { align: 'right' });
      y += 22;
    });
    y += 18;
  }

  // Section 2: Monthly / Cycle Collection Summary
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.monthlySummaryHeading)} (${report.monthlySummaries.length})`, marginX, y);
  y += 10;

  const drawCyclesHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.cycleCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.dueDateCol), marginX + 60, y + 14.5);
    doc.text(toAsciiSafe(pdf.winnerCol), marginX + 145, y + 14.5);
    doc.text(toAsciiSafe(pdf.expectedCol), marginX + 340, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.collectedLabel), marginX + 432, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.remainingCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  drawCyclesHeader();
  report.monthlySummaries.forEach((cyc, idx) => {
    if (ensureSpace(22)) drawCyclesHeader();
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y, contentW, 22, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, y + 22, marginX + contentW, y + 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`#${cyc.cycleNumber}`, marginX + 8, y + 14.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(cyc.dueDate, marginX + 60, y + 14.5);
    doc.text(toAsciiSafe(cyc.drawWinnerName || '-'), marginX + 145, y + 14.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatKametiCurrencyPKR(cyc.expectedAmount), marginX + 340, y + 14.5, { align: 'right' });
    doc.setTextColor(4, 120, 87);
    doc.text(formatKametiCurrencyPKR(cyc.collectedAmount), marginX + 432, y + 14.5, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(formatKametiCurrencyPKR(cyc.remainingAmount), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  });
  y += 18;

  // Section 3: Draw History
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.drawsHeading)} (${report.draws.length})`, marginX, y);
  y += 10;

  const drawDrawsHeader = () => {
    doc.setFillColor(4, 13, 33);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.turnCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.winnerCol), marginX + 64, y + 14.5);
    doc.text(toAsciiSafe(pdf.dateCol), marginX + 245, y + 14.5);
    doc.text(toAsciiSafe(pdf.payoutCol), marginX + 415, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.statusCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  if (report.draws.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentW, 32, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noRowsMsg), marginX + contentW / 2, y + 20, { align: 'center' });
    y += 42;
  } else {
    drawDrawsHeader();
    report.draws.forEach((dr, idx) => {
      if (ensureSpace(22)) drawDrawsHeader();
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, 22, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 22, marginX + contentW, y + 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${dr.turnNumber}`, marginX + 8, y + 14.5);
      doc.text(toAsciiSafe(dr.memberName), marginX + 64, y + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(dr.payoutDate, marginX + 245, y + 14.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formatKametiCurrencyPKR(dr.payoutAmount), marginX + 415, y + 14.5, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(dr.isCompleted ? 4 : 180, dr.isCompleted ? 120 : 83, dr.isCompleted ? 87 : 9);
      doc.text(
        toAsciiSafe(dr.isCompleted ? t.drawsUI.completedBadge : t.drawsUI.scheduledBadge),
        marginX + contentW - 8,
        y + 14.5,
        { align: 'right' }
      );
      y += 22;
    });
    y += 18;
  }

  // Section 4: Outstanding Installments (top 40 rows max so report stays tidy)
  ensureSpace(64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${toAsciiSafe(pdf.outstandingHeading)} (${report.outstandingInstallments.length})`, marginX, y);
  y += 10;

  const drawOutHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);
    doc.text(toAsciiSafe(pdf.cycleCol), marginX + 8, y + 14.5);
    doc.text(toAsciiSafe(pdf.dueDateCol), marginX + 58, y + 14.5);
    doc.text(toAsciiSafe(pdf.memberCol), marginX + 145, y + 14.5);
    doc.text(toAsciiSafe(pdf.remainingCol), marginX + 415, y + 14.5, { align: 'right' });
    doc.text(toAsciiSafe(pdf.statusCol), marginX + contentW - 8, y + 14.5, { align: 'right' });
    y += 22;
  };

  if (report.outstandingInstallments.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentW, 32, 6, 6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(100, 116, 139);
    doc.text(toAsciiSafe(pdf.noRowsMsg), marginX + contentW / 2, y + 20, { align: 'center' });
  } else {
    drawOutHeader();
    report.outstandingInstallments.forEach((item, idx) => {
      if (ensureSpace(22)) drawOutHeader();
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, contentW, 22, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 22, marginX + contentW, y + 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${item.installment.cycleNumber}`, marginX + 8, y + 14.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.installment.dueDate, marginX + 58, y + 14.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${item.memberNumber} ${toAsciiSafe(item.memberName)}`, marginX + 145, y + 14.5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatKametiCurrencyPKR(item.remainingAmount), marginX + 415, y + 14.5, { align: 'right' });
      doc.setTextColor(item.status === 'overdue' ? 190 : 180, item.status === 'overdue' ? 18 : 83, item.status === 'overdue' ? 60 : 9);
      doc.text(
        toAsciiSafe(t.installmentStatuses[item.status]),
        marginX + contentW - 8,
        y + 14.5,
        { align: 'right' }
      );
      y += 22;
    });
  }

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
    filename: getKametiCommitteeReportFilename(report),
    pageCount,
    mode: 'vector',
  };
}

function renderCanvasCommitteeReportPdf(
  report: KametiCommitteeReportData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): PdfPreviewBundle {
  const pdf = t.reportsUI.pdf;
  const d = report.dashboard;
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

  const createPageCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textBaseline = 'alphabetic';
    pages.push(canvas);
    return { canvas, ctx };
  };

  let { ctx } = createPageCanvas();
  let y = 60;

  // Header
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
  ctx.fillText(pdf.committeeReportTitle, primaryX, y + 58);

  ctx.fillStyle = '#A5F3FC';
  ctx.font = `500 20px ${fontFamily}`;
  ctx.fillText(report.committee.name, primaryX, y + 102);

  const badgeText = t.statuses[report.committee.status];
  ctx.font = `700 18px ${fontFamily}`;
  const badgeW = Math.max(180, ctx.measureText(badgeText).width + 44);
  const badgeX = isRtl ? marginX + 30 : marginX + contentW - badgeW - 30;
  ctx.fillStyle = report.committee.status === 'active' ? '#06B6D4' : '#10B981';
  drawRoundedRect(ctx, badgeX, y + 36, badgeW, 44, 12);
  ctx.fill();
  ctx.fillStyle = report.committee.status === 'active' ? '#040D21' : '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, y + 64);

  y += 180;

  // Metadata Box
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, marginX, y, contentW, 110, 14);
  ctx.fill();
  ctx.stroke();

  const ml = isRtl ? marginX + contentW - 24 : marginX + 24;
  const mr = isRtl ? marginX + 24 : marginX + contentW - 24;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 18px ${fontFamily}`;
  ctx.fillText(
    `${pdf.startDateLabel}: ${report.committee.startDate}  ·  ${pdf.durationLabel}: ${report.committee.durationMonths}  ·  ${pdf.collectionDayLabel}: ${report.committee.collectionDay}`,
    ml,
    y + 42
  );
  ctx.fillStyle = '#475569';
  ctx.font = `500 16px ${fontFamily}`;
  ctx.fillText(
    `${pdf.frequencyLabel}: ${t.frequencies[report.committee.paymentFrequency]}  ·  ${t.metrics.totalMembers}: ${d.currentMembersCount}/${d.targetMemberCount}`,
    ml,
    y + 80
  );
  ctx.textAlign = isRtl ? 'left' : 'right';
  ctx.fillText(
    `${pdf.generatedLabel}: ${formatDateTime(report.generatedAt, language)}`,
    mr,
    y + 80
  );

  y += 136;

  // 4 KPI Cards
  const kGap = 16;
  const kW = (contentW - kGap * 3) / 4;
  const kpis = [
    {
      label: pdf.expectedMonthlyLabel,
      value: formatKametiCurrencyPKR(d.expectedMonthlyCollection),
      sub: formatKametiCurrencyPKR(d.monthlyInstallment),
    },
    {
      label: pdf.expectedTotalLabel,
      value: formatKametiCurrencyPKR(d.expectedTotalCollection),
      sub: `${d.totalInstallmentsCount} ${pdf.cycleCol}`,
    },
    {
      label: pdf.collectedLabel,
      value: formatKametiCurrencyPKR(d.totalCollected),
      sub: `${d.collectionProgressPercent}%`,
    },
    {
      label: pdf.remainingLabel,
      value: formatKametiCurrencyPKR(d.remainingCollection),
      sub: `${t.installmentStatuses.overdue}: ${d.overdueInstallmentsCount}`,
    },
  ];
  kpis.forEach((k, idx) => {
    const kx = isRtl ? marginX + (3 - idx) * (kW + kGap) : marginX + idx * (kW + kGap);
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, kx, y, kW, 116, 14);
    ctx.fill();
    ctx.stroke();

    const tx = isRtl ? kx + kW - 18 : kx + 18;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#475569';
    ctx.font = `700 15px ${fontFamily}`;
    ctx.fillText(k.label, tx, y + 32);

    ctx.fillStyle = '#0F172A';
    ctx.font = `700 22px ${fontFamily}`;
    ctx.direction = 'ltr';
    ctx.fillText(k.value, tx, y + 68);
    ctx.direction = isRtl ? 'rtl' : 'ltr';

    ctx.fillStyle = '#64748B';
    ctx.font = `500 14px ${fontFamily}`;
    ctx.fillText(k.sub, tx, y + 98);
  });

  y += 144;

  const ensureSpace = (needed: number) => {
    if (y + needed > footerTopY) {
      ({ ctx } = createPageCanvas());
      y = 70;
      return true;
    }
    return false;
  };

  // Section 1: Members Summary
  ensureSpace(120);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.membersHeading} (${report.memberSummaries.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 16;

  const m1 = isRtl ? marginX + contentW - 16 : marginX + 16;
  const m2 = isRtl ? marginX + contentW - 72 : marginX + 72;
  const m3 = isRtl ? marginX + contentW - 440 : marginX + 440;
  const m4 = isRtl ? marginX + contentW - 670 : marginX + 670;
  const m5 = isRtl ? marginX + contentW - 860 : marginX + 860;
  const m6 = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawMHeader = () => {
    ctx.fillStyle = '#040D21';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText('#', m1, y + 28);
    ctx.fillText(pdf.memberCol, m2, y + 28);
    ctx.fillText(pdf.turnCol, m3, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.expectedCol, m4, y + 28);
    ctx.fillText(pdf.paidCol, m5, y + 28);
    ctx.fillText(pdf.remainingCol, m6, y + 28);
    y += 44;
  };

  if (report.memberSummaries.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, marginX, y, contentW, 66, 12);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noRowsMsg, marginX + contentW / 2, y + 40);
    y += 84;
  } else {
    drawMHeader();
    report.memberSummaries.forEach((ms, idx) => {
      if (ensureSpace(44)) drawMHeader();
      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, 44);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + 44);
      ctx.lineTo(marginX + contentW, y + 44);
      ctx.stroke();

      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`${ms.member.memberNumber}`, m1, y + 28);
      ctx.fillText(ms.member.name, m2, y + 28);
      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(ms.effectiveTurnNumber ? `#${ms.effectiveTurnNumber}` : '-', m3, y + 28);

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatKametiCurrencyPKR(ms.totalExpected), m4, y + 28);
      ctx.fillStyle = '#047857';
      ctx.fillText(formatKametiCurrencyPKR(ms.totalPaid), m5, y + 28);
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatKametiCurrencyPKR(ms.outstandingAmount), m6, y + 28);
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      y += 44;
    });
    y += 32;
  }

  // Section 2: Cycles Summary
  ensureSpace(120);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.monthlySummaryHeading} (${report.monthlySummaries.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 16;

  const cy1 = isRtl ? marginX + contentW - 16 : marginX + 16;
  const cy2 = isRtl ? marginX + contentW - 110 : marginX + 110;
  const cy3 = isRtl ? marginX + contentW - 290 : marginX + 290;
  const cy4 = isRtl ? marginX + contentW - 670 : marginX + 670;
  const cy5 = isRtl ? marginX + contentW - 860 : marginX + 860;
  const cy6 = isRtl ? marginX + 16 : marginX + contentW - 16;

  const drawCHeader = () => {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(marginX, y, contentW, 44);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(pdf.cycleCol, cy1, y + 28);
    ctx.fillText(pdf.dueDateCol, cy2, y + 28);
    ctx.fillText(pdf.winnerCol, cy3, y + 28);
    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.fillText(pdf.expectedCol, cy4, y + 28);
    ctx.fillText(pdf.collectedLabel, cy5, y + 28);
    ctx.fillText(pdf.remainingCol, cy6, y + 28);
    y += 44;
  };

  drawCHeader();
  report.monthlySummaries.forEach((cyc, idx) => {
    if (ensureSpace(44)) drawCHeader();
    if (idx % 2 === 1) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(marginX, y, contentW, 44);
    }
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginX, y + 44);
    ctx.lineTo(marginX + contentW, y + 44);
    ctx.stroke();

    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.font = `700 16px ${fontFamily}`;
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`#${cyc.cycleNumber}`, cy1, y + 28);
    ctx.font = `500 16px ${fontFamily}`;
    ctx.fillStyle = '#475569';
    ctx.fillText(cyc.dueDate, cy2, y + 28);
    ctx.fillText(cyc.drawWinnerName || '-', cy3, y + 28);

    ctx.textAlign = isRtl ? 'left' : 'right';
    ctx.direction = 'ltr';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatKametiCurrencyPKR(cyc.expectedAmount), cy4, y + 28);
    ctx.fillStyle = '#047857';
    ctx.fillText(formatKametiCurrencyPKR(cyc.collectedAmount), cy5, y + 28);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatKametiCurrencyPKR(cyc.remainingAmount), cy6, y + 28);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    y += 44;
  });
  y += 32;

  // Section 3: Draw History
  ensureSpace(120);
  ctx.fillStyle = '#0F172A';
  ctx.font = `700 22px ${fontFamily}`;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillText(
    `${pdf.drawsHeading} (${report.draws.length})`,
    isRtl ? marginX + contentW : marginX,
    y
  );
  y += 16;

  if (report.draws.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, marginX, y, contentW, 66, 12);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.font = `500 18px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(pdf.noRowsMsg, marginX + contentW / 2, y + 40);
    y += 84;
  } else {
    const dr1 = isRtl ? marginX + contentW - 16 : marginX + 16;
    const dr2 = isRtl ? marginX + contentW - 125 : marginX + 125;
    const dr3 = isRtl ? marginX + contentW - 490 : marginX + 490;
    const dr4 = isRtl ? marginX + contentW - 820 : marginX + 820;
    const dr5 = isRtl ? marginX + 16 : marginX + contentW - 16;

    const drawDrHeader = () => {
      ctx.fillStyle = '#040D21';
      ctx.fillRect(marginX, y, contentW, 44);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 16px ${fontFamily}`;
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.fillText(pdf.turnCol, dr1, y + 28);
      ctx.fillText(pdf.winnerCol, dr2, y + 28);
      ctx.fillText(pdf.dateCol, dr3, y + 28);
      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.fillText(pdf.payoutCol, dr4, y + 28);
      ctx.fillText(pdf.statusCol, dr5, y + 28);
      y += 44;
    };

    drawDrHeader();
    report.draws.forEach((dr, idx) => {
      if (ensureSpace(44)) drawDrHeader();
      if (idx % 2 === 1) {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(marginX, y, contentW, 44);
      }
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, y + 44);
      ctx.lineTo(marginX + contentW, y + 44);
      ctx.stroke();

      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`#${dr.turnNumber}`, dr1, y + 28);
      ctx.fillText(dr.memberName, dr2, y + 28);
      ctx.font = `500 16px ${fontFamily}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(dr.payoutDate, dr3, y + 28);

      ctx.textAlign = isRtl ? 'left' : 'right';
      ctx.direction = 'ltr';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatKametiCurrencyPKR(dr.payoutAmount), dr4, y + 28);
      ctx.direction = isRtl ? 'rtl' : 'ltr';

      ctx.font = `700 16px ${fontFamily}`;
      ctx.fillStyle = dr.isCompleted ? '#047857' : '#B45309';
      ctx.fillText(
        dr.isCompleted ? t.drawsUI.completedBadge : t.drawsUI.scheduledBadge,
        dr5,
        y + 28
      );
      y += 44;
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
    doc.addImage(dataUrl, 'PNG', 0, 0, A4_PT_WIDTH, A4_PT_HEIGHT, undefined, 'FAST');
  });

  return {
    pdf: {
      blob: doc.output('blob'),
      filename: getKametiCommitteeReportFilename(report),
      pageCount: totalPages,
      mode: 'canvas',
    },
    pageImages,
  };
}

export function createKametiCommitteeReportPreviewBundle(
  report: KametiCommitteeReportData,
  t: ToolTranslationBundle['kameti'],
  language: Language
): PdfPreviewBundle {
  const canUseCanvas =
    typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined';
  const needsUnicodeCanvas =
    language === 'ur' || committeeReportHasNonLatin1(report);

  if (canUseCanvas) {
    try {
      const canvasBundle = renderCanvasCommitteeReportPdf(report, t, language);
      if (!needsUnicodeCanvas) {
        return {
          pdf: renderVectorCommitteeReportPdf(report, t, language),
          pageImages: canvasBundle.pageImages,
        };
      }
      return canvasBundle;
    } catch {
      // Fallback to vector
    }
  }

  return {
    pdf: renderVectorCommitteeReportPdf(report, t, language),
    pageImages: [],
  };
}
