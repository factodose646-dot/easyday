package com.zaidiinteractive.easyday;

import android.Manifest;
import android.app.AlarmManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "BillReminder",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class BillReminderPlugin extends Plugin {

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        call.resolve(buildPermissionStatusObject());
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            call.resolve(buildPermissionStatusObject());
            return;
        }

        if (
            ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            call.resolve(buildPermissionStatusObject());
            return;
        }

        requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        if (call == null) {
            return;
        }
        boolean aliasGranted =
            getPermissionState("notifications") == PermissionState.GRANTED;
        JSObject status = buildPermissionStatusObject();
        if (aliasGranted && !status.optBoolean("granted", false)) {
            status.put("granted", true);
            status.put("status", "granted");
        }
        call.resolve(status);
    }

    @PluginMethod
    public void syncReminders(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(
            BillReminderReceiver.PREFS_NAME,
            Context.MODE_PRIVATE
        );

        // Cancel previously scheduled alarms before applying updated set
        String oldRaw = prefs.getString(BillReminderReceiver.PREFS_KEY_SCHEDULED, "[]");
        try {
            JSONArray oldArray = new JSONArray(oldRaw);
            for (int i = 0; i < oldArray.length(); i++) {
                JSONObject item = oldArray.optJSONObject(i);
                if (item != null) {
                    int reqCode = item.optInt("requestCode", 0);
                    if (reqCode > 0) {
                        BillReminderReceiver.cancelAlarm(context, reqCode);
                    }
                }
            }
        } catch (JSONException ignored) {
            // Ignore malformed previous payload
        }

        JSArray incoming = call.getArray("reminders");
        JSONArray sanitized = new JSONArray();
        int scheduledCount = 0;
        long now = System.currentTimeMillis();

        if (incoming != null) {
            for (int i = 0; i < incoming.length(); i++) {
                JSONObject item = incoming.optJSONObject(i);
                if (item == null) {
                    continue;
                }
                int requestCode = item.optInt("requestCode", 0);
                String title = item.optString("title", "");
                String body = item.optString("body", "");
                long triggerAtMillis = item.optLong("triggerAtMillis", 0L);

                if (requestCode <= 0 || triggerAtMillis <= now - 60_000L) {
                    continue;
                }

                BillReminderReceiver.scheduleAlarm(
                    context,
                    requestCode,
                    title,
                    body,
                    triggerAtMillis
                );
                sanitized.put(item);
                scheduledCount++;
            }
        }

        prefs
            .edit()
            .putString(BillReminderReceiver.PREFS_KEY_SCHEDULED, sanitized.toString())
            .apply();

        JSObject res = new JSObject();
        res.put("scheduledCount", scheduledCount);
        call.resolve(res);
    }

    @PluginMethod
    public void showImmediateNotification(PluginCall call) {
        int requestCode = call.getInt("requestCode", (int) (System.currentTimeMillis() % 100000));
        String title = call.getString("title", "EasyDay Bill Reminder");
        String body = call.getString("body", "");
        boolean shown = BillReminderReceiver.postNotification(
            getContext(),
            requestCode,
            title,
            body
        );
        JSObject res = new JSObject();
        res.put("shown", shown);
        call.resolve(res);
    }

    @PluginMethod
    public void cancelReminder(PluginCall call) {
        int requestCode = call.getInt("requestCode", 0);
        if (requestCode > 0) {
            BillReminderReceiver.cancelAlarm(getContext(), requestCode);
        }
        JSObject res = new JSObject();
        res.put("cancelled", true);
        call.resolve(res);
    }

    private JSObject buildPermissionStatusObject() {
        Context context = getContext();
        boolean systemEnabled = NotificationManagerCompat.from(context).areNotificationsEnabled();
        boolean runtimeGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            runtimeGranted =
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED;
        }
        boolean granted = systemEnabled && runtimeGranted;

        boolean exactAlarmAllowed = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager =
                (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            exactAlarmAllowed = alarmManager != null && alarmManager.canScheduleExactAlarms();
        }

        JSObject res = new JSObject();
        res.put("granted", granted);
        res.put("notificationsEnabled", systemEnabled);
        res.put("exactAlarmAllowed", exactAlarmAllowed);
        res.put("status", granted ? "granted" : "prompt");
        return res;
    }
}
