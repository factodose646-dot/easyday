import { Language } from '../types';
import {
  cancelAndroidBillReminder,
  checkAndroidNotificationPermission,
  requestAndroidNotificationPermission,
  ScheduledBillReminderPayload,
  showAndroidBillNotification,
  syncAndroidBillReminders,
} from './androidBridge';
import {
  buildReminderRequestCode,
  computeBillStatus,
  computeReminderTriggerTimestamp,
  diffDaysISO,
} from './billsEngine';
import { BillItem, billsStorage, getTodayISO } from './storage';
import { formatPKR } from './udhaarEngine';

export interface NotificationSyncSummary {
  scheduledCount: number;
  overdueAlertCount: number;
  permissionGranted: boolean;
}

function formatReminderTitle(bill: BillItem, lang: Language, isOverdue: boolean): string {
  if (isOverdue) {
    return lang === 'ur'
      ? `واجب الادا بل کی تاریخ گزر چکی: ${bill.name}`
      : `Overdue Bill: ${bill.name}`;
  }
  return lang === 'ur'
    ? `بل کی یاد دہانی: ${bill.name}`
    : `Bill Payment Reminder: ${bill.name}`;
}

function formatReminderBody(
  bill: BillItem,
  lang: Language,
  isOverdue: boolean,
  daysLateOrLeft: number
): string {
  const amt = formatPKR(bill.amount);
  const providerPart = bill.provider ? ` (${bill.provider})` : '';
  if (isOverdue) {
    return lang === 'ur'
      ? `${amt}${providerPart} · ${daysLateOrLeft} دن تاخیر (آخری تاریخ: ${bill.dueDate})`
      : `${amt}${providerPart} · ${daysLateOrLeft} day(s) overdue (Due ${bill.dueDate})`;
  }
  return lang === 'ur'
    ? `${amt}${providerPart} کی آخری تاریخ ${bill.dueDate} ہے`
    : `${amt}${providerPart} is due on ${bill.dueDate}`;
}

/**
 * Synchronizes all pending bill reminders with native Android AlarmManager
 * (preventing duplicates via deterministic request codes) and fires deduplicated
 * overdue notifications once per bill cycle.
 */
export async function syncAllBillRemindersAndOverdueAlerts(
  bills: BillItem[],
  lang: Language
): Promise<NotificationSyncSummary> {
  const todayISO = getTodayISO();
  const now = Date.now();
  const perm = await checkAndroidNotificationPermission();

  const scheduledPayloads: ScheduledBillReminderPayload[] = [];
  const seenKeys = new Set<string>();

  for (const bill of bills) {
    const status = computeBillStatus(bill, todayISO);
    if (status === 'paid') {
      // Ensure cancelled if previously scheduled
      const key = `bill-upcoming:${bill.id}:${bill.dueDate}:${bill.reminderTiming}`;
      void cancelAndroidBillReminder(buildReminderRequestCode(key));
      continue;
    }

    const triggerMs = computeReminderTriggerTimestamp(
      bill.dueDate,
      bill.reminderTiming
    );
    if (!triggerMs) continue;

    // Schedule upcoming reminder if it has not passed yet (or is still due today/future)
    if (triggerMs > now - 60_000) {
      const dedupeKey = `bill-upcoming:${bill.id}:${bill.dueDate}:${bill.reminderTiming}`;
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        scheduledPayloads.push({
          id: dedupeKey,
          requestCode: buildReminderRequestCode(dedupeKey),
          title: formatReminderTitle(bill, lang, false),
          body: formatReminderBody(bill, lang, false, 0),
          triggerAtMillis: Math.max(now + 4000, triggerMs),
        });
      }
    }
  }

  const scheduledCount = await syncAndroidBillReminders(scheduledPayloads);

  // Deduplicated Overdue Notifications
  const alreadyNotified = new Set(billsStorage.loadOverdueNotifiedKeys());
  let overdueAlertCount = 0;

  if (perm.granted) {
    for (const bill of bills) {
      const status = computeBillStatus(bill, todayISO);
      if (status !== 'overdue') continue;

      const overdueKey = `overdue:${bill.id}:${bill.dueDate}`;
      if (alreadyNotified.has(overdueKey)) continue;

      const daysLate = Math.max(1, diffDaysISO(bill.dueDate, todayISO));
      const shown = await showAndroidBillNotification(
        buildReminderRequestCode(overdueKey),
        formatReminderTitle(bill, lang, true),
        formatReminderBody(bill, lang, true, daysLate)
      );
      if (shown) {
        alreadyNotified.add(overdueKey);
        overdueAlertCount += 1;
      }
    }
    if (overdueAlertCount > 0) {
      billsStorage.saveOverdueNotifiedKeys(Array.from(alreadyNotified));
    }
  }

  return {
    scheduledCount,
    overdueAlertCount,
    permissionGranted: perm.granted,
  };
}

export async function requestAndSyncBillNotifications(
  bills: BillItem[],
  lang: Language
): Promise<NotificationSyncSummary> {
  await requestAndroidNotificationPermission();
  return syncAllBillRemindersAndOverdueAlerts(bills, lang);
}
