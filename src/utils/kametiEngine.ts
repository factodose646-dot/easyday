import { Language } from '../types';
import { isValidISODate } from './expenseReport';
import {
  generateId,
  getCurrentMonthISO,
  getTodayISO,
  KametiCommittee,
  KametiDataset,
  KametiDrawRecord,
  KametiInstallment,
  KametiInstallmentStatus,
  KametiMember,
  KametiPaymentFrequency,
  KametiPaymentMethod,
  KametiPaymentRecord,
  KametiStatus,
} from './storage';
import { buildWhatsAppUrl, roundCurrency } from './udhaarEngine';

export interface KametiCommitteeInput {
  name: string;
  monthlyInstallment: number;
  memberCount: number;
  startDate: string;
  durationMonths: number;
  paymentFrequency: KametiPaymentFrequency;
  collectionDay: number;
  description?: string;
  status?: KametiStatus;
}

export interface KametiMemberInput {
  name: string;
  phone?: string;
  address?: string;
  memberNumber: number;
  joiningDate: string;
  assignedTurnNumber?: number;
}

export interface KametiInstallmentView {
  installment: KametiInstallment;
  payments: KametiPaymentRecord[];
  paidAmount: number;
  remainingAmount: number;
  status: KametiInstallmentStatus;
  isPartiallyPaid: boolean;
  latestPaymentDate?: string;
  latestPaymentMethod?: KametiPaymentMethod;
  latestNote?: string;
}

export interface KametiMemberSummary {
  member: KametiMember;
  totalExpected: number;
  totalPaid: number;
  outstandingAmount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalInstallmentsCount: number;
  drawRecord: KametiDrawRecord | null;
  effectiveTurnNumber: number | null;
  nextDueInstallment: KametiInstallmentView | null;
}

export interface KametiDashboardMetrics {
  committee: KametiCommittee;
  currentMembersCount: number;
  targetMemberCount: number;
  monthlyInstallment: number;
  expectedMonthlyCollection: number;
  expectedTotalCollection: number;
  enrolledExpectedTotal: number;
  totalCollected: number;
  remainingCollection: number;
  scheduledRemainingCollection: number;
  collectionProgressPercent: number;
  paidInstallmentsCount: number;
  partialInstallmentsCount: number;
  unpaidInstallmentsCount: number;
  overdueInstallmentsCount: number;
  totalInstallmentsCount: number;
  completedDrawsCount: number;
  currentCycleNumber: number;
  currentRecipientMember: KametiMember | null;
  currentRecipientDraw: KametiDrawRecord | null;
}

export interface KametiMemberStatementData {
  committee: KametiCommittee;
  member: KametiMember;
  generatedAt: Date;
  totalExpected: number;
  totalPaid: number;
  outstandingAmount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
  drawRecord: KametiDrawRecord | null;
  effectiveTurnNumber: number | null;
  installments: KametiInstallmentView[];
  paymentHistory: Array<
    KametiPaymentRecord & {
      cycleNumber: number;
      dueDate: string;
    }
  >;
}

export interface KametiCycleCollectionSummary {
  cycleNumber: number;
  cycleMonthISO: string;
  dueDate: string;
  expectedAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  paidMembersCount: number;
  totalMembersCount: number;
  drawWinnerName: string | null;
  drawTurnNumber: number | null;
  drawCompleted: boolean;
}

export interface KametiCommitteeReportData {
  committee: KametiCommittee;
  generatedAt: Date;
  dashboard: KametiDashboardMetrics;
  memberSummaries: KametiMemberSummary[];
  monthlySummaries: KametiCycleCollectionSummary[];
  draws: Array<
    KametiDrawRecord & {
      memberName: string;
      memberNumber: number;
      memberPhone: string;
    }
  >;
  outstandingInstallments: Array<
    KametiInstallmentView & {
      memberName: string;
      memberNumber: number;
      memberPhone: string;
    }
  >;
}

export type KametiEngineErrorCode =
  | 'INVALID_COMMITTEE_NAME'
  | 'INVALID_INSTALLMENT_AMOUNT'
  | 'INVALID_MEMBER_COUNT'
  | 'INVALID_DURATION'
  | 'INVALID_COLLECTION_DAY'
  | 'INVALID_DATE'
  | 'COMMITTEE_NOT_FOUND'
  | 'COMMITTEE_FULL'
  | 'INVALID_MEMBER_NAME'
  | 'INVALID_MEMBER_NUMBER'
  | 'INVALID_TURN_NUMBER'
  | 'DUPLICATE_MEMBER_NUMBER'
  | 'DUPLICATE_MEMBER_PHONE'
  | 'DUPLICATE_MEMBER_NAME'
  | 'DUPLICATE_TURN_NUMBER'
  | 'MEMBER_NOT_FOUND'
  | 'MEMBER_HAS_HISTORY'
  | 'INSTALLMENT_NOT_FOUND'
  | 'INVALID_PAYMENT_AMOUNT'
  | 'PAYMENT_EXCEEDS_REMAINING'
  | 'DUPLICATE_PAYMENT_SUBMISSION'
  | 'PAYMENT_NOT_FOUND'
  | 'DRAW_MEMBER_ALREADY_ASSIGNED'
  | 'DRAW_TURN_ALREADY_TAKEN'
  | 'NO_ELIGIBLE_MEMBERS'
  | 'INVALID_PAYOUT_AMOUNT'
  | 'DRAW_NOT_FOUND';

