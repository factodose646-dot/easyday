import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellRing,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Flame,
  GraduationCap,
  Home as HomeIcon,
  Image as ImageIcon,
  Link2,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { ToolTranslationBundle } from '../../i18n/toolTranslations';
import { Language } from '../../types';
import {
  checkAndroidNotificationPermission,
  showAndroidBillNotification,
} from '../../utils/androidBridge';
import {
  requestAndSyncBillNotifications,
  syncAllBillRemindersAndOverdueAlerts,
} from '../../utils/billNotifications';
import {
  buildReminderRequestCode,
  computeBillsDashboard,
  computeBillStatus,
  ComputedBillStatus,
  diffDaysISO,
  formatISODateParts,
  getDaysInMonth,
} from '../../utils/billsEngine';
import {
  emitFinanceUpdatedEvent,
  findLinkedExpenseForBill,
  persistBillDeletedSynced,
  persistBillEditedSynced,
  persistBillPaidSynced,
  persistBillUnpaidSynced,
} from '../../utils/financeSync';
import {
  BillCategory,
  BillItem,
  BillPaymentRecord,
  BillReminderTiming,
  BillRepeat,
  billsStorage,
  generateId,
  getCurrentMonthISO,
  getStorageErrorMessage,
  getTodayISO,
  TransactionItem,
  transactionsStorage,
} from '../../utils/storage';
import {
  deleteBillPhotoIfUnused,
  getBillPhoto,
  migrateLegacyBillPhotosToIndexedDB,
  saveBillPhoto,
} from '../../utils/photoStorage';
import { formatPKR } from '../../utils/udhaarEngine';

interface BillsReminderToolProps {
  language: Language;
  t: ToolTranslationBundle['bills'];
}

type BillsSubView = 'list' | 'calendar' | 'history';
type StatusFilter = 'all' | 'overdue' | 'pending' | 'paid';

const BILL_CATEGORIES: BillCategory[] = [
  'electricity',
  'gas',
  'water',
  'internet',
  'mobile',
  'rent',
  'school',
  'other',
];

const CATEGORY_META: Record<
  BillCategory,
  {
    Icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
  }
