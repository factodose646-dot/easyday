import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Dices,
  FileText,
  Landmark,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  addKametiMember,
  assignKametiDraw,
  buildKametiCommitteeReport,
  buildKametiMemberStatement,
  buildKametiMemberSummaries,
  computeExpectedCollections,
  computeInstallmentView,
  computeKametiCommitteeDashboard,
  createKametiCommittee,
  deleteKametiCommittee,
  formatKametiCurrencyPKR,
  getAvailableTurnNumbers,
  getEligibleMembersForDraw,
  getNextAvailableMemberNumber,
  inspectMemberRemoval,
  KametiEngineErrorCode,
  KametiInstallmentView,
  markKametiDrawCompleted,
  pickRandomEligibleMember,
  recordKametiPayment,
  removeKametiMember,
  removeKametiPayment,
  updateKametiCommittee,
  updateKametiMember,
} from '../../utils/kametiEngine';
import {
  getStorageErrorMessage,
  getTodayISO,
  KametiDataset,
  KametiInstallmentStatus,
  KametiMember,
  KametiPaymentFrequency,
  KametiPaymentMethod,
  KametiStatus,
  kametiStorage,
} from '../../utils/storage';
import { KametiDrawWheel } from './KametiDrawWheel';
import { KametiPdfModal, KametiPdfModalTarget } from './KametiPdfModal';
import { KametiReminderModal } from './KametiReminderModal';

interface KametiManagerToolProps {
  language: Language;
  t: ToolTranslationBundle['kameti'];
}

type CommitteeTab = 'overview' | 'members' | 'installments' | 'draws' | 'reports';
type CommitteeFilter = 'all' | KametiStatus;
type InstallmentFilter = 'all' | KametiInstallmentStatus;

const PAYMENT_METHODS: KametiPaymentMethod[] = [
  'Cash',
  'JazzCash',
  'EasyPaisa',
  'Bank Transfer',
  'Other',
];

