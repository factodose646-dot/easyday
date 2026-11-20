import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Share2,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import { shareAndroidText } from '../../utils/androidBridge';
import {
  generateId,
  getCurrentMonthISO,
  getTodayISO,
  UdhaarContact,
  UdhaarDirection,
  UdhaarPayment,
  udhaarStorage,
  UdhaarTransaction,
} from '../../utils/storage';
import {
  buildWhatsAppUrl,
  computeContactSummaries,
  computeUdhaarDashboard,
  computeUdhaarMonthlySummary,
  formatPKR,
  formatWhatsAppAccountStatement,
  formatWhatsAppTransactionDetail,
  getTransactionPaidAmount,
  getTransactionRemaining,
  getTransactionStatus,
  roundCurrency,
  UdhaarStatus,
} from '../../utils/udhaarEngine';

interface UdhaarManagerToolProps {
  language: Language;
  t: ToolTranslationBundle['udhaar'];
}

type ActiveSubTab = 'people' | 'transactions' | 'summary';
type DirectionFilter = 'all' | UdhaarDirection;
type StatusFilter = 'all' | UdhaarStatus;

type DeleteConfirmTarget =
  | { kind: 'person'; contactId: string; label: string }
  | { kind: 'entry'; txId: string; label: string }
  | { kind: 'payment'; txId: string; paymentId: string; label: string };