> = {
  electricity: {
    Icon: Zap,
    badgeClass: 'bg-yellow-400/20 text-amber-700 dark:text-yellow-300',
  },
  gas: {
    Icon: Flame,
    badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  water: {
    Icon: Droplets,
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  },
  internet: {
    Icon: Wifi,
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  mobile: {
    Icon: Smartphone,
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  rent: {
    Icon: HomeIcon,
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  school: {
    Icon: GraduationCap,
    badgeClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  other: {
    Icon: ReceiptText,
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  },
};

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Empty image data'));
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export const BillsReminderTool: React.FC<BillsReminderToolProps> = ({
  language,
  t,
}) => {
  const [bills, setBills] = useState<BillItem[]>(() => billsStorage.loadBills());
  const [payments, setPayments] = useState<BillPaymentRecord[]>(() =>
    billsStorage.loadPayments()
  );
  const [expenses, setExpenses] = useState<TransactionItem[]>(() =>
    transactionsStorage.load()
  );

  const [subView, setSubView] = useState<BillsSubView>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BillCategory>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [storageErrorBanner, setStorageErrorBanner] = useState<string | null>(null);

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Calendar state
  const todayISO = getTodayISO();
  const currentMonthISO = getCurrentMonthISO();
  const [calendarYear, setCalendarYear] = useState(() => Number(todayISO.slice(0, 4)));
  const [calendarMonth, setCalendarMonth] = useState(() => Number(todayISO.slice(5, 7)));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayISO);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billName, setBillName] = useState('');
  const [billCategory, setBillCategory] = useState<BillCategory>('electricity');
  const [billProvider, setBillProvider] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(() => getTodayISO());
  const [billAccountNumber, setBillAccountNumber] = useState('');
  const [billRepeat, setBillRepeat] = useState<BillRepeat>('monthly');
  const [billCustomDays, setBillCustomDays] = useState('30');
  const [billReminderTiming, setBillReminderTiming] =
    useState<BillReminderTiming>('1-day');
  const [billPhotoId, setBillPhotoId] = useState<string | undefined>(undefined);
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | undefined>(undefined);
  const [billPhotoDirty, setBillPhotoDirty] = useState<boolean>(false);
  const [savingBusy, setSavingBusy] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Photo lightbox, Unpay confirm & Delete confirm
  const [previewPhotoState, setPreviewPhotoState] = useState<{
    open: boolean;
    loading: boolean;
    url: string | null;
    missingMessage: string | null;
  }>({ open: false, loading: false, url: null, missingMessage: null });
  const [deleteTargetBill, setDeleteTargetBill] = useState<BillItem | null>(null);
  const [unpayTargetBill, setUnpayTargetBill] = useState<BillItem | null>(null);

  const applySyncedSnapshots = useCallback(
    (
      nextBills: BillItem[],
      nextPayments: BillPaymentRecord[],
      nextExpenses?: TransactionItem[]
    ) => {
      setStorageErrorBanner(null);
      setBills(nextBills);
      setPayments(nextPayments);
      if (nextExpenses !== undefined) {
        setExpenses(nextExpenses);
      }
      void syncAllBillRemindersAndOverdueAlerts(nextBills, language).then((res) => {
        setPermissionGranted(res.permissionGranted);
      });
    },
    [language]
  );

  const persistAll = useCallback(
    (
      nextBills: BillItem[],
      nextPayments: BillPaymentRecord[] = payments
    ): { ok: boolean; message?: string } => {
      const billsRes = billsStorage.saveBills(nextBills);
      if (!billsRes.ok) {
        const msg = getStorageErrorMessage(
          billsRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
          language
        );
        setStorageErrorBanner(msg);
        return { ok: false, message: msg };
      }

      const payRes = billsStorage.savePayments(nextPayments);
      if (!payRes.ok) {
        // Attempt rollback of bills save so bills & payments stay consistent
        billsStorage.saveBills(bills);
        const msg = getStorageErrorMessage(
          payRes.errorCode || 'UNKNOWN_STORAGE_ERROR',
          language
        );
        setStorageErrorBanner(msg);
        return { ok: false, message: msg };
      }

      emitFinanceUpdatedEvent();
      applySyncedSnapshots(nextBills, nextPayments);
      return { ok: true };
    },
    [applySyncedSnapshots, bills, language, payments]
  );

  // Safely migrate legacy inline Base64 bill photos into IndexedDB on mount
  useEffect(() => {
    let active = true;
    void migrateLegacyBillPhotosToIndexedDB().then((report) => {
      if (!active) return;
      if (report.migratedCount > 0) {
        setBills(billsStorage.loadBills());
      }
      if (report.failedCount > 0 && report.errorCode) {
        setStorageErrorBanner(getStorageErrorMessage(report.errorCode, language));
      }
    });
    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    let active = true;
    void checkAndroidNotificationPermission().then((perm) => {
      if (active) setPermissionGranted(perm.granted);
    });
    void syncAllBillRemindersAndOverdueAlerts(bills, language).then((res) => {
      if (active) setPermissionGranted(res.permissionGranted);
    });
    return () => {
      active = false;
    };
  }, [bills, language]);

  const dashboard = useMemo(
    () => computeBillsDashboard(bills, payments, todayISO, currentMonthISO),
    [bills, payments, todayISO, currentMonthISO]
  );

  const filteredBills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bills
      .filter((bill) => {
        if (categoryFilter !== 'all' && bill.category !== categoryFilter) {
          return false;
        }
        const status = computeBillStatus(bill, todayISO);
        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }
        if (q) {
          const matchName = bill.name.toLowerCase().includes(q);
          const matchProv = bill.provider.toLowerCase().includes(q);
          const matchAcc = bill.accountNumber.toLowerCase().includes(q);
          if (!matchName && !matchProv && !matchAcc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sa = computeBillStatus(a, todayISO);
        const sb = computeBillStatus(b, todayISO);
        const order: Record<ComputedBillStatus, number> = {
          overdue: 0,
          pending: 1,
          paid: 2,
        };
        if (order[sa] !== order[sb]) return order[sa] - order[sb];
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [bills, categoryFilter, statusFilter, searchQuery, todayISO]);

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(
      Date.UTC(calendarYear, calendarMonth - 1, 1)
    ).getUTCDay();
    const daysCount = getDaysInMonth(calendarYear, calendarMonth);
    const cells: ({ iso: string; day: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysCount; day += 1) {
      cells.push({
        iso: formatISODateParts(calendarYear, calendarMonth, day),
        day,
      });
    }
    return cells;
  }, [calendarYear, calendarMonth]);

  const billsByDueDate = useMemo(() => {
    const map = new Map<string, BillItem[]>();
    for (const bill of bills) {
      const existing = map.get(bill.dueDate) ?? [];
      existing.push(bill);
      map.set(bill.dueDate, existing);
    }
    return map;
  }, [bills]);

  const selectedDayBills = useMemo(
    () => billsByDueDate.get(selectedCalendarDate) ?? [],
    [billsByDueDate, selectedCalendarDate]
  );

  const openAddModal = () => {
    setEditingBillId(null);
    setBillName('');
    setBillCategory('electricity');
    setBillProvider('');
    setBillAmount('');
    setBillDueDate(todayISO);
    setBillAccountNumber('');
    setBillRepeat('monthly');
    setBillCustomDays('30');
    setBillReminderTiming('1-day');
    setBillPhotoId(undefined);
    setBillPhotoUrl(undefined);
    setBillPhotoDirty(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = async (bill: BillItem) => {
    setEditingBillId(bill.id);
    setBillName(bill.name);
    setBillCategory(bill.category);
    setBillProvider(bill.provider);
    setBillAmount(String(bill.amount));
    setBillDueDate(bill.dueDate);
    setBillAccountNumber(bill.accountNumber);
    setBillRepeat(bill.repeat);
    setBillCustomDays(String(bill.customIntervalDays || 30));
    setBillReminderTiming(bill.reminderTiming);
    setBillPhotoId(bill.photoId);
    setBillPhotoUrl(bill.photoDataUrl);
    setBillPhotoDirty(false);
    setFormError(null);
    setModalOpen(true);

    if (bill.photoId && !bill.photoDataUrl) {
      const readRes = await getBillPhoto(bill.photoId, language);
      if (readRes.ok && readRes.photo) {
        setBillPhotoUrl(readRes.photo.dataUrl);
      }
    }
  };

  const handleOpenBillPhoto = async (bill: BillItem) => {
    if (bill.photoDataUrl) {
      setPreviewPhotoState({
        open: true,
        loading: false,
        url: bill.photoDataUrl,
        missingMessage: null,
      });
      return;
    }
    if (!bill.photoId) return;

    setPreviewPhotoState({
      open: true,
      loading: true,
      url: null,
      missingMessage: null,
    });
    const res = await getBillPhoto(bill.photoId, language);
    if (!res.ok) {
      setPreviewPhotoState({
        open: true,
        loading: false,
        url: null,
        missingMessage: res.message || t.photoMissingMsg,
      });
      return;
    }
    if (!res.photo) {
      setPreviewPhotoState({
        open: true,
        loading: false,
        url: null,
        missingMessage: t.photoMissingMsg,
      });
      return;
    }
    setPreviewPhotoState({
      open: true,
      loading: false,
      url: res.photo.dataUrl,
      missingMessage: null,
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setBillPhotoUrl(dataUrl);
      setBillPhotoDirty(true);
      setFormError(null);
    } catch {
      setFormError(t.errors.imageReadFailed);
    }
    e.target.value = '';
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = billName.trim();
    if (!trimmedName) {
      setFormError(t.errors.emptyName);
      return;
    }
    const numericAmount = Math.round(Number(billAmount) * 100) / 100;
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError(t.errors.invalidAmount);
      return;
    }
    if (!billDueDate) {
      setFormError(t.errors.invalidDate);
      return;
    }
    const parsedCustom = Math.round(Number(billCustomDays));
    if (billRepeat === 'custom' && (!Number.isFinite(parsedCustom) || parsedCustom < 1)) {
      setFormError(t.errors.invalidCustomDays);
      return;
    }

    setSavingBusy(true);
    setFormError(null);

    try {
      const existingBill = editingBillId
        ? bills.find((b) => b.id === editingBillId)
        : undefined;
      const oldPhotoId = existingBill?.photoId;

      let resolvedPhotoId: string | undefined = billPhotoId;
      let fallbackInlinePhoto: string | undefined = undefined;

      if (billPhotoDirty) {
        if (billPhotoUrl && billPhotoUrl.startsWith('data:')) {
          const photoRes = await saveBillPhoto(billPhotoUrl, { lang: language });
          if (!photoRes.ok || !photoRes.photoId) {
            setFormError(
              photoRes.message || getStorageErrorMessage('IDB_WRITE_FAILED', language)
            );
            setSavingBusy(false);
            return;
          }
          resolvedPhotoId = photoRes.photoId;
          fallbackInlinePhoto = undefined;
        } else {
          // User explicitly removed the attached photo
          resolvedPhotoId = undefined;
          fallbackInlinePhoto = undefined;
        }
      } else if (existingBill?.photoDataUrl && !resolvedPhotoId) {
        // Opportunistically migrate legacy inline photo when re-saving bill
        const migRes = await saveBillPhoto(existingBill.photoDataUrl, { lang: language });
        if (migRes.ok && migRes.photoId) {
          resolvedPhotoId = migRes.photoId;
          fallbackInlinePhoto = undefined;
        } else {
          fallbackInlinePhoto = existingBill.photoDataUrl;
        }
      }

      const now = Date.now();
      let nextBillsSnapshot: BillItem[] = bills;

      if (editingBillId && existingBill) {
        const updatedBill: BillItem = {
          ...existingBill,
          name: trimmedName,
          category: billCategory,
          provider: billProvider.trim(),
          amount: numericAmount,
          dueDate: billDueDate,
          accountNumber: billAccountNumber.trim(),
          photoId: resolvedPhotoId,
          photoDataUrl: fallbackInlinePhoto,
          repeat: billRepeat,
          customIntervalDays: billRepeat === 'custom' ? parsedCustom : undefined,
          reminderTiming: billReminderTiming,
          updatedAt: now,
        };
        if (!fallbackInlinePhoto) delete updatedBill.photoDataUrl;

        const editRes = persistBillEditedSynced(updatedBill, language);
        if (!editRes.ok) {
          setFormError(
            editRes.errorMessage ||
              getStorageErrorMessage('UNKNOWN_STORAGE_ERROR', language)
          );
          setSavingBusy(false);
          return;
        }
        nextBillsSnapshot = editRes.bills;
        applySyncedSnapshots(editRes.bills, editRes.payments, editRes.expenses);
      } else {
        const created: BillItem = {
          id: generateId('bill'),
          seriesId: generateId('bser'),
          name: trimmedName,
          category: billCategory,
          provider: billProvider.trim(),
          amount: numericAmount,
          dueDate: billDueDate,
          accountNumber: billAccountNumber.trim(),
          photoId: resolvedPhotoId,
          repeat: billRepeat,
          customIntervalDays: billRepeat === 'custom' ? parsedCustom : undefined,
          reminderTiming: billReminderTiming,
          status: 'pending',
          nextCycleGenerated: false,
          createdAt: now,
          updatedAt: now,
        };
        const nextBills = [created, ...bills];
        const saveRes = persistAll(nextBills, payments);
        if (!saveRes.ok) {
          setFormError(
            saveRes.message ||
              getStorageErrorMessage('UNKNOWN_STORAGE_ERROR', language)
          );
          setSavingBusy(false);
          return;
        }
        nextBillsSnapshot = nextBills;
      }

      // Safely clean up replaced/removed IndexedDB photo only if no other bill references it
      if (oldPhotoId && oldPhotoId !== resolvedPhotoId) {
        void deleteBillPhotoIfUnused(oldPhotoId, nextBillsSnapshot);
      }

      setModalOpen(false);
    } finally {
      setSavingBusy(false);
    }
  };

  const handleMarkPaid = (billId: string) => {
    const syncRes = persistBillPaidSynced(billId, todayISO, language);
    if (!syncRes.ok) {
      setFeedbackBanner(null);
      setStorageErrorBanner(
        syncRes.errorMessage ||
          getStorageErrorMessage('UNKNOWN_STORAGE_ERROR', language)
      );
      return;
    }
    if (syncRes.result.alreadyPaid || !syncRes.result.changed) {
      return;
    }

    applySyncedSnapshots(
      syncRes.result.bills,
      syncRes.result.payments,
      syncRes.result.expenses
    );

    const msg = syncRes.result.generatedNextBill
      ? `${t.paidWithExpenseMsg} ${t.recurringGeneratedMsg} ${syncRes.result.generatedNextBill.dueDate}`
      : t.paidWithExpenseMsg;
    setFeedbackBanner(msg);
    window.setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleConfirmUnpay = (expenseAction: 'remove' | 'keep') => {
    if (!unpayTargetBill) return;
    const syncRes = persistBillUnpaidSynced(
      unpayTargetBill.id,
      expenseAction,
      language
    );
    if (!syncRes.ok) {
      setStorageErrorBanner(
        syncRes.errorMessage ||
          getStorageErrorMessage('UNKNOWN_STORAGE_ERROR', language)
      );
      setUnpayTargetBill(null);
      return;
    }
    applySyncedSnapshots(syncRes.bills, syncRes.payments, syncRes.expenses);
    setFeedbackBanner(t.unpaidSuccessMsg);
    window.setTimeout(() => setFeedbackBanner(null), 3500);
    setUnpayTargetBill(null);
  };

  const handleConfirmDelete = (expenseAction: 'remove' | 'keep' = 'keep') => {
    if (!deleteTargetBill) return;
    const removedPhotoId = deleteTargetBill.photoId;
    const syncRes = persistBillDeletedSynced(
      deleteTargetBill.id,
      expenseAction,
      language
    );
    if (!syncRes.ok) {
      setStorageErrorBanner(
        syncRes.errorMessage ||
          getStorageErrorMessage('UNKNOWN_STORAGE_ERROR', language)
      );
      setDeleteTargetBill(null);
      return;
    }
    applySyncedSnapshots(syncRes.bills, syncRes.payments, syncRes.expenses);
    if (removedPhotoId) {
      void deleteBillPhotoIfUnused(removedPhotoId, syncRes.bills);
    }
    setDeleteTargetBill(null);
  };

  const handleEnableNotifications = async () => {
    const summary = await requestAndSyncBillNotifications(bills, language);
    setPermissionGranted(summary.permissionGranted);
  };

  const handleSendTestAlert = async () => {
    await requestAndSyncBillNotifications(bills, language);
    await showAndroidBillNotification(
      buildReminderRequestCode(`test-${Date.now()}`),
      t.notificationBannerTitle,
      t.testNotificationSent
    );
    setFeedbackBanner(t.testNotificationSent);
    window.setTimeout(() => setFeedbackBanner(null), 3200);
  };

  const handleShiftCalendarMonth = (delta: number) => {
    let nextMonth = calendarMonth + delta;
    let nextYear = calendarYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    } else if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
  };

  const calendarMonthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(calendarYear, calendarMonth - 1, 1));
    } catch {
      return `${calendarYear}-${String(calendarMonth).padStart(2, '0')}`;
    }
  }, [calendarYear, calendarMonth, language]);

  const renderBillCard = (bill: BillItem) => {
    const status = computeBillStatus(bill, todayISO);
    const meta = CATEGORY_META[bill.category];
    const CategoryIcon = meta.Icon;
    const daysDelta = diffDaysISO(todayISO, bill.dueDate);

    return (
      <article
        key={bill.id}
        className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.badgeClass}`}
            >
              <CategoryIcon className="w-5 h-5" />
            </span>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {bill.name}
                </h3>
                {status === 'paid' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.statusPaid}</span>
                  </span>
                )}
                {status === 'overdue' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {t.statusOverdue} ({Math.abs(daysDelta)} {t.overdueByDays})
                    </span>
                  </span>
                )}
                {status === 'pending' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {daysDelta === 0
                        ? t.dueTodayLabel
                        : `${daysDelta} ${t.dueInDays}`}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{t.categories[bill.category]}</span>
                {bill.provider && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{bill.provider}</span>
                  </>
                )}
                {bill.accountNumber && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {t.accountRefLabel}: {bill.accountNumber}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>
                  {t.dueOnLabel}: {bill.dueDate}
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.repeats[bill.repeat]}</span>
                <span aria-hidden="true">·</span>
                <span>{t.timings[bill.reminderTiming]}</span>
              </div>
            </div>
          </div>

          <div className="text-end shrink-0 tabular-nums">
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {formatPKR(bill.amount)}
            </p>
            {bill.paidDate && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {t.paidOnLabel} {bill.paidDate}
              </p>
            )}
            {status === 'paid' && findLinkedExpenseForBill(expenses, bill) && (
              <p className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300 mt-0.5">
                <Link2 className="w-3 h-3 shrink-0" />
                <span>{t.linkedExpenseBadge}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1B315E]">
          <div className="flex flex-wrap items-center gap-1.5">
            {status !== 'paid' ? (
              <button
                type="button"
                onClick={() => handleMarkPaid(bill.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold min-h-[38px] transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.markPaidBtn}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUnpayTargetBill(bill)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-yellow-300 text-xs font-bold min-h-[38px] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.markUnpaidBtn}</span>
              </button>
            )}
            {(bill.photoId || bill.photoDataUrl) && (
              <button
                type="button"
                onClick={() => void handleOpenBillPhoto(bill)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-cyan-300 text-xs font-semibold min-h-[38px]"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{t.viewPhotoBtn}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void openEditModal(bill)}
              aria-label={t.editBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#13264F]"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTargetBill(bill)}
              aria-label={t.deleteBtn}
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-5">
      {storageErrorBanner && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-start justify-between gap-2.5"
        >
          <div className="flex items-start gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{storageErrorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStorageErrorBanner(null)}
            aria-label={t.closeBtn}
            className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackBanner && (
        <div
          role="status"
          className="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Native Android Notification Permission & Scheduling Banner */}
      <section className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              permissionGranted
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-yellow-400/20 text-amber-700 dark:text-yellow-300'
            }`}
          >
            <BellRing className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t.notificationBannerTitle}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {permissionGranted
                ? t.notificationPermissionReady
                : t.notificationPermissionMissing}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!permissionGranted ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[40px] whitespace-nowrap"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{t.enableNotificationsBtn}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendTestAlert}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[40px] whitespace-nowrap"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{t.testNotificationBtn}</span>
            </button>
          )}
        </div>
      </section>

      {/* Bills Dashboard 4-KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-cyan-500/35 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-cyan-300 truncate">
            {t.upcomingCountLabel}
          </p>
          <p className="text-xl font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums">
            {dashboard.upcomingCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-yellow-400/35 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-yellow-300 truncate">
            {t.pendingAmountLabel}
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-amber-700 dark:text-yellow-300 tabular-nums truncate">
            {formatPKR(dashboard.totalPendingAmount)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-emerald-300 truncate">
            {t.paidMonthLabel}
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
            {formatPKR(dashboard.paidThisMonthAmount)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {dashboard.paidThisMonthCount} {t.statusPaid}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-rose-500/35 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-rose-300 truncate">
            {t.overdueCountLabel}
          </p>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            {dashboard.overdueCount}
          </p>
          {dashboard.overdueAmount > 0 && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 tabular-nums truncate">
              {formatPKR(dashboard.overdueAmount)}
            </p>
          )}
        </div>
      </section>

      {/* View Switcher & Add Bill CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Bills Views"
          className="inline-grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E]"
        >
          {(
            [
              { id: 'list', label: t.viewList },
              { id: 'calendar', label: t.viewCalendar },
              { id: 'history', label: t.viewHistory },
            ] as const
          ).map((tab) => {
            const active = subView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSubView(tab.id)}
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

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-xs font-bold min-h-[44px] whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t.addBillBtn}</span>
        </button>
      </div>

      {/* Bills List View */}
      {subView === 'list' && (
        <section className="space-y-4">
          {/* Search & Category + Status Filters */}
          <div className="space-y-2.5">
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
                  className="absolute top-1/2 -translate-y-1/2 end-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: t.statusAll },
                  { id: 'overdue', label: t.statusOverdue },
                  { id: 'pending', label: t.statusUpcoming },
                  { id: 'paid', label: t.statusPaid },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[36px] transition-colors ${
                    statusFilter === st.id
                      ? 'bg-yellow-400 text-[#040D21]'
                      : 'bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 min-h-[36px] ${
                  categoryFilter === 'all'
                    ? 'bg-cyan-500 text-[#040D21]'
                    : 'bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.filterAllCategories}
              </button>
              {BILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 min-h-[36px] ${
                    categoryFilter === cat
                      ? 'bg-cyan-500 text-[#040D21]'
                      : 'bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.categories[cat]}
                </button>
              ))}
            </div>
          </div>

          {filteredBills.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-2">
              <ReceiptText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.noBillsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t.noBillsBody}
              </p>
            </div>
          ) : (
            <div className="space-y-3">{filteredBills.map(renderBillCard)}</div>
          )}
        </section>
      )}

      {/* Calendar View */}
      {subView === 'calendar' && (
        <section className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {calendarMonthLabel}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarYear(Number(todayISO.slice(0, 4)));
                    setCalendarMonth(Number(todayISO.slice(5, 7)));
                    setSelectedCalendarDate(todayISO);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061026] text-xs font-bold text-slate-700 dark:text-cyan-300 min-h-[36px]"
                >
                  {t.calendarTodayBtn}
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftCalendarMonth(-1)}
                  aria-label="Previous month"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShiftCalendarMonth(1)}
                  aria-label="Next month"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-white"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-12" />;
                }
                const dayBills = billsByDueDate.get(cell.iso) ?? [];
                const isSelected = selectedCalendarDate === cell.iso;
                const isToday = cell.iso === todayISO;
                const hasOverdue = dayBills.some(
                  (b) => computeBillStatus(b, todayISO) === 'overdue'
                );
                const hasPending = dayBills.some(
                  (b) => computeBillStatus(b, todayISO) === 'pending'
                );
                const hasPaid = dayBills.some(
                  (b) => computeBillStatus(b, todayISO) === 'paid'
                );

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedCalendarDate(cell.iso)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs font-bold tabular-nums transition-colors border ${
                      isSelected
                        ? 'bg-cyan-500 text-[#040D21] border-cyan-400'
                        : isToday
                          ? 'bg-yellow-400/20 text-amber-800 dark:text-yellow-300 border-yellow-400/50'
                          : 'bg-slate-50 dark:bg-[#061026] text-slate-800 dark:text-slate-200 border-transparent hover:border-cyan-400/50'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {dayBills.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        {hasOverdue && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                        {hasPending && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-[#040D21]' : 'bg-cyan-500'
                            }`}
                          />
                        )}
                        {!hasOverdue && !hasPending && hasPaid && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white px-1 tabular-nums">
              {t.calendarSelectedDayTitle} {selectedCalendarDate}
            </h3>
            {selectedDayBills.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {t.calendarNoBillsOnDay}
              </div>
            ) : (
              selectedDayBills.map(renderBillCard)
            )}
          </div>
        </section>
      )}

      {/* Payment History View */}
      {subView === 'history' && (
        <section className="space-y-3">
          {payments.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.noHistoryTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.noHistoryBody}
              </p>
            </div>
          ) : (
            payments.map((p) => {
              const meta = CATEGORY_META[p.category];
              const CategoryIcon = meta.Icon;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.badgeClass}`}
                    >
                      <CategoryIcon className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.billName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {t.categories[p.category]}
                        {p.provider ? ` · ${p.provider}` : ''} · {t.paidOnLabel}{' '}
                        {p.paidDate}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                    {formatPKR(p.amount)}
                  </p>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Add/Edit Bill Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm"
        >
          <form
            onSubmit={handleSaveBill}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl max-h-[90dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingBillId ? t.modalEditTitle : t.modalAddTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.billNameLabel}
                </label>
                <input
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder={t.billNamePlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.categoryLabel}
                </label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value as BillCategory)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                >
                  {BILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t.categories[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.amountFieldLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.dueDateFieldLabel}
                </label>
                <input
                  type="date"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.providerFieldLabel}
                </label>
                <input
                  type="text"
                  value={billProvider}
                  onChange={(e) => setBillProvider(e.target.value)}
                  placeholder={t.providerPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.accountNumberLabel}
                </label>
                <input
                  type="text"
                  value={billAccountNumber}
                  onChange={(e) => setBillAccountNumber(e.target.value)}
                  placeholder={t.accountNumberPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.repeatLabel}
                </label>
                <select
                  value={billRepeat}
                  onChange={(e) => setBillRepeat(e.target.value as BillRepeat)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                >
                  <option value="one-time">{t.repeats['one-time']}</option>
                  <option value="monthly">{t.repeats.monthly}</option>
                  <option value="custom">{t.repeats.custom}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.reminderTimingLabel}
                </label>
                <select
                  value={billReminderTiming}
                  onChange={(e) =>
                    setBillReminderTiming(e.target.value as BillReminderTiming)
                  }
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white"
                >
                  <option value="1-day">{t.timings['1-day']}</option>
                  <option value="3-days">{t.timings['3-days']}</option>
                  <option value="on-due">{t.timings['on-due']}</option>
                </select>
              </div>
            </div>

            {billRepeat === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t.customDaysLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={billCustomDays}
                  onChange={(e) => setBillCustomDays(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-sm text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            )}

            {/* Bill Photo Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t.photoAttachLabel}
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                <label className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061026] border border-slate-200 dark:border-[#1B315E] text-xs font-bold text-slate-800 dark:text-cyan-300 cursor-pointer min-h-[42px]">
                  <Upload className="w-4 h-4" />
                  <span>{t.uploadPhotoBtn}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {(billPhotoUrl || billPhotoId) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (billPhotoUrl) {
                          setPreviewPhotoState({
                            open: true,
                            loading: false,
                            url: billPhotoUrl,
                            missingMessage: null,
                          });
                        } else if (billPhotoId) {
                          void handleOpenBillPhoto({
                            id: editingBillId || 'preview',
                            seriesId: 'preview',
                            name: billName,
                            category: billCategory,
                            provider: billProvider,
                            amount: 0,
                            dueDate: billDueDate,
                            accountNumber: '',
                            photoId: billPhotoId,
                            repeat: billRepeat,
                            reminderTiming: billReminderTiming,
                            status: 'pending',
                            createdAt: 0,
                            updatedAt: 0,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-xs font-bold min-h-[42px]"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>{t.viewPhotoBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBillPhotoUrl(undefined);
                        setBillPhotoId(undefined);
                        setBillPhotoDirty(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold min-h-[42px]"
                    >
                      <X className="w-4 h-4" />
                      <span>{t.removePhotoBtn}</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.photoHint}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={savingBusy}
                onClick={() => setModalOpen(false)}
                className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold disabled:opacity-50"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={savingBusy}
                className="h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#040D21] text-sm font-bold disabled:opacity-60"
              >
                {savingBusy
                  ? t.savingPhotoMsg
                  : editingBillId
                    ? t.updateBillBtn
                    : t.saveBillBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photo Preview Lightbox */}
      {previewPhotoState.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.photoPreviewTitle}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setPreviewPhotoState({
                    open: false,
                    loading: false,
                    url: null,
                    missingMessage: null,
                  })
                }
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {previewPhotoState.loading ? (
              <div className="py-14 text-center text-xs font-semibold text-slate-500 dark:text-cyan-300">
                {t.loadingPhotoMsg}
              </div>
            ) : previewPhotoState.url ? (
              <img
                src={previewPhotoState.url}
                alt={t.photoPreviewTitle}
                className="w-full max-h-[70dvh] object-contain rounded-2xl bg-slate-900"
              />
            ) : (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-6 text-center space-y-2">
                <AlertTriangle className="w-7 h-7 text-rose-500 mx-auto" />
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {previewPhotoState.missingMessage || t.photoMissingMsg}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setPreviewPhotoState({
                  open: false,
                  loading: false,
                  url: null,
                  missingMessage: null,
                })
              }
              className="w-full h-11 rounded-xl bg-cyan-500 text-[#040D21] text-sm font-bold"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}

      {/* Mark Bill Unpaid Confirmation Modal */}
      {unpayTargetBill &&
        (() => {
          const linkedExpense = findLinkedExpenseForBill(expenses, unpayTargetBill);
          return (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
            >
              <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#0B1836] border border-slate-200 dark:border-[#1B315E] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] space-y-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-yellow-300 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t.confirmUnpayTitle}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {linkedExpense
                        ? t.confirmUnpayWithExpenseBody
                        : t.confirmUnpaySimpleBody}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-yellow-300 pt-1 tabular-nums">
                      {unpayTargetBill.name} · {formatPKR(unpayTargetBill.amount)}
                    </p>
                  </div>
                </div>

                {linkedExpense ? (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmUnpay('remove')}
                      className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#040D21] text-xs sm:text-sm font-bold"
                    >
                      {t.unpayAndRemoveExpenseBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmUnpay('keep')}
                      className="w-full h-11 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm font-bold"
                    >
                      {t.unpayAndKeepExpenseBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnpayTargetBill(null)}
                      className="w-full h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
                    >
                      {t.cancelBtn}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setUnpayTargetBill(null)}
                      className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmUnpay('remove')}
                      className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#040D21] text-sm font-bold"
                    >
                      {t.confirmUnpayBtn}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Delete Confirmation Modal (with Safe Linked-Expense Choice) */}
      {deleteTargetBill &&
        (() => {
          const linkedExpense = findLinkedExpenseForBill(expenses, deleteTargetBill);
          return (
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
                      {t.confirmDeleteTitle}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {linkedExpense ? t.confirmDeletePaidBody : t.confirmDeleteBody}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-yellow-300 pt-1 tabular-nums">
                      {deleteTargetBill.name} · {formatPKR(deleteTargetBill.amount)}
                    </p>
                  </div>
                </div>

                {linkedExpense ? (
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete('remove')}
                      className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold"
                    >
                      {t.deleteBillAndExpenseBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete('keep')}
                      className="w-full h-11 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm font-bold"
                    >
                      {t.deleteBillOnlyBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetBill(null)}
                      className="w-full h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
                    >
                      {t.cancelBtn}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTargetBill(null)}
                      className="h-11 rounded-xl bg-slate-100 dark:bg-[#061026] text-slate-700 dark:text-slate-300 text-sm font-bold"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete('keep')}
                      className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
                    >
                      {t.deleteBtn}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
};