export const KametiManagerTool: React.FC<KametiManagerToolProps> = ({
  language,
  t,
}) => {
  const [dataset, setDataset] = useState<KametiDataset>(() =>
    kametiStorage.loadAll()
  );
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(
    () => kametiStorage.loadCommittees()[0]?.id ?? null
  );
  const [committeeFilter, setCommitteeFilter] = useState<CommitteeFilter>('all');
  const [activeTab, setActiveTab] = useState<CommitteeTab>('overview');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Committee Create/Edit Modal
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
  const [editingCommitteeId, setEditingCommitteeId] = useState<string | null>(null);
  const [cName, setCName] = useState('');
  const [cMonthlyAmount, setCMonthlyAmount] = useState('');
  const [cMemberCount, setCMemberCount] = useState('10');
  const [cStartDate, setCStartDate] = useState(() => getTodayISO());
  const [cDuration, setCDuration] = useState('10');
  const [cFrequency, setCFrequency] = useState<KametiPaymentFrequency>('monthly');
  const [cCollectionDay, setCCollectionDay] = useState('5');
  const [cDescription, setCDescription] = useState('');
  const [cStatus, setCStatus] = useState<KametiStatus>('active');
  const [committeeFormError, setCommitteeFormError] = useState<string | null>(null);

  // Delete Committee Confirm
  const [deleteCommitteeId, setDeleteCommitteeId] = useState<string | null>(null);

  // Member Add/Edit Modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mNumber, setMNumber] = useState('1');
  const [mJoiningDate, setMJoiningDate] = useState(() => getTodayISO());
  const [mTurnNumber, setMTurnNumber] = useState('');
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Member Safe Removal Confirm
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{
    member: KametiMember;
    paymentsCount: number;
    totalPaid: number;
    drawsCount: number;
    hasFinancialHistory: boolean;
  } | null>(null);

  // Installments Filter & Payment Collection Modal
  const [insMemberFilter, setInsMemberFilter] = useState<string>('all');
  const [insStatusFilter, setInsStatusFilter] = useState<InstallmentFilter>('all');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMemberId, setPayMemberId] = useState<string>('');
  const [payInstallmentId, setPayInstallmentId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(() => getTodayISO());
  const [payMethod, setPayMethod] = useState<KametiPaymentMethod>('Cash');
  const [payNote, setPayNote] = useState<string>('');
  const [payError, setPayError] = useState<string | null>(null);
  const paymentLockRef = useRef(false);

  // Remove payment confirm
  const [removePaymentId, setRemovePaymentId] = useState<string | null>(null);

  // Draw / Parchi form & confirmation modal
  const [drawMemberId, setDrawMemberId] = useState<string>('');
  const [drawTurnNumber, setDrawTurnNumber] = useState<string>('');
  const [drawPayoutDate, setDrawPayoutDate] = useState<string>(() => getTodayISO());
  const [drawPayoutAmount, setDrawPayoutAmount] = useState<string>('');
  const [drawCompleted, setDrawCompleted] = useState<boolean>(true);
  const [drawNotes, setDrawNotes] = useState<string>('');
  const [drawError, setDrawError] = useState<string | null>(null);
  const [pendingDrawConfirm, setPendingDrawConfirm] = useState<{
    mode: 'manual' | 'random';
    member: KametiMember;
    turnNumber: number;
    payoutDate: string;
    payoutAmount: number;
    isCompleted: boolean;
    notes: string;
  } | null>(null);

  // PDF Preview/Export & WhatsApp Reminder Modals
  const [pdfModalTarget, setPdfModalTarget] = useState<KametiPdfModalTarget | null>(
    null
  );
  const [reminderMemberId, setReminderMemberId] = useState<string | null>(null);

  const todayISO = getTodayISO();

  const resolveErr = (code?: KametiEngineErrorCode): string => {
    if (!code) return t.errors.INVALID_DATE;
    return t.errors[code] || code;
  };

  const persistDataset = (next: KametiDataset, successToast?: string): boolean => {
    const res = kametiStorage.saveAll(next);
    if (!res.ok) {
      setStorageError(
        getStorageErrorMessage(res.errorCode || 'UNKNOWN_STORAGE_ERROR', language)
      );
      return false;
    }
    setStorageError(null);
    setDataset(next);
    if (successToast) {
      setToastMsg(successToast);
      window.setTimeout(() => setToastMsg(null), 3200);
    }
    return true;
  };

  const filteredCommittees = useMemo(() => {
    return dataset.committees.filter((c) =>
      committeeFilter === 'all' ? true : c.status === committeeFilter
    );
  }, [dataset.committees, committeeFilter]);

  const activeCommittee = useMemo(() => {
    if (!selectedCommitteeId) return dataset.committees[0] || null;
    return (
      dataset.committees.find((c) => c.id === selectedCommitteeId) ||
      dataset.committees[0] ||
      null
    );
  }, [dataset.committees, selectedCommitteeId]);

  const dashboard = useMemo(() => {
    if (!activeCommittee) return null;
    return computeKametiCommitteeDashboard(activeCommittee, dataset, todayISO);
  }, [activeCommittee, dataset, todayISO]);

  const memberSummaries = useMemo(() => {
    if (!activeCommittee) return [];
    return buildKametiMemberSummaries(activeCommittee, dataset, todayISO);
  }, [activeCommittee, dataset, todayISO]);

  const filteredMemberSummaries = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return memberSummaries;
    return memberSummaries.filter(
      (ms) =>
        ms.member.name.toLowerCase().includes(q) ||
        ms.member.phone.toLowerCase().includes(q) ||
        String(ms.member.memberNumber).includes(q)
    );
  }, [memberSummaries, memberSearch]);

  const committeeMembersById = useMemo(() => {
    const map = new Map<string, KametiMember>();
    if (!activeCommittee) return map;
    for (const m of dataset.members) {
      if (m.committeeId === activeCommittee.id) map.set(m.id, m);
    }
    return map;
  }, [activeCommittee, dataset.members]);

  const committeeInstallmentViews = useMemo(() => {
    if (!activeCommittee) return [] as KametiInstallmentView[];
    const payments = dataset.payments.filter(
      (p) => p.committeeId === activeCommittee.id
    );
    return dataset.installments
      .filter((ins) => ins.committeeId === activeCommittee.id)
      .map((ins) => computeInstallmentView(ins, payments, todayISO))
      .sort(
        (a, b) =>
          a.installment.cycleNumber - b.installment.cycleNumber ||
          (committeeMembersById.get(a.installment.memberId)?.memberNumber ?? 0) -
            (committeeMembersById.get(b.installment.memberId)?.memberNumber ?? 0)
      );
  }, [activeCommittee, dataset.installments, dataset.payments, todayISO, committeeMembersById]);

  const filteredInstallmentViews = useMemo(() => {
    return committeeInstallmentViews.filter((v) => {
      if (insMemberFilter !== 'all' && v.installment.memberId !== insMemberFilter) {
        return false;
      }
      if (insStatusFilter !== 'all' && v.status !== insStatusFilter) {
        return false;
      }
      return true;
    });
  }, [committeeInstallmentViews, insMemberFilter, insStatusFilter]);

  const committeePayments = useMemo(() => {
    if (!activeCommittee) return [];
    return dataset.payments
      .filter((p) => p.committeeId === activeCommittee.id)
      .sort(
        (a, b) =>
          b.paymentDate.localeCompare(a.paymentDate) || b.createdAt - a.createdAt
      );
  }, [activeCommittee, dataset.payments]);

  const eligibleDrawMembers = useMemo(() => {
    if (!activeCommittee) return [];
    return getEligibleMembersForDraw(dataset, activeCommittee.id);
  }, [activeCommittee, dataset]);

  const availableTurnNumbers = useMemo(() => {
    if (!activeCommittee) return [];
    return getAvailableTurnNumbers(dataset, activeCommittee);
  }, [activeCommittee, dataset]);

  const committeeDraws = useMemo(() => {
    if (!activeCommittee) return [];
    return dataset.draws
      .filter((d) => d.committeeId === activeCommittee.id)
      .sort((a, b) => a.turnNumber - b.turnNumber);
  }, [activeCommittee, dataset.draws]);

  const previewCollections = useMemo(() => {
    return computeExpectedCollections(
      Number(cMonthlyAmount),
      Number(cMemberCount),
      Number(cDuration)
    );
  }, [cMonthlyAmount, cMemberCount, cDuration]);

  const reminderStatement = useMemo(() => {
    if (!activeCommittee || !reminderMemberId) return null;
    const member = committeeMembersById.get(reminderMemberId);
    if (!member) return null;
    return buildKametiMemberStatement(activeCommittee, member, dataset, todayISO);
  }, [activeCommittee, reminderMemberId, committeeMembersById, dataset, todayISO]);

  const handleSelectCommittee = (id: string | null) => {
    setSelectedCommitteeId(id);
    setInsMemberFilter('all');
    setInsStatusFilter('all');
    setMemberSearch('');
    setDrawMemberId('');
    setDrawTurnNumber('');
    setDrawPayoutAmount('');
    setDrawNotes('');
    setDrawError(null);
  };

  // Handlers: Committee CRUD
  const openCreateCommitteeModal = () => {
    setEditingCommitteeId(null);
    setCName('');
    setCMonthlyAmount('10000');
    setCMemberCount('10');
    setCStartDate(getTodayISO());
    setCDuration('10');
    setCFrequency('monthly');
    setCCollectionDay(String(new Date().getDate()));
    setCDescription('');
    setCStatus('active');
    setCommitteeFormError(null);
    setCommitteeModalOpen(true);
  };

  const openEditCommitteeModal = () => {
    if (!activeCommittee) return;
    setEditingCommitteeId(activeCommittee.id);
    setCName(activeCommittee.name);
    setCMonthlyAmount(String(activeCommittee.monthlyInstallment));
    setCMemberCount(String(activeCommittee.memberCount));
    setCStartDate(activeCommittee.startDate);
    setCDuration(String(activeCommittee.durationMonths));
    setCFrequency(activeCommittee.paymentFrequency);
    setCCollectionDay(String(activeCommittee.collectionDay));
    setCDescription(activeCommittee.description);
    setCStatus(activeCommittee.status);
    setCommitteeFormError(null);
    setCommitteeModalOpen(true);
  };

  const handleSaveCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: cName,
      monthlyInstallment: Number(cMonthlyAmount),
      memberCount: Number(cMemberCount),
      startDate: cStartDate,
      durationMonths: Number(cDuration),
      paymentFrequency: cFrequency,
      collectionDay: Number(cCollectionDay),
      description: cDescription,
      status: cStatus,
    };

    const result = editingCommitteeId
      ? updateKametiCommittee(dataset, editingCommitteeId, payload)
      : createKametiCommittee(dataset, payload);

    if (!result.ok || !result.data) {
      setCommitteeFormError(resolveErr(result.errorCode));
      return;
    }

    if (persistDataset(result.data.dataset)) {
      if (!editingCommitteeId) {
        handleSelectCommittee(result.data.committee.id);
      } else {
        setSelectedCommitteeId(result.data.committee.id);
      }
      setCommitteeModalOpen(false);
    }
  };

  const handleConfirmDeleteCommittee = () => {
    if (!deleteCommitteeId) return;
    const res = deleteKametiCommittee(dataset, deleteCommitteeId);
    if (!res.ok || !res.data) {
      setDeleteCommitteeId(null);
      return;
    }
    if (persistDataset(res.data)) {
      const remaining = res.data.committees[0]?.id ?? null;
      if (selectedCommitteeId === deleteCommitteeId) {
        handleSelectCommittee(remaining);
      }
      setDeleteCommitteeId(null);
    }
  };

  // Handlers: Member CRUD
  const openAddMemberModal = () => {
    if (!activeCommittee) return;
    setEditingMemberId(null);
    setMName('');
    setMPhone('');
    setMAddress('');
    setMNumber(String(getNextAvailableMemberNumber(dataset, activeCommittee.id)));
    setMJoiningDate(getTodayISO());
    setMTurnNumber('');
    setMemberFormError(null);
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (member: KametiMember) => {
    setEditingMemberId(member.id);
    setMName(member.name);
    setMPhone(member.phone);
    setMAddress(member.address || '');
    setMNumber(String(member.memberNumber));
    setMJoiningDate(member.joiningDate);
    setMTurnNumber(
      member.assignedTurnNumber !== undefined ? String(member.assignedTurnNumber) : ''
    );
    setMemberFormError(null);
    setMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee) return;
    const parsedTurn =
      mTurnNumber.trim() === '' ? undefined : Number(mTurnNumber.trim());

    const input = {
      name: mName,
      phone: mPhone,
      address: mAddress,
      memberNumber: Number(mNumber),
      joiningDate: mJoiningDate,
      assignedTurnNumber: parsedTurn,
    };

    const result = editingMemberId
      ? updateKametiMember(dataset, activeCommittee.id, editingMemberId, input)
      : addKametiMember(dataset, activeCommittee.id, input);

    if (!result.ok || !result.data) {
      setMemberFormError(resolveErr(result.errorCode));
      return;
    }

    if (persistDataset(result.data.dataset)) {
      setMemberModalOpen(false);
    }
  };

  const requestRemoveMember = (member: KametiMember) => {
    if (!activeCommittee) return;
    const info = inspectMemberRemoval(dataset, activeCommittee.id, member.id);
    setRemoveMemberTarget({
      member,
      ...info,
    });
  };

  const confirmRemoveMember = () => {
    if (!activeCommittee || !removeMemberTarget) return;
    const res = removeKametiMember(
      dataset,
      activeCommittee.id,
      removeMemberTarget.member.id,
      { allowCascadeWithHistory: removeMemberTarget.hasFinancialHistory }
    );
    if (!res.ok || !res.data) {
      setStorageError(resolveErr(res.errorCode));
      setRemoveMemberTarget(null);
      return;
    }
    if (persistDataset(res.data)) {
      setRemoveMemberTarget(null);
    }
  };

  // Handlers: Installment Payment Collection
  const openCollectPaymentModal = (
    preselectedMemberId?: string,
    preselectedInstallmentId?: string
  ) => {
    if (!activeCommittee) return;
    const members = memberSummaries.map((ms) => ms.member);
    const chosenMemberId = preselectedMemberId || members[0]?.id || '';
    const memberViews = committeeInstallmentViews.filter(
      (v) => v.installment.memberId === chosenMemberId
    );
    const pendingIns =
      (preselectedInstallmentId &&
        memberViews.find((v) => v.installment.id === preselectedInstallmentId)) ||
      memberViews.find((v) => v.status !== 'paid') ||
      memberViews[0];

    setPayMemberId(chosenMemberId);
    setPayInstallmentId(pendingIns?.installment.id || '');
    setPayAmount(pendingIns ? String(pendingIns.remainingAmount) : '');
    setPayDate(getTodayISO());
    setPayMethod('Cash');
    setPayNote('');
    setPayError(null);
    setPayModalOpen(true);
  };

  const handlePayMemberChange = (nextMemberId: string) => {
    setPayMemberId(nextMemberId);
    const memberViews = committeeInstallmentViews.filter(
      (v) => v.installment.memberId === nextMemberId
    );
    const nextPending =
      memberViews.find((v) => v.status !== 'paid') || memberViews[0];
    setPayInstallmentId(nextPending?.installment.id || '');
    setPayAmount(nextPending ? String(nextPending.remainingAmount) : '');
    setPayError(null);
  };

  const handlePayInstallmentChange = (nextInstallmentId: string) => {
    setPayInstallmentId(nextInstallmentId);
    const found = committeeInstallmentViews.find(
      (v) => v.installment.id === nextInstallmentId
    );
    setPayAmount(found ? String(found.remainingAmount) : '');
    setPayError(null);
  };

  const selectedPayInstallmentView = useMemo(
    () =>
      committeeInstallmentViews.find(
        (v) => v.installment.id === payInstallmentId
      ) || null,
    [committeeInstallmentViews, payInstallmentId]
  );

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee || paymentLockRef.current) return;
    paymentLockRef.current = true;
    try {
      const res = recordKametiPayment(dataset, {
        committeeId: activeCommittee.id,
        memberId: payMemberId,
        installmentId: payInstallmentId,
        amount: Number(payAmount),
        paymentDate: payDate,
        paymentMethod: payMethod,
        note: payNote,
      });

      if (!res.ok || !res.data) {
        setPayError(resolveErr(res.errorCode));
        return;
      }

      if (persistDataset(res.data.dataset, t.installmentsUI.savePaymentBtn)) {
        setPayModalOpen(false);
      }
    } finally {
      window.setTimeout(() => {
        paymentLockRef.current = false;
      }, 250);
    }
  };

  const confirmRemovePayment = () => {
    if (!removePaymentId) return;
    const res = removeKametiPayment(dataset, removePaymentId);
    if (!res.ok || !res.data) {
      setRemovePaymentId(null);
      return;
    }
    if (persistDataset(res.data)) {
      setRemovePaymentId(null);
    }
  };

  // Handlers: Draw / Parchi Management
  const getDefaultPayoutAmount = (): number => {
    if (!activeCommittee) return 0;
    return activeCommittee.monthlyInstallment * activeCommittee.memberCount;
  };

  const handleRequestManualDraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee) return;
    setDrawError(null);

    const chosenMemberId = drawMemberId || eligibleDrawMembers[0]?.id || '';
    const member = eligibleDrawMembers.find((m) => m.id === chosenMemberId);
    if (!member) {
      setDrawError(t.errors.NO_ELIGIBLE_MEMBERS);
      return;
    }
    const turnNum = Number(drawTurnNumber || availableTurnNumbers[0] || 0);
    if (!availableTurnNumbers.includes(turnNum)) {
      setDrawError(t.errors.DRAW_TURN_ALREADY_TAKEN);
      return;
    }
    const amt = Number(drawPayoutAmount || getDefaultPayoutAmount());
    if (!Number.isFinite(amt) || amt <= 0) {
      setDrawError(t.errors.INVALID_PAYOUT_AMOUNT);
      return;
    }

    setPendingDrawConfirm({
      mode: 'manual',
      member,
      turnNumber: turnNum,
      payoutDate: drawPayoutDate,
      payoutAmount: amt,
      isCompleted: drawCompleted,
      notes: drawNotes,
    });
  };

  const handlePickRandomMemberForWheel = (): KametiMember | null => {
    if (!activeCommittee) return null;
    setDrawError(null);
    const nextTurn = availableTurnNumbers[0];
    if (!nextTurn) {
      setDrawError(t.errors.DRAW_TURN_ALREADY_TAKEN);
      return null;
    }
    const pick = pickRandomEligibleMember(dataset, activeCommittee.id);
    if (!pick.ok || !pick.data) {
      setDrawError(resolveErr(pick.errorCode));
      return null;
    }
    return pick.data;
  };

  const handleConfirmWheelWinner = (winner: KametiMember) => {
    if (!activeCommittee) return;
    setDrawError(null);
    const nextTurn = availableTurnNumbers[0];
    if (!nextTurn) {
      setDrawError(t.errors.DRAW_TURN_ALREADY_TAKEN);
      return;
    }
    setPendingDrawConfirm({
      mode: 'random',
      member: winner,
      turnNumber: nextTurn,
      payoutDate: getTodayISO(),
      payoutAmount: getDefaultPayoutAmount(),
      isCompleted: true,
      notes: '',
    });
  };

  const handleTriggerRandomDraw = () => {
    if (!activeCommittee) return;
    setDrawError(null);
    const pick = pickRandomEligibleMember(dataset, activeCommittee.id);
    if (!pick.ok || !pick.data) {
      setDrawError(resolveErr(pick.errorCode));
      return;
    }
    const nextTurn = availableTurnNumbers[0];
    if (!nextTurn) {
      setDrawError(t.errors.DRAW_TURN_ALREADY_TAKEN);
      return;
    }
    setPendingDrawConfirm({
      mode: 'random',
      member: pick.data,
      turnNumber: nextTurn,
      payoutDate: getTodayISO(),
      payoutAmount: getDefaultPayoutAmount(),
      isCompleted: true,
      notes: '',
    });
  };

  const handleConfirmSaveDraw = () => {
    if (!activeCommittee || !pendingDrawConfirm) return;
    const res = assignKametiDraw(dataset, {
      committeeId: activeCommittee.id,
      memberId: pendingDrawConfirm.member.id,
      turnNumber: pendingDrawConfirm.turnNumber,
      payoutDate: pendingDrawConfirm.payoutDate,
      payoutAmount: pendingDrawConfirm.payoutAmount,
      isCompleted: pendingDrawConfirm.isCompleted,
      drawMode: pendingDrawConfirm.mode,
      notes: pendingDrawConfirm.notes,
    });
    if (!res.ok || !res.data) {
      setDrawError(resolveErr(res.errorCode));
      setPendingDrawConfirm(null);
      return;
    }
    if (persistDataset(res.data.dataset)) {
      setPendingDrawConfirm(null);
      setDrawMemberId('');
      setDrawTurnNumber('');
      setDrawNotes('');
    }
  };

  const handleMarkDrawDone = (drawId: string) => {
    const res = markKametiDrawCompleted(dataset, drawId, getTodayISO());
    if (res.ok && res.data) {
      persistDataset(res.data);
    }
  };

  // Report & Reminder Openers
  const openMemberStatementPdf = (member: KametiMember) => {
    if (!activeCommittee) return;
    const statement = buildKametiMemberStatement(
      activeCommittee,
      member,
      dataset,
      todayISO
    );
    setPdfModalTarget({ kind: 'member', statement });
  };

  const openCommitteeReportPdf = () => {
    if (!activeCommittee) return;
    const report = buildKametiCommitteeReport(activeCommittee, dataset, todayISO);
    setPdfModalTarget({ kind: 'committee', report });
  };

  const statusBadgeClass = (status: KametiInstallmentStatus) => {
    if (status === 'paid') {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
    }
    if (status === 'overdue') {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30';
    }
    if (status === 'partial') {
      return 'bg-amber-500/15 text-amber-800 dark:text-yellow-300 border border-amber-500/30';
    }
    return 'bg-slate-200/70 dark:bg-[#0E2044] text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-[#1B315E]';
  };

  return (
    <div className="space-y-4">
      {storageError && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/15 border border-rose-500/40 p-3.5 flex items-start gap-2.5 text-xs font-semibold text-rose-800 dark:text-rose-200"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{storageError}</span>
          <button
            type="button"
            onClick={() => setStorageError(null)}
            className="p-1 rounded-lg hover:bg-rose-500/20"
            aria-label={t.closeBtn}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {toastMsg && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Accounting Isolation Hint */}
      <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/25 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-cyan-900 dark:text-cyan-200">
        <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span>{t.isolationHint}</span>
      </div>

      {/* Top Committee Switcher Header */}
      <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E]">
            {(
              [
                { id: 'all', label: t.filterAll },
                { id: 'active', label: t.statuses.active },
                { id: 'completed', label: t.statuses.completed },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCommitteeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold min-h-[34px] transition-colors ${
                  committeeFilter === f.id
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="create-kameti-btn"
            onClick={openCreateCommitteeModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-extrabold min-h-[42px] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newCommitteeBtn}</span>
          </button>
        </div>

        {dataset.committees.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-dashed border-slate-300 dark:border-[#213B70] p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.noCommitteesTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t.noCommitteesBody}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredCommittees.map((c) => {
              const metrics = computeKametiCommitteeDashboard(c, dataset, todayISO);
              const isSelected = activeCommittee?.id === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? 'bg-[#040D21] border-cyan-400 text-white shadow-md'
                      : 'bg-slate-50 dark:bg-[#061026] border-slate-200 dark:border-[#1B315E] text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectCommittee(c.id)}
                      className="text-start flex-1 min-w-0 focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold truncate">
                          {c.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                            c.status === 'active'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {t.statuses[c.status]}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 tabular-nums ${
                          isSelected
                            ? 'text-cyan-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {formatKametiCurrencyPKR(c.monthlyInstallment)} ·{' '}
                        {metrics.currentMembersCount}/{c.memberCount}{' '}
                        {t.metrics.totalMembers}
                      </p>
                    </button>

                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={openEditCommitteeModal}
                          aria-label={t.editCommitteeBtn}
                          className="p-2 rounded-lg bg-[#11244D] hover:bg-[#193268] text-cyan-300"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCommitteeId(c.id)}
                          aria-label={t.deleteCommitteeBtn}
                          className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCommitteeId(c.id)}
                    className="w-full mt-2.5 text-start focus:outline-none"
                  >
                    <div className="flex items-center justify-between text-[11px] tabular-nums mb-1">
                      <span
                        className={
                          isSelected
                            ? 'text-slate-300'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        {formatKametiCurrencyPKR(metrics.totalCollected)} /{' '}
                        {formatKametiCurrencyPKR(metrics.expectedTotalCollection)}
                      </span>
                      <span className="font-bold text-cyan-500">
                        {metrics.collectionProgressPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200/30 dark:bg-[#11244D] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-yellow-400"
                        style={{
                          width: `${Math.min(100, metrics.collectionProgressPercent)}%`,
                        }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Committee Dashboard + Tabs */}
      {activeCommittee && dashboard && (
        <div className="space-y-4">
          {/* Committee Live KPI Dashboard */}
          <div className="rounded-3xl bg-[#040D21] text-white border border-[#1B315E] p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">
                  {activeCommittee.name}
                </h2>
                <p className="text-xs text-cyan-200/80 mt-0.5">
                  {t.frequencies[activeCommittee.paymentFrequency]} ·{' '}
                  {t.committeeForm.collectionDayLabel}: {activeCommittee.collectionDay}
                  {activeCommittee.description ? ` · ${activeCommittee.description}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCommitteeReportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/35 text-cyan-200 text-xs font-bold min-h-[36px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.tabs.reports}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 tabular-nums">
              <div className="rounded-2xl bg-[#0B1836] border border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-400">{t.metrics.totalMembers}</p>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {dashboard.currentMembersCount} / {dashboard.targetMemberCount}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B1836] border border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-400">
                  {t.metrics.monthlyInstallment}
                </p>
                <p className="text-base font-extrabold text-cyan-300 mt-0.5">
                  {formatKametiCurrencyPKR(dashboard.monthlyInstallment)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B1836] border border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-400">
                  {t.metrics.expectedMonthly}
                </p>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {formatKametiCurrencyPKR(dashboard.expectedMonthlyCollection)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0B1836] border border-[#1B315E] p-3">
                <p className="text-[11px] text-slate-400">{t.metrics.totalExpected}</p>
                <p className="text-base font-extrabold text-white mt-0.5">
                  {formatKametiCurrencyPKR(dashboard.expectedTotalCollection)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/30 p-3">
                <p className="text-[11px] text-emerald-200">
                  {t.metrics.totalCollected}
                </p>
                <p className="text-base font-extrabold text-emerald-300 mt-0.5">
                  {formatKametiCurrencyPKR(dashboard.totalCollected)}
                </p>
              </div>
              <div className="rounded-2xl bg-yellow-400/15 border border-yellow-400/35 p-3">
                <p className="text-[11px] text-yellow-200">
                  {t.metrics.remainingCollection}
                </p>
                <p className="text-base font-extrabold text-yellow-300 mt-0.5">
                  {formatKametiCurrencyPKR(dashboard.remainingCollection)}
                </p>
              </div>
            </div>

            {/* Installment Status Breakdown + Current Recipient */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs tabular-nums">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold">
                  {t.metrics.paidCount}: {dashboard.paidInstallmentsCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-yellow-300 font-bold">
                  {t.metrics.partialCount}: {dashboard.partialInstallmentsCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-700/60 text-slate-200 font-bold">
                  {t.metrics.unpaidCount}: {dashboard.unpaidInstallmentsCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold">
                  {t.metrics.overdueCount}: {dashboard.overdueInstallmentsCount}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1836] border border-[#1B315E]">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300">
                  {t.metrics.currentCycle} #{dashboard.currentCycleNumber}:
                </span>
                <span className="font-extrabold text-cyan-300">
                  {dashboard.currentRecipientMember
                    ? `#${dashboard.currentRecipientMember.memberNumber} ${dashboard.currentRecipientMember.name}`
                    : t.metrics.noRecipientYet}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Sub-Tabs Navigation */}
          <div className="flex overflow-x-auto gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E]">
            {(
              [
                { id: 'overview', label: t.tabs.overview },
                { id: 'members', label: `${t.tabs.members} (${memberSummaries.length})` },
                { id: 'installments', label: t.tabs.installments },
                { id: 'draws', label: `${t.tabs.draws} (${committeeDraws.length})` },
                { id: 'reports', label: t.tabs.reports },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`kameti-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-[#040D21] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#11244D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={openAddMemberModal}
                  className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-3.5 flex items-center gap-2.5 text-start hover:border-cyan-400 transition-colors min-h-[56px]"
                >
                  <span className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.memberForm.addBtn}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={memberSummaries.length === 0}
                  onClick={() => openCollectPaymentModal()}
                  className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] disabled:opacity-50 p-3.5 flex items-center gap-2.5 text-start hover:border-cyan-400 transition-colors min-h-[56px]"
                >
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.installmentsUI.collectPaymentBtn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('draws')}
                  className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-3.5 flex items-center gap-2.5 text-start hover:border-cyan-400 transition-colors min-h-[56px]"
                >
                  <span className="w-9 h-9 rounded-xl bg-yellow-400/20 text-amber-700 dark:text-yellow-300 flex items-center justify-center shrink-0">
                    <Dices className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.drawsUI.randomDrawTitle}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openCommitteeReportPdf}
                  className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-3.5 flex items-center gap-2.5 text-start hover:border-cyan-400 transition-colors min-h-[56px]"
                >
                  <span className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.reportsUI.previewCommitteePdfBtn}
                  </span>
                </button>
              </div>

              {/* Member Progress List */}
              <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t.reportsUI.pdf.membersHeading} ({memberSummaries.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('members')}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400"
                  >
                    {t.tabs.members}
                  </button>
                </div>

                {memberSummaries.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.memberForm.emptyBody}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memberSummaries.map((ms) => (
                      <div
                        key={ms.member.id}
                        className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            #{ms.member.memberNumber} {ms.member.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ms.effectiveTurnNumber
                              ? `${t.drawsUI.turnLabel}: #${ms.effectiveTurnNumber}`
                              : t.metrics.noRecipientYet}
                            {ms.overdueCount > 0
                              ? ` · ${ms.overdueCount} ${t.installmentStatuses.overdue}`
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-end">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatKametiCurrencyPKR(ms.totalPaid)}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.installmentsUI.remainingLabel}:{' '}
                              {formatKametiCurrencyPKR(ms.outstandingAmount)}
                            </p>
                          </div>
                          {ms.nextDueInstallment && (
                            <button
                              type="button"
                              onClick={() =>
                                openCollectPaymentModal(
                                  ms.member.id,
                                  ms.nextDueInstallment!.installment.id
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-[#040D21] text-[11px] font-extrabold min-h-[32px]"
                            >
                              {t.installmentsUI.collectPaymentBtn}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t.memberForm.nameLabel}
                    className="w-full h-11 ps-10 pe-4 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <button
                  type="button"
                  data-testid="add-kameti-member-btn"
                  onClick={openAddMemberModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs sm:text-sm font-extrabold min-h-[44px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.memberForm.addBtn}</span>
                </button>
              </div>

              {filteredMemberSummaries.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-2">
                  <Users className="w-8 h-8 text-cyan-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.memberForm.emptyTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {t.memberForm.emptyBody}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredMemberSummaries.map((ms) => (
                    <div
                      key={ms.member.id}
                      className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-[#040D21] text-cyan-300 text-xs font-extrabold tabular-nums">
                              #{ms.member.memberNumber}
                            </span>
                            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                              {ms.member.name}
                            </h4>
                            {ms.effectiveTurnNumber && (
                              <span className="px-2 py-0.5 rounded-lg bg-yellow-400/20 text-amber-800 dark:text-yellow-300 text-[11px] font-bold">
                                {t.drawsUI.turnLabel} #{ms.effectiveTurnNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            {ms.member.phone && (
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Phone className="w-3.5 h-3.5" />
                                {ms.member.phone}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3.5 h-3.5" />
                              {ms.member.joiningDate}
                            </span>
                            {ms.member.address && <span>{ms.member.address}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditMemberModal(ms.member)}
                            aria-label={t.memberForm.editTitle}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-cyan-300 min-w-[38px] min-h-[38px] flex items-center justify-center"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestRemoveMember(ms.member)}
                            aria-label={t.memberForm.removeBtn}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 min-w-[38px] min-h-[38px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs tabular-nums">
                        <div className="rounded-xl bg-slate-50 dark:bg-[#061026] p-2.5">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.installmentsUI.expectedLabel}
                          </p>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                            {formatKametiCurrencyPKR(ms.totalExpected)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/10 p-2.5">
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            {t.installmentsUI.paidLabel}
                          </p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                            {formatKametiCurrencyPKR(ms.totalPaid)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-amber-500/10 p-2.5">
                          <p className="text-[11px] text-amber-800 dark:text-yellow-300">
                            {t.installmentsUI.remainingLabel}
                          </p>
                          <p className="font-bold text-amber-900 dark:text-yellow-200 mt-0.5">
                            {formatKametiCurrencyPKR(ms.outstandingAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ms.nextDueInstallment && (
                          <button
                            type="button"
                            onClick={() =>
                              openCollectPaymentModal(
                                ms.member.id,
                                ms.nextDueInstallment!.installment.id
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 text-[#040D21] text-xs font-extrabold min-h-[38px]"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>{t.installmentsUI.collectPaymentBtn}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openMemberStatementPdf(ms.member)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-slate-800 dark:text-cyan-300 text-xs font-bold min-h-[38px]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t.reportsUI.memberStatementBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderMemberId(ms.member.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[38px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{t.reportsUI.whatsappReminderBtn}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSTALLMENTS & PAYMENT COLLECTION */}
          {activeTab === 'installments' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <select
                      aria-label={t.installmentsUI.filterByMember}
                      value={insMemberFilter}
                      onChange={(e) => setInsMemberFilter(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-xs font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="all">
                        {t.installmentsUI.allMembersOption}
                      </option>
                      {memberSummaries.map((ms) => (
                        <option key={ms.member.id} value={ms.member.id}>
                          #{ms.member.memberNumber} {ms.member.name}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          { id: 'all', label: t.filterAll },
                          { id: 'overdue', label: t.installmentStatuses.overdue },
                          { id: 'partial', label: t.installmentStatuses.partial },
                          { id: 'unpaid', label: t.installmentStatuses.unpaid },
                          { id: 'paid', label: t.installmentStatuses.paid },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setInsStatusFilter(st.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold min-h-[34px] ${
                            insStatusFilter === st.id
                              ? 'bg-cyan-500 text-[#040D21]'
                              : 'bg-slate-100 dark:bg-[#061026] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="collect-kameti-payment-btn"
                    disabled={memberSummaries.length === 0}
                    onClick={() =>
                      openCollectPaymentModal(
                        insMemberFilter !== 'all' ? insMemberFilter : undefined
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-[#040D21] text-xs font-extrabold min-h-[40px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.installmentsUI.collectPaymentBtn}</span>
                  </button>
                </div>

                {filteredInstallmentViews.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                    {t.installmentsUI.emptyBody}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredInstallmentViews.map((v) => {
                      const mem = committeeMembersById.get(v.installment.memberId);
                      return (
                        <div
                          key={v.installment.id}
                          className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {t.installmentsUI.cycleLabel} #{v.installment.cycleNumber}
                              </span>
                              <span className="font-bold text-cyan-700 dark:text-cyan-300">
                                {mem ? `#${mem.memberNumber} ${mem.name}` : 'Member'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusBadgeClass(
                                  v.status
                                )}`}
                              >
                                {t.installmentStatuses[v.status]}
                                {v.status === 'overdue' && v.isPartiallyPaid
                                  ? ` (${t.installmentStatuses.partial})`
                                  : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {t.installmentsUI.dueLabel}: {v.installment.dueDate}
                              {v.latestPaymentDate
                                ? ` · ${t.installmentsUI.paidLabel}: ${v.latestPaymentDate} (${
                                    v.latestPaymentMethod
                                      ? t.paymentMethods[v.latestPaymentMethod]
                                      : ''
                                  })`
                                : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="text-end">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {formatKametiCurrencyPKR(v.paidAmount)} /{' '}
                                {formatKametiCurrencyPKR(v.installment.expectedAmount)}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {t.installmentsUI.remainingLabel}:{' '}
                                {formatKametiCurrencyPKR(v.remainingAmount)}
                              </p>
                            </div>
                            {v.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() =>
                                  openCollectPaymentModal(
                                    v.installment.memberId,
                                    v.installment.id
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs font-extrabold min-h-[34px]"
                              >
                                {t.installmentsUI.collectPaymentBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Payment History Log */}
              <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.installmentsUI.paymentHistoryHeading} ({committeePayments.length})
                </h3>
                {committeePayments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.installmentsUI.noPaymentsYet}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {committeePayments.map((p) => {
                      const mem = committeeMembersById.get(p.memberId);
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 flex items-center justify-between gap-2 text-xs tabular-nums"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {mem ? `#${mem.memberNumber} ${mem.name}` : 'Member'}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.paymentDate} · {t.paymentMethods[p.paymentMethod]}
                              {p.note ? ` · ${p.note}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatKametiCurrencyPKR(p.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRemovePaymentId(p.id)}
                              aria-label={t.deleteBtn}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DRAW / PARCHI MANAGEMENT */}
          {activeTab === 'draws' && (
            <div className="space-y-4">
              {drawError && (
                <div
                  role="alert"
                  className="rounded-2xl bg-rose-500/15 border border-rose-500/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-200"
                >
                  {drawError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {/* Interactive Spin Wheel (Parchi) Card */}
                <KametiDrawWheel
                  eligibleMembers={eligibleDrawMembers}
                  nextTurnNumber={availableTurnNumbers[0] ?? null}
                  t={t}
                  onPickRandomWinner={handlePickRandomMemberForWheel}
                  onConfirmWinner={handleConfirmWheelWinner}
                />

                {/* Manual Turn Assignment Card */}
                <form
                  onSubmit={handleRequestManualDraw}
                  className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 sm:p-5 space-y-3"
                >
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t.drawsUI.manualAssignTitle}
                  </h3>

                  {eligibleDrawMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.drawsUI.noEligibleMsg}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="space-y-1">
                          <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {t.drawsUI.selectMemberLabel}
                          </span>
                          <select
                            value={drawMemberId || eligibleDrawMembers[0]?.id || ''}
                            onChange={(e) => setDrawMemberId(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            {eligibleDrawMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                #{m.memberNumber} {m.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-1">
                          <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {t.drawsUI.selectTurnLabel}
                          </span>
                          <select
                            value={
                              drawTurnNumber || String(availableTurnNumbers[0] || '')
                            }
                            onChange={(e) => setDrawTurnNumber(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            {availableTurnNumbers.map((tn) => (
                              <option key={tn} value={tn}>
                                #{tn}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="space-y-1">
                          <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {t.drawsUI.payoutDateLabel}
                          </span>
                          <input
                            type="date"
                            value={drawPayoutDate}
                            onChange={(e) => setDrawPayoutDate(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {t.drawsUI.payoutAmountLabel}
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={
                              drawPayoutAmount || String(getDefaultPayoutAmount())
                            }
                            onChange={(e) => setDrawPayoutAmount(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </label>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={drawCompleted}
                          onChange={(e) => setDrawCompleted(e.target.checked)}
                          className="w-4 h-4 rounded accent-cyan-500"
                        />
                        <span>{t.drawsUI.markCompletedLabel}</span>
                      </label>

                      <input
                        type="text"
                        value={drawNotes}
                        onChange={(e) => setDrawNotes(e.target.value)}
                        placeholder={t.drawsUI.notesPlaceholder}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs text-slate-900 dark:text-white"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs font-extrabold min-h-[42px]"
                      >
                        {t.drawsUI.manualAssignBtn}
                      </button>
                    </>
                  )}
                </form>
              </div>

              {/* Draw / Parchi History */}
              <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.drawsUI.historyHeading} ({committeeDraws.length})
                </h3>
                {committeeDraws.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.drawsUI.noDrawsYet}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {committeeDraws.map((dr) => {
                      const mem = committeeMembersById.get(dr.memberId);
                      return (
                        <div
                          key={dr.id}
                          className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[#040D21] text-yellow-300 font-extrabold">
                                #{dr.turnNumber}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {mem ? `#${mem.memberNumber} ${mem.name}` : 'Member'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                                {dr.drawMode === 'random'
                                  ? t.drawsUI.modeRandomBadge
                                  : t.drawsUI.modeManualBadge}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  dr.isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-800 dark:text-yellow-300'
                                }`}
                              >
                                {dr.isCompleted
                                  ? t.drawsUI.completedBadge
                                  : t.drawsUI.scheduledBadge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {dr.payoutDate}
                              {dr.notes ? ` · ${dr.notes}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {formatKametiCurrencyPKR(dr.payoutAmount)}
                            </span>
                            {!dr.isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleMarkDrawDone(dr.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                              >
                                {t.drawsUI.markPayoutDoneBtn}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS & PDF */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-[#040D21] text-white border border-cyan-500/35 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <h3 className="text-base font-extrabold">
                    {t.reportsUI.committeeReportTitle}
                  </h3>
                  <p className="text-xs text-cyan-200/85 leading-relaxed">
                    {t.reportsUI.committeeReportSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="open-committee-report-pdf-btn"
                  onClick={openCommitteeReportPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-extrabold min-h-[44px]"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.reportsUI.previewCommitteePdfBtn}</span>
                </button>
              </div>

              <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-2.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.reportsUI.memberStatementBtn} & WhatsApp ({memberSummaries.length})
                </h3>
                {memberSummaries.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.memberForm.emptyBody}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {memberSummaries.map((ms) => (
                      <div
                        key={ms.member.id}
                        className="rounded-2xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] p-3 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            #{ms.member.memberNumber} {ms.member.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t.installmentsUI.paidLabel}:{' '}
                            {formatKametiCurrencyPKR(ms.totalPaid)} ·{' '}
                            {t.installmentsUI.remainingLabel}:{' '}
                            {formatKametiCurrencyPKR(ms.outstandingAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openMemberStatementPdf(ms.member)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500 text-[#040D21] font-bold min-h-[36px]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t.reportsUI.memberStatementBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReminderMemberId(ms.member.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold min-h-[36px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{t.reportsUI.whatsappReminderBtn}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create / Edit Kameti Committee */}
      {committeeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveCommittee}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-3.5 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingCommitteeId
                  ? t.committeeForm.editTitle
                  : t.committeeForm.addTitle}
              </h3>
              <button
                type="button"
                onClick={() => setCommitteeModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {committeeFormError && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                {committeeFormError}
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.committeeForm.nameLabel}
              </span>
              <input
                type="text"
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder={t.committeeForm.namePlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.monthlyAmountLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={cMonthlyAmount}
                  onChange={(e) => setCMonthlyAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.memberCountLabel}
                </span>
                <input
                  type="number"
                  min="2"
                  step="1"
                  required
                  value={cMemberCount}
                  onChange={(e) => setCMemberCount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.durationLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={cDuration}
                  onChange={(e) => setCDuration(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.collectionDayLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  required
                  value={cCollectionDay}
                  onChange={(e) => setCCollectionDay(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.startDateLabel}
                </span>
                <input
                  type="date"
                  required
                  value={cStartDate}
                  onChange={(e) => setCStartDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.frequencyLabel}
                </span>
                <select
                  value={cFrequency}
                  onChange={(e) =>
                    setCFrequency(e.target.value as KametiPaymentFrequency)
                  }
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="monthly">{t.frequencies.monthly}</option>
                  <option value="biweekly">{t.frequencies.biweekly}</option>
                  <option value="weekly">{t.frequencies.weekly}</option>
                </select>
              </label>
            </div>

            {editingCommitteeId && (
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.committeeForm.statusLabel}
                </span>
                <select
                  value={cStatus}
                  onChange={(e) => setCStatus(e.target.value as KametiStatus)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <option value="active">{t.statuses.active}</option>
                  <option value="completed">{t.statuses.completed}</option>
                </select>
              </label>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.committeeForm.descriptionLabel}
              </span>
              <input
                type="text"
                value={cDescription}
                onChange={(e) => setCDescription(e.target.value)}
                placeholder={t.committeeForm.descriptionPlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
              />
            </label>

            {/* Auto-calculated Expected Collection Preview */}
            <div className="rounded-2xl bg-[#040D21] border border-cyan-500/35 p-3.5 space-y-1.5 text-xs tabular-nums">
              <p className="font-bold text-cyan-300">
                {t.committeeForm.autoPreviewHeading}
              </p>
              <div className="flex justify-between text-slate-300">
                <span>{t.metrics.expectedMonthly}:</span>
                <strong className="text-white">
                  {formatKametiCurrencyPKR(previewCollections.expectedMonthlyCollection)}
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{t.metrics.totalExpected}:</span>
                <strong className="text-yellow-300">
                  {formatKametiCurrencyPKR(previewCollections.expectedTotalCollection)}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCommitteeModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-extrabold min-h-[44px]"
              >
                {editingCommitteeId
                  ? t.committeeForm.updateBtn
                  : t.committeeForm.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add / Edit Member */}
      {memberModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveMember}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-3.5 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingMemberId ? t.memberForm.editTitle : t.memberForm.addTitle}
              </h3>
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {memberFormError && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                {memberFormError}
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.memberForm.nameLabel}
              </span>
              <input
                type="text"
                required
                value={mName}
                onChange={(e) => setMName(e.target.value)}
                placeholder={t.memberForm.namePlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.memberForm.phoneLabel}
                </span>
                <input
                  type="tel"
                  value={mPhone}
                  onChange={(e) => setMPhone(e.target.value)}
                  placeholder={t.memberForm.phonePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.memberForm.memberNumberLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={mNumber}
                  onChange={(e) => setMNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.memberForm.joiningDateLabel}
                </span>
                <input
                  type="date"
                  required
                  value={mJoiningDate}
                  onChange={(e) => setMJoiningDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.memberForm.turnNumberLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={mTurnNumber}
                  onChange={(e) => setMTurnNumber(e.target.value)}
                  placeholder={t.memberForm.turnOptionalPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.memberForm.addressLabel}
              </span>
              <input
                type="text"
                value={mAddress}
                onChange={(e) => setMAddress(e.target.value)}
                placeholder={t.memberForm.addressPlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-extrabold min-h-[44px]"
              >
                {editingMemberId ? t.memberForm.updateBtn : t.memberForm.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Collect Installment Payment */}
      {payModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSubmitPayment}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-3.5 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.installmentsUI.paymentModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                {payError}
              </p>
            )}

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.installmentsUI.selectMemberLabel}
              </span>
              <select
                value={payMemberId}
                onChange={(e) => handlePayMemberChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm font-semibold text-slate-900 dark:text-white"
              >
                {memberSummaries.map((ms) => (
                  <option key={ms.member.id} value={ms.member.id}>
                    #{ms.member.memberNumber} {ms.member.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.installmentsUI.selectInstallmentLabel}
              </span>
              <select
                value={payInstallmentId}
                onChange={(e) => handlePayInstallmentChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
              >
                {committeeInstallmentViews
                  .filter((v) => v.installment.memberId === payMemberId)
                  .map((v) => (
                    <option
                      key={v.installment.id}
                      value={v.installment.id}
                      disabled={v.status === 'paid'}
                    >
                      #{v.installment.cycleNumber} ({v.installment.dueDate}) —{' '}
                      {t.installmentsUI.remainingLabel}:{' '}
                      {formatKametiCurrencyPKR(v.remainingAmount)} (
                      {t.installmentStatuses[v.status]})
                    </option>
                  ))}
              </select>
            </label>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.installmentsUI.amountLabel}
                </span>
                {selectedPayInstallmentView && (
                  <button
                    type="button"
                    onClick={() =>
                      setPayAmount(String(selectedPayInstallmentView.remainingAmount))
                    }
                    className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400"
                  >
                    {t.installmentsUI.fillRemainingBtn}:{' '}
                    {formatKametiCurrencyPKR(selectedPayInstallmentView.remainingAmount)}
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.installmentsUI.dateLabel}
                </span>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.installmentsUI.paymentMethodLabel}
                </span>
                <select
                  value={payMethod}
                  onChange={(e) =>
                    setPayMethod(e.target.value as KametiPaymentMethod)
                  }
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {t.paymentMethods[pm]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t.installmentsUI.noteLabel}
              </span>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder={t.installmentsUI.notePlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#213B70] text-sm text-slate-900 dark:text-white"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-extrabold min-h-[44px]"
              >
                {t.installmentsUI.savePaymentBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Draw / Parchi Confirmation */}
      {pendingDrawConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="draw-confirm-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-cyan-500/35 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {pendingDrawConfirm.mode === 'random'
                  ? t.drawsUI.confirmRandomTitle
                  : t.drawsUI.confirmModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPendingDrawConfirm(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#11244D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#040D21] text-white border border-cyan-500/35 p-4 space-y-2 tabular-nums">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-200">{t.drawsUI.winnerLabel}:</span>
                <strong className="text-yellow-300 text-sm">
                  #{pendingDrawConfirm.member.memberNumber}{' '}
                  {pendingDrawConfirm.member.name}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-200">{t.drawsUI.turnLabel}:</span>
                <strong>#{pendingDrawConfirm.turnNumber}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-200">{t.drawsUI.payoutLabel}:</span>
                <strong>
                  {formatKametiCurrencyPKR(pendingDrawConfirm.payoutAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-cyan-200">{t.drawsUI.payoutDateLabel}:</span>
                <strong>{pendingDrawConfirm.payoutDate}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.drawsUI.confirmModalHint}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPendingDrawConfirm(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-xs font-bold min-h-[42px]"
              >
                {t.cancelBtn}
              </button>
              {pendingDrawConfirm.mode === 'random' &&
                eligibleDrawMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={handleTriggerRandomDraw}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[42px]"
                  >
                    {t.drawsUI.redrawBtn}
                  </button>
                )}
              <button
                type="button"
                data-testid="confirm-save-draw-btn"
                onClick={handleConfirmSaveDraw}
                className="flex-1 py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs sm:text-sm font-extrabold min-h-[42px]"
              >
                {t.drawsUI.confirmSaveDrawBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Safe Member Removal Confirmation */}
      {removeMemberTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t.memberForm.confirmRemoveTitle} (#{removeMemberTarget.member.memberNumber}{' '}
              {removeMemberTarget.member.name})
            </h3>
            {removeMemberTarget.hasFinancialHistory ? (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-3.5 space-y-2 text-xs text-rose-800 dark:text-rose-200">
                <p className="font-bold leading-relaxed">
                  {t.memberForm.confirmRemoveHistoryWarning}
                </p>
                <p className="tabular-nums font-semibold">
                  {t.memberForm.paymentsRecordedLabel}:{' '}
                  {removeMemberTarget.paymentsCount} (
                  {formatKametiCurrencyPKR(removeMemberTarget.totalPaid)}) ·{' '}
                  {t.memberForm.drawsRecordedLabel}: {removeMemberTarget.drawsCount}
                </p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {t.memberForm.confirmRemoveSimpleBody}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRemoveMemberTarget(null)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={confirmRemoveMember}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold min-h-[44px]"
              >
                {removeMemberTarget.hasFinancialHistory
                  ? t.memberForm.confirmForceRemoveBtn
                  : t.memberForm.removeBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Committee Confirmation */}
      {deleteCommitteeId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t.confirmDeleteCommitteeTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.confirmDeleteCommitteeBody}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteCommitteeId(null)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCommittee}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold min-h-[44px]"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Remove Payment Confirmation */}
      {removePaymentId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#020817]/80 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t.installmentsUI.removePaymentTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.installmentsUI.removePaymentBody}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRemovePaymentId(null)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-200 text-sm font-bold min-h-[44px]"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={confirmRemovePayment}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold min-h-[44px]"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Statement / Committee Report Modal */}
      <KametiPdfModal
        open={pdfModalTarget !== null}
        target={pdfModalTarget}
        language={language}
        t={t}
        onClose={() => setPdfModalTarget(null)}
      />

      {/* WhatsApp Reminder Modal */}
      <KametiReminderModal
        open={reminderMemberId !== null && reminderStatement !== null}
        statement={reminderStatement}
        language={language}
        t={t}
        onClose={() => setReminderMemberId(null)}
      />
    </div>
  );
};