export const UdhaarManagerTool: React.FC<UdhaarManagerToolProps> = ({
  language,
  t,
}) => {
  const [contacts, setContacts] = useState<UdhaarContact[]>(() =>
    udhaarStorage.loadContacts()
  );
  const [transactions, setTransactions] = useState<UdhaarTransaction[]>(() =>
    udhaarStorage.loadTransactions()
  );

  const [subTab, setSubTab] = useState<ActiveSubTab>('people');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [summaryMonth, setSummaryMonth] = useState<string>(() =>
    getCurrentMonthISO()
  );
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  // Person Add/Edit modal
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [personError, setPersonError] = useState<string | null>(null);

  // Entry Add/Edit modal
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryContactId, setEntryContactId] = useState<string>('');
  const [quickNewPersonMode, setQuickNewPersonMode] = useState(false);
  const [quickPersonName, setQuickPersonName] = useState('');
  const [quickPersonPhone, setQuickPersonPhone] = useState('');
  const [entryDirection, setEntryDirection] = useState<UdhaarDirection>('given');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(() => getTodayISO());
  const [entryDueDate, setEntryDueDate] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [entryError, setEntryError] = useState<string | null>(null);

  // Payment modal
  const [paymentModalTxId, setPaymentModalTxId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => getTodayISO());
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Expanded payment logs in list
  const [expandedPaymentTxIds, setExpandedPaymentTxIds] = useState<Record<string, boolean>>({});

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmTarget | null>(null);

  const persistContacts = (next: UdhaarContact[]) => {
    setContacts(next);
    udhaarStorage.saveContacts(next);
  };

  const persistTransactions = (next: UdhaarTransaction[]) => {
    setTransactions(next);
    udhaarStorage.saveTransactions(next);
  };

  const contactById = useMemo(() => {
    const map = new Map<string, UdhaarContact>();
    for (const c of contacts) map.set(c.id, c);
    return map;
  }, [contacts]);

  const dashboard = useMemo(
    () => computeUdhaarDashboard(transactions),
    [transactions]
  );

  const monthlySummary = useMemo(
    () => computeUdhaarMonthlySummary(transactions, summaryMonth),
    [transactions, summaryMonth]
  );

  const contactSummaries = useMemo(
    () => computeContactSummaries(contacts, transactions),
    [contacts, transactions]
  );

  const filteredContactSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contactSummaries.filter((summary) => {
      if (q) {
        const matchesName = summary.contact.name.toLowerCase().includes(q);
        const matchesPhone = summary.contact.phone.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      if (directionFilter === 'given' && summary.givenRemaining <= 0) return false;
      if (directionFilter === 'borrowed' && summary.borrowedRemaining <= 0)
        return false;
      if (statusFilter === 'paid' && summary.activeCount > 0) return false;
      if (
        (statusFilter === 'pending' || statusFilter === 'partial') &&
        summary.activeCount === 0
      ) {
        return false;
      }
      return true;
    });
  }, [contactSummaries, searchQuery, directionFilter, statusFilter]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (selectedContactId && tx.contactId !== selectedContactId) return false;
        if (directionFilter !== 'all' && tx.direction !== directionFilter)
          return false;
        const status = getTransactionStatus(tx);
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (q) {
          const contact = contactById.get(tx.contactId);
          const matchPerson =
            contact?.name.toLowerCase().includes(q) ||
            contact?.phone.toLowerCase().includes(q);
          const matchDesc = tx.description.toLowerCase().includes(q);
          if (!matchPerson && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [
    transactions,
    selectedContactId,
    directionFilter,
    statusFilter,
    searchQuery,
    contactById,
  ]);

  const activeContact = useMemo(
    () =>
      selectedContactId
        ? contacts.find((c) => c.id === selectedContactId) ?? null
        : null,
    [contacts, selectedContactId]
  );

  const activeContactSummary = useMemo(
    () =>
      selectedContactId
        ? contactSummaries.find((s) => s.contact.id === selectedContactId) ?? null
        : null,
    [contactSummaries, selectedContactId]
  );

  const paymentTargetTx = useMemo(
    () =>
      paymentModalTxId
        ? transactions.find((tx) => tx.id === paymentModalTxId) ?? null
        : null,
    [transactions, paymentModalTxId]
  );

  // Handlers
  const openAddPersonModal = () => {
    setEditingPersonId(null);
    setPersonName('');
    setPersonPhone('');
    setPersonError(null);
    setPersonModalOpen(true);
  };

  const openEditPersonModal = (contact: UdhaarContact) => {
    setEditingPersonId(contact.id);
    setPersonName(contact.name);
    setPersonPhone(contact.phone);
    setPersonError(null);
    setPersonModalOpen(true);
  };

  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = personName.trim();
    if (!trimmedName) {
      setPersonError(t.errors.emptyName);
      return;
    }
    const now = Date.now();
    if (editingPersonId) {
      persistContacts(
        contacts.map((c) =>
          c.id === editingPersonId
            ? { ...c, name: trimmedName, phone: personPhone.trim(), updatedAt: now }
            : c
        )
      );
    } else {
      const created: UdhaarContact = {
        id: generateId('ucon'),
        name: trimmedName,
        phone: personPhone.trim(),
        createdAt: now,
        updatedAt: now,
      };
      persistContacts([created, ...contacts]);
    }
    setPersonModalOpen(false);
  };

  const openAddEntryModal = (presetContactId?: string) => {
    setEditingEntryId(null);
    const defaultContact = presetContactId || selectedContactId || contacts[0]?.id || '';
    setEntryContactId(defaultContact);
    setQuickNewPersonMode(contacts.length === 0 && !presetContactId);
    setQuickPersonName('');
    setQuickPersonPhone('');
    setEntryDirection('given');
    setEntryAmount('');
    setEntryDate(getTodayISO());
    setEntryDueDate('');
    setEntryDescription('');
    setEntryError(null);
    setEntryModalOpen(true);
  };

  const openEditEntryModal = (tx: UdhaarTransaction) => {
    setEditingEntryId(tx.id);
    setEntryContactId(tx.contactId);
    setQuickNewPersonMode(false);
    setQuickPersonName('');
    setQuickPersonPhone('');
    setEntryDirection(tx.direction);
    setEntryAmount(String(tx.amount));
    setEntryDate(tx.date);
    setEntryDueDate(tx.dueDate || '');
    setEntryDescription(tx.description);
    setEntryError(null);
    setEntryModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(entryAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setEntryError(t.errors.invalidAmount);
      return;
    }
    if (!entryDate) {
      setEntryError(t.errors.invalidDate);
      return;
    }

    let resolvedContactId = entryContactId;
    let nextContacts = contacts;
    const now = Date.now();

    if (quickNewPersonMode) {
      const name = quickPersonName.trim();
      if (!name) {
        setEntryError(t.errors.emptyName);
        return;
      }
      const newContact: UdhaarContact = {
        id: generateId('ucon'),
        name,
        phone: quickPersonPhone.trim(),
        createdAt: now,
        updatedAt: now,
      };
      nextContacts = [newContact, ...contacts];
      resolvedContactId = newContact.id;
    } else if (!resolvedContactId) {
      setEntryError(t.errors.selectPerson);
      return;
    }

    const roundedAmount = roundCurrency(numericAmount);
    if (editingEntryId) {
      const nextTxs = transactions.map((tx) => {
        if (tx.id !== editingEntryId) return tx;
        const paid = getTransactionPaidAmount(tx);
        return {
          ...tx,
          contactId: resolvedContactId,
          direction: entryDirection,
          amount: roundedAmount,
          paidAmount: Math.min(paid, roundedAmount),
          date: entryDate,
          dueDate: entryDueDate.trim() || undefined,
          description: entryDescription.trim(),
          updatedAt: now,
        };
      });
      persistContacts(nextContacts);
      persistTransactions(nextTxs);
    } else {
      const createdTx: UdhaarTransaction = {
        id: generateId('utx'),
        contactId: resolvedContactId,
        direction: entryDirection,
        amount: roundedAmount,
        paidAmount: 0,
        date: entryDate,
        dueDate: entryDueDate.trim() || undefined,
        description: entryDescription.trim(),
        payments: [],
        createdAt: now,
        updatedAt: now,
      };
      persistContacts(
        nextContacts.map((c) =>
          c.id === resolvedContactId ? { ...c, updatedAt: now } : c
        )
      );
      persistTransactions([createdTx, ...transactions]);
    }

    setEntryModalOpen(false);
  };

  const openPaymentModal = (tx: UdhaarTransaction) => {
    const remaining = getTransactionRemaining(tx);
    setPaymentModalTxId(tx.id);
    setPaymentAmount(String(remaining));
    setPaymentDate(getTodayISO());
    setPaymentNote('');
    setPaymentError(null);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetTx) return;
    const numericPay = roundCurrency(Number(paymentAmount));
    const remaining = getTransactionRemaining(paymentTargetTx);
    if (!Number.isFinite(numericPay) || numericPay <= 0) {
      setPaymentError(t.errors.invalidAmount);
      return;
    }
    if (numericPay > remaining + 0.009) {
      setPaymentError(t.errors.paymentExceedsRemaining);
      return;
    }
    if (!paymentDate) {
      setPaymentError(t.errors.invalidDate);
      return;
    }

    const now = Date.now();
    const newPayment: UdhaarPayment = {
      id: generateId('upay'),
      amount: Math.min(numericPay, remaining),
      date: paymentDate,
      note: paymentNote.trim(),
      createdAt: now,
    };

    const nextTxs = transactions.map((tx) => {
      if (tx.id !== paymentTargetTx.id) return tx;
      const updatedPayments = [newPayment, ...tx.payments];
      const totalPaid = roundCurrency(
        updatedPayments.reduce((s, p) => s + p.amount, 0)
      );
      return {
        ...tx,
        payments: updatedPayments,
        paidAmount: Math.min(tx.amount, totalPaid),
        updatedAt: now,
      };
    });

    persistTransactions(nextTxs);
    setPaymentModalTxId(null);
  };

  const handleMarkFullyPaid = (tx: UdhaarTransaction) => {
    const remaining = getTransactionRemaining(tx);
    if (remaining <= 0) return;
    const now = Date.now();
    const fullPayment: UdhaarPayment = {
      id: generateId('upay'),
      amount: remaining,
      date: getTodayISO(),
      note: t.statusPaid,
      createdAt: now,
    };

    persistTransactions(
      transactions.map((item) => {
        if (item.id !== tx.id) return item;
        return {
          ...item,
          payments: [fullPayment, ...item.payments],
          paidAmount: item.amount,
          updatedAt: now,
        };
      })
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'person') {
      persistContacts(contacts.filter((c) => c.id !== deleteTarget.contactId));
      persistTransactions(
        transactions.filter((tx) => tx.contactId !== deleteTarget.contactId)
      );
      if (selectedContactId === deleteTarget.contactId) {
        setSelectedContactId(null);
      }
    } else if (deleteTarget.kind === 'entry') {
      persistTransactions(transactions.filter((tx) => tx.id !== deleteTarget.txId));
    } else if (deleteTarget.kind === 'payment') {
      const now = Date.now();
      persistTransactions(
        transactions.map((tx) => {
          if (tx.id !== deleteTarget.txId) return tx;
          const remainingPayments = tx.payments.filter(
            (p) => p.id !== deleteTarget.paymentId
          );
          const totalPaid = roundCurrency(
            remainingPayments.reduce((s, p) => s + p.amount, 0)
          );
          return {
            ...tx,
            payments: remainingPayments,
            paidAmount: Math.min(tx.amount, totalPaid),
            updatedAt: now,
          };
        })
      );
    }
    setDeleteTarget(null);
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBanner(t.copiedFeedback);
      window.setTimeout(() => setCopiedBanner(null), 2200);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleNativeShareText = async (text: string, title: string) => {
    const shared = await shareAndroidText(text, title);
    if (!shared) {
      await handleCopyText(text);
    }
  };

  const renderStatusIndicator = (status: UdhaarStatus) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{t.statusPaid}</span>
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-yellow-300">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{t.statusPartial}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{t.statusPending}</span>
      </span>
    );
  };

  const renderTransactionCard = (tx: UdhaarTransaction, showPersonName = true) => {
    const contact = contactById.get(tx.contactId);
    const paid = getTransactionPaidAmount(tx);
    const remaining = getTransactionRemaining(tx);
    const status = getTransactionStatus(tx);
    const progressPct =
      tx.amount > 0 ? Math.min(100, Math.round((paid / tx.amount) * 100)) : 0;
    const isExpanded = Boolean(expandedPaymentTxIds[tx.id]);
    const shareText = formatWhatsAppTransactionDetail(contact, tx, language);
    const waUrl = buildWhatsAppUrl(contact?.phone || '', shareText);

    return (
      <article
        key={tx.id}
        className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                tx.direction === 'given'
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-yellow-300'
              }`}
            >
              {tx.direction === 'given' ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownLeft className="w-5 h-5" />
              )}
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {showPersonName && (
                  <button
                    type="button"
                    onClick={() => {
                      if (contact) {
                        setSelectedContactId(contact.id);
                        setSubTab('people');
                      }
                    }}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 truncate"
                  >
                    {contact?.name || 'Unknown'}
                  </button>
                )}
                {renderStatusIndicator(status)}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {tx.description || (tx.direction === 'given' ? t.filterGiven : t.filterBorrowed)}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>
                  {tx.direction === 'given' ? t.givenSubLabel : t.borrowedSubLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{tx.date}</span>
                {tx.dueDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.dueDateLabel}: {tx.dueDate}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-end shrink-0 tabular-nums">
            <p
              className={`text-base font-extrabold ${
                status === 'paid'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : tx.direction === 'given'
                    ? 'text-cyan-700 dark:text-cyan-300'
                    : 'text-amber-700 dark:text-yellow-300'
              }`}
            >
              {formatPKR(remaining > 0 ? remaining : tx.amount)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.totalAmountLabel}: {formatPKR(tx.amount)} · {t.paidSoFarLabel}:{' '}
              {formatPKR(paid)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#061026] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                status === 'paid'
                  ? 'bg-emerald-500'
                  : tx.direction === 'given'
                    ? 'bg-cyan-500'
                    : 'bg-yellow-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1B315E]">
          <div className="flex flex-wrap items-center gap-1.5">
            {status !== 'paid' && (
              <>
                <button
                  type="button"
                  onClick={() => openPaymentModal(tx)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-xs font-bold min-h-[38px] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.recordPaymentBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkFullyPaid(tx)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold min-h-[38px] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.markFullPaidBtn}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                setExpandedPaymentTxIds((prev) => ({
                  ...prev,
                  [tx.id]: !prev[tx.id],
                }))
              }
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[38px] hover:bg-slate-200/70 dark:hover:bg-[#13264F]"
            >
              <span>
                {t.paymentHistoryTitle} ({tx.payments.length})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${t.shareEntryBtn}`}
              className="min-w-[38px] min-h-[38px] px-2.5 inline-flex items-center justify-center gap-1 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => handleNativeShareText(shareText, 'EasyDay Udhaar')}
              aria-label={t.shareEntryBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13264F]"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openEditEntryModal(tx)}
              aria-label={t.editBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13264F]"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  kind: 'entry',
                  txId: tx.id,
                  label: `${contact?.name || ''} · ${formatPKR(tx.amount)}`,
                })
              }
              aria-label={t.deleteBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Payment History */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-100 dark:border-[#1B315E] space-y-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t.paymentHistoryTitle}
            </p>
            {tx.payments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.noPaymentsYet}
              </p>
            ) : (
              <div className="space-y-1.5">
                {tx.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061026] text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {formatPKR(p.amount)}
                      </span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {p.date}
                      </span>
                      {p.note && (
                        <span className="ms-1.5 text-slate-600 dark:text-slate-300">
                          ({p.note})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          kind: 'payment',
                          txId: tx.id,
                          paymentId: p.id,
                          label: `${formatPKR(p.amount)} (${p.date})`,
                        })
                      }
                      aria-label={t.deleteBtn}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-5">
      {/* Copied Toast */}
      {copiedBanner && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{copiedBanner}</span>
        </div>
      )}

      {/* Main 4-Card Financial Dashboard */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/35 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-cyan-300 font-semibold">
            <span className="truncate">{t.givenTotalLabel}</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums truncate">
            {formatPKR(dashboard.totalGivenRemaining)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.givenSubLabel}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-yellow-400/35 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-yellow-300 font-semibold">
            <span className="truncate">{t.borrowedTotalLabel}</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-600 dark:text-yellow-400 shrink-0" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-amber-700 dark:text-yellow-300 tabular-nums truncate">
            {formatPKR(dashboard.totalBorrowedRemaining)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.borrowedSubLabel}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-300 font-semibold">
            <span className="truncate">{t.netBalanceLabel}</span>
            <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <p
            className={`text-lg sm:text-xl font-extrabold tabular-nums truncate ${
              dashboard.netOutstanding > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : dashboard.netOutstanding < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
            }`}
          >
            {dashboard.netOutstanding < 0 ? '-' : ''}
            {formatPKR(dashboard.netOutstanding)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {dashboard.netOutstanding > 0
              ? t.netReceivableNote
              : dashboard.netOutstanding < 0
                ? t.netPayableNote
                : t.netSettledNote}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-300 font-semibold">
            <span className="truncate">{t.activeCountLabel}</span>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {dashboard.activeTransactionsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {t.activeSubLabel}
          </p>
        </div>
      </section>

      {/* Primary Action Strip & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Udhaar Sections"
          className="inline-grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E]"
        >
          {(
            [
              { id: 'people', label: t.tabPeople },
              { id: 'transactions', label: t.tabTransactions },
              { id: 'summary', label: t.tabSummary },
            ] as const
          ).map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSubTab(tab.id);
                  if (tab.id !== 'people') setSelectedContactId(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[40px] transition-colors ${
                  active
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddPersonModal}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] hover:border-cyan-500 text-xs font-bold text-slate-800 dark:text-cyan-300 min-h-[44px] whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>{t.addPersonBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => openAddEntryModal()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.addEntryBtn}</span>
          </button>
        </div>
      </div>

      {/* Contact Detail Ledger View */}
      {subTab === 'people' && activeContact && activeContactSummary && (
        <section className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedContactId(null)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#061026] text-xs font-bold text-slate-700 dark:text-cyan-300 min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backToPeople}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditPersonModal(activeContact)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#061026] text-xs font-semibold text-slate-700 dark:text-slate-200 min-h-[40px]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{t.editPersonBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget({
                      kind: 'person',
                      contactId: activeContact.id,
                      label: activeContact.name,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold min-h-[40px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deletePersonBtn}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-[#1B315E]">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeContact.name}
                </h2>
                {activeContact.phone && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{activeContact.phone}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 tabular-nums">
                <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.filterGiven}
                  </p>
                  <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                    {formatPKR(activeContactSummary.givenRemaining)}
                  </p>
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.filterBorrowed}
                  </p>
                  <p className="text-sm font-bold text-amber-700 dark:text-yellow-300">
                    {formatPKR(activeContactSummary.borrowedRemaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Account Statement Bar */}
            {(() => {
              const statementText = formatWhatsAppAccountStatement(
                activeContact,
                transactions,
                language
              );
              const waUrl = buildWhatsAppUrl(activeContact.phone, statementText);
              return (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openAddEntryModal(activeContact.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[42px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addEntryBtn}</span>
                  </button>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[42px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.shareWhatsappStatement}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleNativeShareText(
                        statementText,
                        `${activeContact.name} Statement`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[42px]"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t.shareEntryBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(statementText)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[42px]"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t.copyStatementBtn}</span>
                  </button>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {t.noTransactionsTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.noTransactionsBody}
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => renderTransactionCard(tx, false))
            )}
          </div>
        </section>
      )}

      {/* Search & Filter Controls (for People list & All Entries) */}
      {(subTab === 'transactions' || (subTab === 'people' && !activeContact)) && (
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 dark:text-cyan-400/70 absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-11 ps-11 pe-11 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: t.filterAll },
                { id: 'given', label: t.filterGiven },
                { id: 'borrowed', label: t.filterBorrowed },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDirectionFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-colors ${
                  directionFilter === f.id
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}

            <span className="h-5 w-px bg-slate-200 dark:bg-[#1B315E] mx-0.5" />

            {(
              [
                { id: 'all', label: t.statusAll },
                { id: 'pending', label: t.statusPending },
                { id: 'partial', label: t.statusPartial },
                { id: 'paid', label: t.statusPaid },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-colors ${
                  statusFilter === s.id
                    ? 'bg-yellow-400 text-[#040D21]'
                    : 'bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-600 dark:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* People Ledger List */}
      {subTab === 'people' && !activeContact && (
        <section className="space-y-3">
          {filteredContactSummaries.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-3">
              <Users className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.noContactsTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {t.noContactsBody}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredContactSummaries.map((item) => (
                <button
                  key={item.contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(item.contact.id)}
                  className="text-start rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] hover:border-cyan-500 dark:hover:border-cyan-400 p-4 flex items-center justify-between gap-3 transition-colors min-h-[84px]"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.contact.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                      {item.contact.phone ? `${item.contact.phone} · ` : ''}
                      {item.activeCount} {t.activeSubLabel}
                      {item.lastActivityDate ? ` · ${item.lastActivityDate}` : ''}
                    </p>
                  </div>

                  <div className="text-end shrink-0 tabular-nums space-y-0.5">
                    <p
                      className={`text-sm sm:text-base font-extrabold ${
                        item.netBalance > 0
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : item.netBalance < 0
                            ? 'text-amber-700 dark:text-yellow-300'
                            : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatPKR(item.netBalance)}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {item.netBalance > 0
                        ? t.willReceiveBadge
                        : item.netBalance < 0
                          ? t.willPayBadge
                          : t.settledBadge}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* All Transactions List */}
      {subTab === 'transactions' && (
        <section className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.noTransactionsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.noTransactionsBody}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => renderTransactionCard(tx, true))
          )}
        </section>
      )}

      {/* Monthly & Overall Summary */}
      {subTab === 'summary' && (
        <section className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.monthlySummaryTitle}
                </h2>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{t.selectMonthLabel}</span>
                <input
                  type="month"
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-xs font-bold text-slate-900 dark:text-white"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.givenInMonthLabel}
                </p>
                <p className="text-base font-extrabold text-cyan-700 dark:text-cyan-300 mt-1">
                  {formatPKR(monthlySummary.givenAdded)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.collectedInMonthLabel}
                </p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatPKR(monthlySummary.paymentsCollected)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.borrowedInMonthLabel}
                </p>
                <p className="text-base font-extrabold text-amber-700 dark:text-yellow-300 mt-1">
                  {formatPKR(monthlySummary.borrowedAdded)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.returnedInMonthLabel}
                </p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatPKR(monthlySummary.paymentsReturned)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.overallSummaryTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.tabPeople}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {contacts.length}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {t.activeCountLabel}
                </span>
                <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
                  {dashboard.activeTransactionsCount}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061026] flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{t.statusPaid}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {dashboard.paidTransactionsCount}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Add/Edit Person Modal */}
      {personModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSavePerson}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingPersonId ? t.personModalEditTitle : t.personModalAddTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPersonModalOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#13264F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {personError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {personError}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.personNameLabel}
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={t.personNamePlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.personPhoneLabel}
              </label>
              <input
                type="tel"
                value={personPhone}
                onChange={(e) => setPersonPhone(e.target.value)}
                placeholder={t.personPhonePlaceholder}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPersonModalOpen(false)}
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold"
              >
                {editingPersonId ? t.updateBtn : t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Udhaar Entry Modal */}
      {entryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveEntry}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingEntryId ? t.entryModalEditTitle : t.entryModalAddTitle}
              </h3>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#13264F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {entryError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {entryError}
              </p>
            )}

            {/* Person selector or Quick New */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.selectPersonLabel}
                </label>
                {!editingEntryId && (
                  <button
                    type="button"
                    onClick={() => setQuickNewPersonMode((v) => !v)}
                    className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline"
                  >
                    {quickNewPersonMode ? t.selectPersonLabel : t.quickNewPersonToggle}
                  </button>
                )}
              </div>

              {quickNewPersonMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={quickPersonName}
                    onChange={(e) => setQuickPersonName(e.target.value)}
                    placeholder={t.personNamePlaceholder}
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                  />
                  <input
                    type="tel"
                    value={quickPersonPhone}
                    onChange={(e) => setQuickPersonPhone(e.target.value)}
                    placeholder={t.personPhonePlaceholder}
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <select
                  value={entryContactId}
                  onChange={(e) => setEntryContactId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                >
                  <option value="">{t.selectPersonLabel}</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.directionLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryDirection('given')}
                  className={`p-3 rounded-xl border text-xs font-bold text-start transition-colors ${
                    entryDirection === 'given'
                      ? 'bg-cyan-500 text-[#040D21] border-cyan-500'
                      : 'bg-slate-50 dark:bg-[#061026] border-slate-200 dark:border-[#1B315E] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.directionGivenOption}
                </button>
                <button
                  type="button"
                  onClick={() => setEntryDirection('borrowed')}
                  className={`p-3 rounded-xl border text-xs font-bold text-start transition-colors ${
                    entryDirection === 'borrowed'
                      ? 'bg-yellow-400 text-[#040D21] border-yellow-400'
                      : 'bg-slate-50 dark:bg-[#061026] border-slate-200 dark:border-[#1B315E] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.directionBorrowedOption}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.amountLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.dateLabel}
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.optionalDueDate}
                </label>
                <input
                  type="date"
                  value={entryDueDate}
                  onChange={(e) => setEntryDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.descriptionLabel}
                </label>
                <input
                  type="text"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-sm font-bold"
              >
                {editingEntryId ? t.updateBtn : t.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Partial / Full Payment Modal */}
      {paymentTargetTx && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSavePayment}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.paymentModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalTxId(null)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#061026] flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-500 dark:text-slate-400">
                {t.remainingLabel}
              </span>
              <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
                {formatPKR(getTransactionRemaining(paymentTargetTx))}
              </span>
            </div>

            {paymentError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {paymentError}
              </p>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.paymentAmountLabel}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(String(getTransactionRemaining(paymentTargetTx)))
                  }
                  className="text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:underline"
                >
                  {t.fillRemainingBtn}
                </button>
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm font-bold text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.paymentDateLabel}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.paymentNoteLabel}
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder={t.paymentNotePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalTxId(null)}
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#040D21] text-sm font-bold"
              >
                {t.confirmPaymentBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Before Deleting Financial Record */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {deleteTarget.kind === 'person'
                    ? t.confirmDeletePersonTitle
                    : deleteTarget.kind === 'entry'
                      ? t.confirmDeleteEntryTitle
                      : t.confirmDeletePaymentTitle}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {deleteTarget.kind === 'person'
                    ? t.confirmDeletePersonBody
                    : deleteTarget.kind === 'entry'
                      ? t.confirmDeleteEntryBody
                      : t.confirmDeletePaymentBody}
                </p>
                {deleteTarget.label && (
                  <p className="text-xs font-bold text-slate-800 dark:text-yellow-300 pt-1">
                    {deleteTarget.label}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