export interface KametiResult<T> {
  ok: boolean;
  data?: T;
  errorCode?: KametiEngineErrorCode;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonthUTC(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(
    dt.getUTCDate()
  )}`;
}

function buildMonthlyDueDate(
  startYear: number,
  startMonth1To12: number,
  monthOffset: number,
  collectionDay: number
): { dueDate: string; cycleMonthISO: string } {
  const dt = new Date(Date.UTC(startYear, startMonth1To12 - 1 + monthOffset, 1));
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const maxDay = daysInMonthUTC(y, m);
  const safeDay = Math.max(1, Math.min(collectionDay, maxDay));
  return {
    dueDate: `${y}-${pad2(m)}-${pad2(safeDay)}`,
    cycleMonthISO: `${y}-${pad2(m)}`,
  };
}

export function normalizePhoneComparable(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('92') && digits.length >= 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('0092') && digits.length >= 14) {
    return `0${digits.slice(4)}`;
  }
  return digits;
}

export function normalizeMemberName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function computeExpectedCollections(
  monthlyInstallment: number,
  memberCount: number,
  durationMonths: number
): {
  expectedMonthlyCollection: number;
  expectedTotalCollection: number;
} {
  const safeInstallment = Number.isFinite(monthlyInstallment) && monthlyInstallment > 0 ? monthlyInstallment : 0;
  const safeMembers = Number.isFinite(memberCount) && memberCount > 0 ? Math.floor(memberCount) : 0;
  const safeDuration = Number.isFinite(durationMonths) && durationMonths > 0 ? Math.floor(durationMonths) : 0;
  const expectedMonthlyCollection = roundCurrency(safeInstallment * safeMembers);
  const expectedTotalCollection = roundCurrency(
    expectedMonthlyCollection * safeDuration
  );
  return { expectedMonthlyCollection, expectedTotalCollection };
}

export function getCyclesPerMonth(frequency: KametiPaymentFrequency): number {
  if (frequency === 'weekly') return 4;
  if (frequency === 'biweekly') return 2;
  return 1;
}

export function generateCycleSpecsForCommittee(
  committee: Pick<
    KametiCommittee,
    'startDate' | 'durationMonths' | 'paymentFrequency' | 'collectionDay' | 'monthlyInstallment'
  >
): Array<{
  cycleNumber: number;
  cycleMonthISO: string;
  dueDate: string;
  expectedAmount: number;
}> {
  const safeStart = isValidISODate(committee.startDate)
    ? committee.startDate
    : getTodayISO();
  const [startY, startM] = safeStart.split('-').map(Number);
  const safeDay = Math.max(1, Math.min(31, Math.floor(committee.collectionDay || 1)));
  const duration = Math.max(1, Math.floor(committee.durationMonths));
  const cyclesPerMonth = getCyclesPerMonth(committee.paymentFrequency);
  const totalCycles = duration * cyclesPerMonth;
  const totalPerMember = roundCurrency(committee.monthlyInstallment * duration);

  const specs: Array<{
    cycleNumber: number;
    cycleMonthISO: string;
    dueDate: string;
    expectedAmount: number;
  }> = [];

  const firstMonthly = buildMonthlyDueDate(startY, startM, 0, safeDay);

  if (committee.paymentFrequency === 'monthly') {
    for (let i = 0; i < totalCycles; i++) {
      const mDate = buildMonthlyDueDate(startY, startM, i, safeDay);
      specs.push({
        cycleNumber: i + 1,
        cycleMonthISO: mDate.cycleMonthISO,
        dueDate: mDate.dueDate,
        expectedAmount: roundCurrency(committee.monthlyInstallment),
      });
    }
    return specs;
  }

  const stepDays = committee.paymentFrequency === 'biweekly' ? 14 : 7;
  const basePerCycle = roundCurrency(totalPerMember / totalCycles);
  let accumulated = 0;

  for (let i = 0; i < totalCycles; i++) {
    const dueDate = addDaysISO(firstMonthly.dueDate, i * stepDays);
    const isLast = i === totalCycles - 1;
    const expectedAmount = isLast
      ? Math.max(1, roundCurrency(totalPerMember - accumulated))
      : basePerCycle;
    accumulated = roundCurrency(accumulated + expectedAmount);
    specs.push({
      cycleNumber: i + 1,
      cycleMonthISO: dueDate.slice(0, 7),
      dueDate,
      expectedAmount,
    });
  }

  return specs;
}

export function validateCommitteeInput(
  input: KametiCommitteeInput
): KametiEngineErrorCode | null {
  if (!input.name || !input.name.trim()) return 'INVALID_COMMITTEE_NAME';
  if (!Number.isFinite(input.monthlyInstallment) || input.monthlyInstallment <= 0) {
    return 'INVALID_INSTALLMENT_AMOUNT';
  }
  if (
    !Number.isFinite(input.memberCount) ||
    !Number.isInteger(input.memberCount) ||
    input.memberCount < 2
  ) {
    return 'INVALID_MEMBER_COUNT';
  }
  if (
    !Number.isFinite(input.durationMonths) ||
    !Number.isInteger(input.durationMonths) ||
    input.durationMonths < 1
  ) {
    return 'INVALID_DURATION';
  }
  if (
    !Number.isFinite(input.collectionDay) ||
    !Number.isInteger(input.collectionDay) ||
    input.collectionDay < 1 ||
    input.collectionDay > 31
  ) {
    return 'INVALID_COLLECTION_DAY';
  }
  if (!isValidISODate(input.startDate)) {
    return 'INVALID_DATE';
  }
  return null;
}

export function createKametiCommittee(
  dataset: KametiDataset,
  input: KametiCommitteeInput
): KametiResult<{ dataset: KametiDataset; committee: KametiCommittee }> {
  const err = validateCommitteeInput(input);
  if (err) return { ok: false, errorCode: err };

  const now = Date.now();
  const committee: KametiCommittee = {
    id: generateId('kmt'),
    name: input.name.trim(),
    monthlyInstallment: roundCurrency(input.monthlyInstallment),
    memberCount: Math.floor(input.memberCount),
    startDate: input.startDate,
    durationMonths: Math.floor(input.durationMonths),
    paymentFrequency: input.paymentFrequency,
    collectionDay: Math.floor(input.collectionDay),
    description: (input.description || '').trim(),
    status: input.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    data: {
      committee,
      dataset: {
        ...dataset,
        committees: [committee, ...dataset.committees],
      },
    },
  };
}

export function updateKametiCommittee(
  dataset: KametiDataset,
  committeeId: string,
  input: KametiCommitteeInput
): KametiResult<{ dataset: KametiDataset; committee: KametiCommittee }> {
  const existing = dataset.committees.find((c) => c.id === committeeId);
  if (!existing) return { ok: false, errorCode: 'COMMITTEE_NOT_FOUND' };

  const err = validateCommitteeInput(input);
  if (err) return { ok: false, errorCode: err };

  const currentMembers = dataset.members.filter((m) => m.committeeId === committeeId);
  if (Math.floor(input.memberCount) < currentMembers.length) {
    return { ok: false, errorCode: 'INVALID_MEMBER_COUNT' };
  }

  const now = Date.now();
  const updated: KametiCommittee = {
    ...existing,
    name: input.name.trim(),
    monthlyInstallment: roundCurrency(input.monthlyInstallment),
    memberCount: Math.floor(input.memberCount),
    startDate: input.startDate,
    durationMonths: Math.floor(input.durationMonths),
    paymentFrequency: input.paymentFrequency,
    collectionDay: Math.floor(input.collectionDay),
    description: (input.description || '').trim(),
    status: input.status || existing.status,
    updatedAt: now,
  };

  // Reconcile installment schedules safely without discarding any installments that already have payments
  const paymentCountByInstallment = new Map<string, number>();
  for (const p of dataset.payments) {
    if (p.committeeId === committeeId) {
      paymentCountByInstallment.set(
        p.installmentId,
        (paymentCountByInstallment.get(p.installmentId) || 0) + 1
      );
    }
  }

  const specs = generateCycleSpecsForCommittee(updated);
  const specByCycle = new Map(specs.map((s) => [s.cycleNumber, s]));
  const maxCycle = specs.length;

  const otherInstallments = dataset.installments.filter(
    (ins) => ins.committeeId !== committeeId
  );
  const committeeInstallments = dataset.installments.filter(
    (ins) => ins.committeeId === committeeId
  );
  const reconciledCommitteeInstallments: KametiInstallment[] = [];

  for (const member of currentMembers) {
    const memberExisting = committeeInstallments.filter(
      (ins) => ins.memberId === member.id
    );
    const existingByCycle = new Map(memberExisting.map((ins) => [ins.cycleNumber, ins]));

    // Preserve any installment beyond new duration ONLY if it already has recorded payments
    for (const ins of memberExisting) {
      if (ins.cycleNumber > maxCycle && (paymentCountByInstallment.get(ins.id) || 0) > 0) {
        reconciledCommitteeInstallments.push(ins);
      }
    }

    for (const spec of specs) {
      const prev = existingByCycle.get(spec.cycleNumber);
      if (prev) {
        const hasPayments = (paymentCountByInstallment.get(prev.id) || 0) > 0;
        const paidSum = hasPayments
          ? roundCurrency(
              dataset.payments
                .filter((p) => p.installmentId === prev.id)
                .reduce((s, p) => s + p.amount, 0)
            )
          : 0;
        const wasAlreadyPaid =
          hasPayments && paidSum >= prev.expectedAmount - 0.009;

        if (wasAlreadyPaid) {
          reconciledCommitteeInstallments.push(prev);
        } else {
          reconciledCommitteeInstallments.push({
            ...prev,
            cycleMonthISO: spec.cycleMonthISO,
            dueDate: spec.dueDate,
            expectedAmount: hasPayments
              ? Math.max(paidSum, spec.expectedAmount)
              : spec.expectedAmount,
            updatedAt: now,
          });
        }
      } else {
        reconciledCommitteeInstallments.push({
          id: generateId('kins'),
          committeeId,
          memberId: member.id,
          cycleNumber: spec.cycleNumber,
          cycleMonthISO: spec.cycleMonthISO,
          dueDate: spec.dueDate,
          expectedAmount: spec.expectedAmount,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  // Filter unused spec reference check (keeps TS happy)
  void specByCycle;

  return {
    ok: true,
    data: {
      committee: updated,
      dataset: {
        ...dataset,
        committees: dataset.committees.map((c) => (c.id === committeeId ? updated : c)),
        installments: [...otherInstallments, ...reconciledCommitteeInstallments],
      },
    },
  };
}

export function deleteKametiCommittee(
  dataset: KametiDataset,
  committeeId: string
): KametiResult<KametiDataset> {
  const exists = dataset.committees.some((c) => c.id === committeeId);
  if (!exists) return { ok: false, errorCode: 'COMMITTEE_NOT_FOUND' };
  return {
    ok: true,
    data: {
      committees: dataset.committees.filter((c) => c.id !== committeeId),
      members: dataset.members.filter((m) => m.committeeId !== committeeId),
      installments: dataset.installments.filter((ins) => ins.committeeId !== committeeId),
      payments: dataset.payments.filter((p) => p.committeeId !== committeeId),
      draws: dataset.draws.filter((d) => d.committeeId !== committeeId),
    },
  };
}

export function getNextAvailableMemberNumber(
  dataset: KametiDataset,
  committeeId: string
): number {
  const used = new Set(
    dataset.members
      .filter((m) => m.committeeId === committeeId)
      .map((m) => m.memberNumber)
  );
  let candidate = 1;
  while (used.has(candidate)) {
    candidate += 1;
  }
  return candidate;
}

function validateMemberInputAndDuplicates(
  dataset: KametiDataset,
  committee: KametiCommittee,
  input: KametiMemberInput,
  editingMemberId?: string
): KametiEngineErrorCode | null {
  if (!input.name || !input.name.trim()) return 'INVALID_MEMBER_NAME';
  if (
    !Number.isFinite(input.memberNumber) ||
    !Number.isInteger(input.memberNumber) ||
    input.memberNumber < 1
  ) {
    return 'INVALID_MEMBER_NUMBER';
  }
  if (!isValidISODate(input.joiningDate)) {
    return 'INVALID_DATE';
  }
  if (
    input.assignedTurnNumber !== undefined &&
    (!Number.isFinite(input.assignedTurnNumber) ||
      !Number.isInteger(input.assignedTurnNumber) ||
      input.assignedTurnNumber < 1)
  ) {
    return 'INVALID_TURN_NUMBER';
  }

  const siblings = dataset.members.filter(
    (m) => m.committeeId === committee.id && m.id !== editingMemberId
  );

  if (!editingMemberId && siblings.length >= committee.memberCount) {
    return 'COMMITTEE_FULL';
  }

  const normName = normalizeMemberName(input.name);
  const normPhone = normalizePhoneComparable(input.phone);

  for (const s of siblings) {
    if (s.memberNumber === Math.floor(input.memberNumber)) {
      return 'DUPLICATE_MEMBER_NUMBER';
    }
    if (
      input.assignedTurnNumber !== undefined &&
      s.assignedTurnNumber === Math.floor(input.assignedTurnNumber)
    ) {
      return 'DUPLICATE_TURN_NUMBER';
    }
    const siblingPhone = normalizePhoneComparable(s.phone);
    if (normPhone && siblingPhone && normPhone === siblingPhone) {
      return 'DUPLICATE_MEMBER_PHONE';
    }
    if (normalizeMemberName(s.name) === normName && (!normPhone || !siblingPhone || normPhone === siblingPhone)) {
      return 'DUPLICATE_MEMBER_NAME';
    }
  }

  return null;
}

export function addKametiMember(
  dataset: KametiDataset,
  committeeId: string,
  input: KametiMemberInput
): KametiResult<{
  dataset: KametiDataset;
  member: KametiMember;
  generatedInstallments: KametiInstallment[];
}> {
  const committee = dataset.committees.find((c) => c.id === committeeId);
  if (!committee) return { ok: false, errorCode: 'COMMITTEE_NOT_FOUND' };

  const err = validateMemberInputAndDuplicates(dataset, committee, input);
  if (err) return { ok: false, errorCode: err };

  const now = Date.now();
  const member: KametiMember = {
    id: generateId('kmem'),
    committeeId,
    name: input.name.trim(),
    phone: (input.phone || '').trim(),
    address: (input.address || '').trim() || undefined,
    memberNumber: Math.floor(input.memberNumber),
    joiningDate: input.joiningDate,
    assignedTurnNumber:
      input.assignedTurnNumber !== undefined
        ? Math.floor(input.assignedTurnNumber)
        : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const specs = generateCycleSpecsForCommittee(committee);
  const generatedInstallments: KametiInstallment[] = specs.map((spec) => ({
    id: generateId('kins'),
    committeeId,
    memberId: member.id,
    cycleNumber: spec.cycleNumber,
    cycleMonthISO: spec.cycleMonthISO,
    dueDate: spec.dueDate,
    expectedAmount: spec.expectedAmount,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    ok: true,
    data: {
      member,
      generatedInstallments,
      dataset: {
        ...dataset,
        members: [...dataset.members, member],
        installments: [...dataset.installments, ...generatedInstallments],
      },
    },
  };
}

export function updateKametiMember(
  dataset: KametiDataset,
  committeeId: string,
  memberId: string,
  input: KametiMemberInput
): KametiResult<{ dataset: KametiDataset; member: KametiMember }> {
  const committee = dataset.committees.find((c) => c.id === committeeId);
  if (!committee) return { ok: false, errorCode: 'COMMITTEE_NOT_FOUND' };

  const existing = dataset.members.find(
    (m) => m.id === memberId && m.committeeId === committeeId
  );
  if (!existing) return { ok: false, errorCode: 'MEMBER_NOT_FOUND' };

  const err = validateMemberInputAndDuplicates(dataset, committee, input, memberId);
  if (err) return { ok: false, errorCode: err };

  // Also ensure assignedTurnNumber does not conflict with another member's recorded Draw
  if (input.assignedTurnNumber !== undefined) {
    const conflictingDraw = dataset.draws.find(
      (d) =>
        d.committeeId === committeeId &&
        d.turnNumber === Math.floor(input.assignedTurnNumber!) &&
        d.memberId !== memberId
    );
    if (conflictingDraw) {
      return { ok: false, errorCode: 'DRAW_TURN_ALREADY_TAKEN' };
    }
  }

  const updated: KametiMember = {
    ...existing,
    name: input.name.trim(),
    phone: (input.phone || '').trim(),
    address: (input.address || '').trim() || undefined,
    memberNumber: Math.floor(input.memberNumber),
    joiningDate: input.joiningDate,
    assignedTurnNumber:
      input.assignedTurnNumber !== undefined
        ? Math.floor(input.assignedTurnNumber)
        : undefined,
    updatedAt: Date.now(),
  };

  return {
    ok: true,
    data: {
      member: updated,
      dataset: {
        ...dataset,
        members: dataset.members.map((m) => (m.id === memberId ? updated : m)),
      },
    },
  };
}

export function inspectMemberRemoval(
  dataset: KametiDataset,
  committeeId: string,
  memberId: string
): {
  paymentsCount: number;
  totalPaid: number;
  drawsCount: number;
  hasFinancialHistory: boolean;
} {
  const memberPayments = dataset.payments.filter(
    (p) => p.committeeId === committeeId && p.memberId === memberId
  );
  const memberDraws = dataset.draws.filter(
    (d) => d.committeeId === committeeId && d.memberId === memberId
  );
  const totalPaid = roundCurrency(
    memberPayments.reduce((s, p) => s + p.amount, 0)
  );
  return {
    paymentsCount: memberPayments.length,
    totalPaid,
    drawsCount: memberDraws.length,
    hasFinancialHistory: memberPayments.length > 0 || memberDraws.length > 0,
  };
}

export function removeKametiMember(
  dataset: KametiDataset,
  committeeId: string,
  memberId: string,
  options?: { allowCascadeWithHistory?: boolean }
): KametiResult<KametiDataset> {
  const exists = dataset.members.some(
    (m) => m.id === memberId && m.committeeId === committeeId
  );
  if (!exists) return { ok: false, errorCode: 'MEMBER_NOT_FOUND' };

  const history = inspectMemberRemoval(dataset, committeeId, memberId);
  if (history.hasFinancialHistory && !options?.allowCascadeWithHistory) {
    return { ok: false, errorCode: 'MEMBER_HAS_HISTORY' };
  }

  return {
    ok: true,
    data: {
      ...dataset,
      members: dataset.members.filter(
        (m) => !(m.committeeId === committeeId && m.id === memberId)
      ),
      installments: dataset.installments.filter(
        (ins) => !(ins.committeeId === committeeId && ins.memberId === memberId)
      ),
      payments: dataset.payments.filter(
        (p) => !(p.committeeId === committeeId && p.memberId === memberId)
      ),
      draws: dataset.draws.filter(
        (d) => !(d.committeeId === committeeId && d.memberId === memberId)
      ),
    },
  };
}

export function computeInstallmentView(
  installment: KametiInstallment,
  allPayments: KametiPaymentRecord[],
  todayISO: string = getTodayISO()
): KametiInstallmentView {
  const payments = allPayments
    .filter((p) => p.installmentId === installment.id)
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate) || a.createdAt - b.createdAt);

  const rawPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = roundCurrency(Math.max(0, rawPaid));
  const remainingAmount = Math.max(
    0,
    roundCurrency(installment.expectedAmount - paidAmount)
  );

  // Strict rule: an installment is NEVER marked 'paid' unless full expectedAmount is collected
  const isFullyPaid = remainingAmount <= 0.009;
  const isPartiallyPaid = !isFullyPaid && paidAmount > 0.009;
  const isOverdue = !isFullyPaid && todayISO > installment.dueDate;

  const status: KametiInstallmentStatus = isFullyPaid
    ? 'paid'
    : isOverdue
      ? 'overdue'
      : isPartiallyPaid
        ? 'partial'
        : 'unpaid';

  const latest = payments.length > 0 ? payments[payments.length - 1] : undefined;

  return {
    installment,
    payments,
    paidAmount,
    remainingAmount,
    status,
    isPartiallyPaid,
    latestPaymentDate: latest?.paymentDate,
    latestPaymentMethod: latest?.paymentMethod,
    latestNote: latest?.note,
  };
}

export interface RecordKametiPaymentInput {
  committeeId: string;
  memberId: string;
  installmentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: KametiPaymentMethod;
  note?: string;
}

export function recordKametiPayment(
  dataset: KametiDataset,
  input: RecordKametiPaymentInput,
  nowMs: number = Date.now()
): KametiResult<{ dataset: KametiDataset; payment: KametiPaymentRecord }> {
  const installment = dataset.installments.find(
    (ins) =>
      ins.id === input.installmentId &&
      ins.committeeId === input.committeeId &&
      ins.memberId === input.memberId
  );
  if (!installment) return { ok: false, errorCode: 'INSTALLMENT_NOT_FOUND' };

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, errorCode: 'INVALID_PAYMENT_AMOUNT' };
  }
  if (!isValidISODate(input.paymentDate)) {
    return { ok: false, errorCode: 'INVALID_DATE' };
  }

  const view = computeInstallmentView(installment, dataset.payments);
  const cleanAmount = roundCurrency(input.amount);
  if (cleanAmount <= 0) return { ok: false, errorCode: 'INVALID_PAYMENT_AMOUNT' };

  if (cleanAmount > view.remainingAmount + 0.01) {
    return { ok: false, errorCode: 'PAYMENT_EXCEEDS_REMAINING' };
  }

  const normalizedNote = (input.note || '').trim();
  const duplicateGuard = dataset.payments.some(
    (p) =>
      p.installmentId === installment.id &&
      Math.abs(p.amount - cleanAmount) < 0.005 &&
      p.paymentDate === input.paymentDate &&
      p.paymentMethod === input.paymentMethod &&
      p.note === normalizedNote &&
      Math.abs(nowMs - p.createdAt) < 4000
  );
  if (duplicateGuard) {
    return { ok: false, errorCode: 'DUPLICATE_PAYMENT_SUBMISSION' };
  }

  const appliedAmount = Math.min(cleanAmount, view.remainingAmount);
  const payment: KametiPaymentRecord = {
    id: generateId('kpay'),
    committeeId: input.committeeId,
    memberId: input.memberId,
    installmentId: installment.id,
    amount: roundCurrency(appliedAmount),
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    note: normalizedNote,
    createdAt: nowMs,
  };

  return {
    ok: true,
    data: {
      payment,
      dataset: {
        ...dataset,
        installments: dataset.installments.map((ins) =>
          ins.id === installment.id ? { ...ins, updatedAt: nowMs } : ins
        ),
        payments: [...dataset.payments, payment],
      },
    },
  };
}

export function removeKametiPayment(
  dataset: KametiDataset,
  paymentId: string
): KametiResult<KametiDataset> {
  const existing = dataset.payments.find((p) => p.id === paymentId);
  if (!existing) return { ok: false, errorCode: 'PAYMENT_NOT_FOUND' };

  const now = Date.now();
  return {
    ok: true,
    data: {
      ...dataset,
      installments: dataset.installments.map((ins) =>
        ins.id === existing.installmentId ? { ...ins, updatedAt: now } : ins
      ),
      payments: dataset.payments.filter((p) => p.id !== paymentId),
    },
  };
}

export function getMaxDrawTurns(committee: KametiCommittee): number {
  return Math.max(committee.memberCount, committee.durationMonths);
}

export function getEligibleMembersForDraw(
  dataset: KametiDataset,
  committeeId: string
): KametiMember[] {
  const drawnMemberIds = new Set(
    dataset.draws
      .filter((d) => d.committeeId === committeeId)
      .map((d) => d.memberId)
  );
  return dataset.members
    .filter((m) => m.committeeId === committeeId && !drawnMemberIds.has(m.id))
    .sort((a, b) => a.memberNumber - b.memberNumber);
}

export function getAvailableTurnNumbers(
  dataset: KametiDataset,
  committee: KametiCommittee
): number[] {
  const takenTurns = new Set(
    dataset.draws
      .filter((d) => d.committeeId === committee.id)
      .map((d) => d.turnNumber)
  );
  const maxTurns = getMaxDrawTurns(committee);
  const available: number[] = [];
  for (let i = 1; i <= maxTurns; i++) {
    if (!takenTurns.has(i)) available.push(i);
  }
  return available;
}

export function pickRandomEligibleMember(
  dataset: KametiDataset,
  committeeId: string
): KametiResult<KametiMember> {
  const eligible = getEligibleMembersForDraw(dataset, committeeId);
  if (eligible.length === 0) {
    return { ok: false, errorCode: 'NO_ELIGIBLE_MEMBERS' };
  }
  let idx = 0;
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    idx = buf[0] % eligible.length;
  } else {
    idx = Math.floor(Math.random() * eligible.length);
  }
  return { ok: true, data: eligible[idx] };
}

export interface AssignKametiDrawInput {
  committeeId: string;
  memberId: string;
  turnNumber: number;
  payoutDate: string;
  payoutAmount: number;
  isCompleted: boolean;
  drawMode: 'manual' | 'random';
  notes?: string;
}

export function assignKametiDraw(
  dataset: KametiDataset,
  input: AssignKametiDrawInput
): KametiResult<{ dataset: KametiDataset; draw: KametiDrawRecord }> {
  const committee = dataset.committees.find((c) => c.id === input.committeeId);
  if (!committee) return { ok: false, errorCode: 'COMMITTEE_NOT_FOUND' };

  const member = dataset.members.find(
    (m) => m.id === input.memberId && m.committeeId === input.committeeId
  );
  if (!member) return { ok: false, errorCode: 'MEMBER_NOT_FOUND' };

  if (
    !Number.isFinite(input.turnNumber) ||
    !Number.isInteger(input.turnNumber) ||
    input.turnNumber < 1
  ) {
    return { ok: false, errorCode: 'INVALID_TURN_NUMBER' };
  }
  if (!isValidISODate(input.payoutDate)) {
    return { ok: false, errorCode: 'INVALID_DATE' };
  }
  if (!Number.isFinite(input.payoutAmount) || input.payoutAmount <= 0) {
    return { ok: false, errorCode: 'INVALID_PAYOUT_AMOUNT' };
  }

  const committeeDraws = dataset.draws.filter(
    (d) => d.committeeId === input.committeeId
  );
  if (committeeDraws.some((d) => d.turnNumber === Math.floor(input.turnNumber))) {
    return { ok: false, errorCode: 'DRAW_TURN_ALREADY_TAKEN' };
  }
  if (committeeDraws.some((d) => d.memberId === input.memberId)) {
    return { ok: false, errorCode: 'DRAW_MEMBER_ALREADY_ASSIGNED' };
  }

  const now = Date.now();
  const turn = Math.floor(input.turnNumber);
  const draw: KametiDrawRecord = {
    id: generateId('kdraw'),
    committeeId: input.committeeId,
    cycleNumber: turn,
    turnNumber: turn,
    memberId: input.memberId,
    payoutDate: input.payoutDate,
    payoutAmount: roundCurrency(input.payoutAmount),
    isCompleted: input.isCompleted,
    drawMode: input.drawMode,
    notes: (input.notes || '').trim(),
    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    data: {
      draw,
      dataset: {
        ...dataset,
        members: dataset.members.map((m) =>
          m.id === member.id
            ? { ...m, assignedTurnNumber: turn, updatedAt: now }
            : m
        ),
        draws: [...dataset.draws, draw],
      },
    },
  };
}

export function markKametiDrawCompleted(
  dataset: KametiDataset,
  drawId: string,
  payoutDate: string,
  notes?: string
): KametiResult<KametiDataset> {
  const existing = dataset.draws.find((d) => d.id === drawId);
  if (!existing) return { ok: false, errorCode: 'DRAW_NOT_FOUND' };
  if (!isValidISODate(payoutDate)) return { ok: false, errorCode: 'INVALID_DATE' };

  const now = Date.now();
  return {
    ok: true,
    data: {
      ...dataset,
      draws: dataset.draws.map((d) =>
        d.id === drawId
          ? {
              ...d,
              isCompleted: true,
              payoutDate,
              notes: notes !== undefined ? notes.trim() : d.notes,
              updatedAt: now,
            }
          : d
      ),
    },
  };
}

export function computeKametiCommitteeDashboard(
  committee: KametiCommittee,
  dataset: KametiDataset,
  todayISO: string = getTodayISO()
): KametiDashboardMetrics {
  const members = dataset.members.filter((m) => m.committeeId === committee.id);
  const installments = dataset.installments.filter(
    (ins) => ins.committeeId === committee.id
  );
  const payments = dataset.payments.filter((p) => p.committeeId === committee.id);
  const draws = dataset.draws
    .filter((d) => d.committeeId === committee.id)
    .sort((a, b) => a.turnNumber - b.turnNumber);

  const { expectedMonthlyCollection, expectedTotalCollection } =
    computeExpectedCollections(
      committee.monthlyInstallment,
      committee.memberCount,
      committee.durationMonths
    );

  let paidInstallmentsCount = 0;
  let partialInstallmentsCount = 0;
  let unpaidInstallmentsCount = 0;
  let overdueInstallmentsCount = 0;
  let enrolledExpectedTotal = 0;

  for (const ins of installments) {
    enrolledExpectedTotal = roundCurrency(enrolledExpectedTotal + ins.expectedAmount);
    const view = computeInstallmentView(ins, payments, todayISO);
    if (view.status === 'paid') paidInstallmentsCount += 1;
    else if (view.status === 'partial') partialInstallmentsCount += 1;
    else if (view.status === 'overdue') overdueInstallmentsCount += 1;
    else unpaidInstallmentsCount += 1;
  }

  const totalCollected = roundCurrency(
    payments.reduce((sum, p) => sum + p.amount, 0)
  );
  const remainingCollection = Math.max(
    0,
    roundCurrency(expectedTotalCollection - totalCollected)
  );
  const scheduledRemainingCollection = Math.max(
    0,
    roundCurrency(enrolledExpectedTotal - totalCollected)
  );
  const collectionProgressPercent =
    expectedTotalCollection > 0
      ? Math.min(
          100,
          Math.round((totalCollected / expectedTotalCollection) * 1000) / 10
        )
      : 0;

  // Determine current cycle (based on current month or due dates)
  const specs = generateCycleSpecsForCommittee(committee);
  const currentMonth = todayISO.slice(0, 7) || getCurrentMonthISO();
  let currentCycleNumber = 1;
  const monthMatch = specs.find((s) => s.cycleMonthISO === currentMonth);
  if (monthMatch) {
    currentCycleNumber = monthMatch.cycleNumber;
  } else if (specs.length > 0) {
    if (todayISO < specs[0].dueDate) {
      currentCycleNumber = 1;
    } else if (todayISO > specs[specs.length - 1].dueDate) {
      currentCycleNumber = specs[specs.length - 1].cycleNumber;
    } else {
      const nextDue = specs.find((s) => s.dueDate >= todayISO);
      currentCycleNumber = nextDue ? nextDue.cycleNumber : specs.length;
    }
  }

  const completedDrawsCount = draws.filter((d) => d.isCompleted).length;
  const currentRecipientDraw =
    draws.find((d) => d.turnNumber === currentCycleNumber) ||
    draws.find((d) => !d.isCompleted) ||
    (draws.length > 0 ? draws[draws.length - 1] : null);
  const currentRecipientMember = currentRecipientDraw
    ? members.find((m) => m.id === currentRecipientDraw.memberId) || null
    : null;

  return {
    committee,
    currentMembersCount: members.length,
    targetMemberCount: committee.memberCount,
    monthlyInstallment: committee.monthlyInstallment,
    expectedMonthlyCollection,
    expectedTotalCollection,
    enrolledExpectedTotal,
    totalCollected,
    remainingCollection,
    scheduledRemainingCollection,
    collectionProgressPercent,
    paidInstallmentsCount,
    partialInstallmentsCount,
    unpaidInstallmentsCount,
    overdueInstallmentsCount,
    totalInstallmentsCount: installments.length,
    completedDrawsCount,
    currentCycleNumber,
    currentRecipientMember,
    currentRecipientDraw,
  };
}

export function buildKametiMemberSummaries(
  committee: KametiCommittee,
  dataset: KametiDataset,
  todayISO: string = getTodayISO()
): KametiMemberSummary[] {
  const members = dataset.members
    .filter((m) => m.committeeId === committee.id)
    .sort((a, b) => a.memberNumber - b.memberNumber);
  const payments = dataset.payments.filter((p) => p.committeeId === committee.id);

  return members.map((member) => {
    const memberInstallments = dataset.installments
      .filter(
        (ins) => ins.committeeId === committee.id && ins.memberId === member.id
      )
      .sort((a, b) => a.cycleNumber - b.cycleNumber);

    const views = memberInstallments.map((ins) =>
      computeInstallmentView(ins, payments, todayISO)
    );

    let totalExpected = 0;
    let totalPaid = 0;
    let outstandingAmount = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    for (const v of views) {
      totalExpected = roundCurrency(totalExpected + v.installment.expectedAmount);
      totalPaid = roundCurrency(totalPaid + v.paidAmount);
      outstandingAmount = roundCurrency(outstandingAmount + v.remainingAmount);
      if (v.status === 'paid') paidCount += 1;
      else if (v.status === 'partial') partialCount += 1;
      else if (v.status === 'overdue') overdueCount += 1;
      else unpaidCount += 1;
    }

    const drawRecord =
      dataset.draws.find(
        (d) => d.committeeId === committee.id && d.memberId === member.id
      ) || null;
    const effectiveTurnNumber =
      drawRecord?.turnNumber ?? member.assignedTurnNumber ?? null;

    const nextDueInstallment =
      views.find((v) => v.status !== 'paid') || null;

    return {
      member,
      totalExpected,
      totalPaid,
      outstandingAmount,
      paidCount,
      partialCount,
      unpaidCount,
      overdueCount,
      totalInstallmentsCount: views.length,
      drawRecord,
      effectiveTurnNumber,
      nextDueInstallment,
    };
  });
}

export function buildKametiMemberStatement(
  committee: KametiCommittee,
  member: KametiMember,
  dataset: KametiDataset,
  todayISO: string = getTodayISO(),
  generatedAt: Date = new Date()
): KametiMemberStatementData {
  const memberInstallments = dataset.installments
    .filter(
      (ins) => ins.committeeId === committee.id && ins.memberId === member.id
    )
    .sort((a, b) => a.cycleNumber - b.cycleNumber);
  const memberPayments = dataset.payments.filter(
    (p) => p.committeeId === committee.id && p.memberId === member.id
  );

  const installments = memberInstallments.map((ins) =>
    computeInstallmentView(ins, memberPayments, todayISO)
  );

  let totalExpected = 0;
  let totalPaid = 0;
  let outstandingAmount = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;

  for (const v of installments) {
    totalExpected = roundCurrency(totalExpected + v.installment.expectedAmount);
    totalPaid = roundCurrency(totalPaid + v.paidAmount);
    outstandingAmount = roundCurrency(outstandingAmount + v.remainingAmount);
    if (v.status === 'paid') paidCount += 1;
    else if (v.status === 'partial') partialCount += 1;
    else if (v.status === 'overdue') overdueCount += 1;
    else unpaidCount += 1;
  }

  const insById = new Map(memberInstallments.map((ins) => [ins.id, ins]));
  const paymentHistory = [...memberPayments]
    .sort(
      (a, b) =>
        a.paymentDate.localeCompare(b.paymentDate) || a.createdAt - b.createdAt
    )
    .map((p) => {
      const ins = insById.get(p.installmentId);
      return {
        ...p,
        cycleNumber: ins?.cycleNumber ?? 0,
        dueDate: ins?.dueDate ?? p.paymentDate,
      };
    });

  const drawRecord =
    dataset.draws.find(
      (d) => d.committeeId === committee.id && d.memberId === member.id
    ) || null;
  const effectiveTurnNumber =
    drawRecord?.turnNumber ?? member.assignedTurnNumber ?? null;

  return {
    committee,
    member,
    generatedAt,
    totalExpected,
    totalPaid,
    outstandingAmount,
    paidCount,
    partialCount,
    unpaidCount,
    overdueCount,
    drawRecord,
    effectiveTurnNumber,
    installments,
    paymentHistory,
  };
}

export function buildKametiCommitteeReport(
  committee: KametiCommittee,
  dataset: KametiDataset,
  todayISO: string = getTodayISO(),
  generatedAt: Date = new Date()
): KametiCommitteeReportData {
  const dashboard = computeKametiCommitteeDashboard(committee, dataset, todayISO);
  const memberSummaries = buildKametiMemberSummaries(committee, dataset, todayISO);
  const membersById = new Map(
    dataset.members
      .filter((m) => m.committeeId === committee.id)
      .map((m) => [m.id, m])
  );
  const payments = dataset.payments.filter((p) => p.committeeId === committee.id);
  const installments = dataset.installments.filter(
    (ins) => ins.committeeId === committee.id
  );
  const drawsRaw = dataset.draws
    .filter((d) => d.committeeId === committee.id)
    .sort((a, b) => a.turnNumber - b.turnNumber);

  const specs = generateCycleSpecsForCommittee(committee);
  const monthlySummaries: KametiCycleCollectionSummary[] = specs.map((spec) => {
    const cycleInstallments = installments.filter(
      (ins) => ins.cycleNumber === spec.cycleNumber
    );
    const views = cycleInstallments.map((ins) =>
      computeInstallmentView(ins, payments, todayISO)
    );
    const expectedFromSchedules = roundCurrency(
      views.reduce((s, v) => s + v.installment.expectedAmount, 0)
    );
    const targetCycleExpected = roundCurrency(
      spec.expectedAmount * committee.memberCount
    );
    const expectedAmount =
      expectedFromSchedules > 0 ? expectedFromSchedules : targetCycleExpected;
    const collectedAmount = roundCurrency(
      views.reduce((s, v) => s + v.paidAmount, 0)
    );
    const remainingAmount = Math.max(
      0,
      roundCurrency(expectedAmount - collectedAmount)
    );
    const paidMembersCount = views.filter((v) => v.status === 'paid').length;
    const drawForCycle = drawsRaw.find((d) => d.turnNumber === spec.cycleNumber);
    const winner = drawForCycle ? membersById.get(drawForCycle.memberId) : undefined;

    return {
      cycleNumber: spec.cycleNumber,
      cycleMonthISO: spec.cycleMonthISO,
      dueDate: spec.dueDate,
      expectedAmount,
      collectedAmount,
      remainingAmount,
      paidMembersCount,
      totalMembersCount: memberSummaries.length,
      drawWinnerName: winner?.name || null,
      drawTurnNumber: drawForCycle?.turnNumber ?? null,
      drawCompleted: drawForCycle?.isCompleted ?? false,
    };
  });

  const draws = drawsRaw.map((d) => {
    const member = membersById.get(d.memberId);
    return {
      ...d,
      memberName: member?.name || 'Member',
      memberNumber: member?.memberNumber ?? 0,
      memberPhone: member?.phone || '',
    };
  });

  const outstandingInstallments = installments
    .map((ins) => {
      const view = computeInstallmentView(ins, payments, todayISO);
      const member = membersById.get(ins.memberId);
      return {
        ...view,
        memberName: member?.name || 'Member',
        memberNumber: member?.memberNumber ?? 0,
        memberPhone: member?.phone || '',
      };
    })
    .filter((v) => v.status !== 'paid')
    .sort(
      (a, b) =>
        a.installment.dueDate.localeCompare(b.installment.dueDate) ||
        a.memberNumber - b.memberNumber
    );

  return {
    committee,
    generatedAt,
    dashboard,
    memberSummaries,
    monthlySummaries,
    draws,
    outstandingInstallments,
  };
}

export function formatKametiCurrencyRs(amount: number): string {
  const abs = Math.abs(roundCurrency(amount));
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
}

export function formatKametiCurrencyPKR(amount: number): string {
  const abs = Math.abs(roundCurrency(amount));
  const formatted = abs.toLocaleString('en-PK', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `PKR ${formatted}`;
}

export function buildKametiWhatsAppReminderMessage(
  statement: KametiMemberStatementData,
  lang: Language
): string {
  const { committee, member } = statement;
  const nextDue = statement.installments.find((i) => i.status !== 'paid');
  const turnTextEn = statement.effectiveTurnNumber
    ? `Turn #${statement.effectiveTurnNumber}${
        statement.drawRecord?.isCompleted ? ' (Payout Received)' : ' (Scheduled)'
      }`
    : 'Not assigned yet';
  const turnTextUr = statement.effectiveTurnNumber
    ? `نمبر / پرچی #${statement.effectiveTurnNumber}${
        statement.drawRecord?.isCompleted ? ' (رقم موصول ہو چکی)' : ' (طے شدہ)'
      }`
    : 'ابھی طے نہیں ہوئی';

  if (lang === 'ur') {
    const lines = [
      `السلام علیکم ${member.name}!`,
      ``,
      `کمیٹی (BC): *${committee.name}*`,
      `ممبر نمبر: #${member.memberNumber}`,
      `کل طے شدہ اقساط: ${formatKametiCurrencyRs(statement.totalExpected)}`,
      `اب تک ادا شدہ: ${formatKametiCurrencyRs(statement.totalPaid)}`,
      `باقی واجب الادا رقم: *${formatKametiCurrencyRs(statement.outstandingAmount)}*`,
      `باری / پرچی: ${turnTextUr}`,
    ];
    if (nextDue) {
      lines.push(
        `اگلی / زیرِ التواء قسط #${nextDue.installment.cycleNumber} (${nextDue.installment.dueDate}): ${formatKametiCurrencyRs(nextDue.remainingAmount)}`
      );
    }
    if (statement.overdueCount > 0) {
      lines.push(`نوٹ: ${statement.overdueCount} قسط کی آخری تاریخ گزر چکی ہے۔ براہِ کرم ادائیگی کی تصدیق کریں۔`);
    }
    lines.push(``, `شکریہ۔`, `— EasyDay`);
    return lines.join('\n');
  }

  const lines = [
    `Assalam-o-Alaikum ${member.name}!`,
    ``,
    `Committee (Kameti / BC): *${committee.name}*`,
    `Member #: ${member.memberNumber}`,
    `Total Expected: ${formatKametiCurrencyRs(statement.totalExpected)}`,
    `Total Paid: ${formatKametiCurrencyRs(statement.totalPaid)}`,
    `Remaining Outstanding: *${formatKametiCurrencyRs(statement.outstandingAmount)}*`,
    `Draw / Turn: ${turnTextEn}`,
  ];
  if (nextDue) {
    lines.push(
      `Next Pending Installment #${nextDue.installment.cycleNumber} (Due ${nextDue.installment.dueDate}): ${formatKametiCurrencyRs(nextDue.remainingAmount)}`
    );
  }
  if (statement.overdueCount > 0) {
    lines.push(
      `Reminder: ${statement.overdueCount} installment(s) are currently overdue. Please coordinate payment.`
    );
  }
  lines.push(``, `Thank you.`, `— EasyDay`);
  return lines.join('\n');
}

export function buildKametiMemberWhatsAppUrl(
  statement: KametiMemberStatementData,
  lang: Language,
  customMessage?: string
): string {
  const msg = customMessage ?? buildKametiWhatsAppReminderMessage(statement, lang);
  return buildWhatsAppUrl(statement.member.phone, msg);
}
