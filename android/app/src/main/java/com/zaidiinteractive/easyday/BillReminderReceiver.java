package com.zaidiinteractive.easyday;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class BillReminderReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "easyday_bills_channel";
    public static final String PREFS_NAME = "easyday_bill_reminders";
    public static final String PREFS_KEY_SCHEDULED = "scheduled_json";
    public static final String EXTRA_NOTIFICATION_ID = "notificationId";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) {
            return;
        }
        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 1001);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        if (title == null || title.trim().isEmpty()) {
            title = "EasyDay Bill Reminder";
        }
        if (body == null || body.trim().isEmpty()) {
            body = "You have an upcoming bill payment due.";
        }
        postNotification(context, notificationId, title, body);
    }

    public static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) {
                return;
            }
            NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Bills & Payment Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Upcoming and overdue bill alerts from EasyDay");
                channel.enableLights(true);
                channel.setLightColor(Color.CYAN);
                channel.enableVibration(true);
                manager.createNotificationChannel(channel);
            }
        }
    }

    public static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return false;
            }
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    public static boolean postNotification(
        Context context,
        int notificationId,
        String title,
        String body
    ) {
        ensureNotificationChannel(context);
        if (!hasNotificationPermission(context)) {
            return false;
        }

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            notificationId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_easyday_bill)
            .setColor(Color.parseColor("#06B6D4"))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentIntent);

        try {
            NotificationManagerCompat.from(context).notify(notificationId, builder.build());
            return true;
        } catch (SecurityException ignored) {
            return false;
        }
    }

    public static void scheduleAlarm(
        Context context,
        int requestCode,
        String title,
        String body,
        long triggerAtMillis
    ) {
        ensureNotificationChannel(context);
        AlarmManager alarmManager =
            (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        Intent intent = new Intent(context, BillReminderReceiver.class);
        intent.putExtra(EXTRA_NOTIFICATION_ID, requestCode);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_BODY, body);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long safeTrigger = Math.max(System.currentTimeMillis() + 3000L, triggerAtMillis);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        safeTrigger,
                        pendingIntent
                    );
                } else {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        safeTrigger,
                        pendingIntent
                    );
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    safeTrigger,
                    pendingIntent
                );
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    safeTrigger,
                    pendingIntent
                );
            }
        } catch (SecurityException ex) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                safeTrigger,
                pendingIntent
            );
        }
    }

    public static void cancelAlarm(Context context, int requestCode) {
        AlarmManager alarmManager =
            (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, BillReminderReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
        );
        if (pendingIntent != null && alarmManager != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        NotificationManagerCompat.from(context).cancel(requestCode);
    }

    public static void rescheduleAllFromPrefs(Context context) {
        SharedPreferences prefs =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String rawJson = prefs.getString(PREFS_KEY_SCHEDULED, "[]");
        long now = System.currentTimeMillis();
        try {
            JSONArray array = new JSONArray(rawJson);
            for (int i = 0; i < array.length(); i++) {
                JSONObject item = array.optJSONObject(i);
                if (item == null) {
                    continue;
                }
                int requestCode = item.optInt("requestCode", 0);
                long triggerAtMillis = item.optLong("triggerAtMillis", 0L);
                String title = item.optString("title", "EasyDay Bill Reminder");
                String body = item.optString("body", "");
                if (requestCode > 0 && triggerAtMillis > now - 60_000L) {
                    scheduleAlarm(context, requestCode, title, body, triggerAtMillis);
                }
            }
        } catch (JSONException ignored) {
            // Ignore malformed cache
        }
    }
}
