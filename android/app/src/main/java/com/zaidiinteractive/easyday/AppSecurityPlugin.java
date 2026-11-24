package com.zaidiinteractive.easyday;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "AppSecurity")
public class AppSecurityPlugin extends Plugin {

    private static final int ALLOWED_AUTHENTICATORS =
        BiometricManager.Authenticators.BIOMETRIC_STRONG |
        BiometricManager.Authenticators.BIOMETRIC_WEAK;

    @PluginMethod
    public void checkBiometricAvailability(PluginCall call) {
        Context context = getContext();
        if (context == null) {
            JSObject res = new JSObject();
            res.put("available", false);
            res.put("status", "unknown");
            call.resolve(res);
            return;
        }

        BiometricManager biometricManager = BiometricManager.from(context);
        int authState = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS);

        JSObject res = new JSObject();
        res.put("available", authState == BiometricManager.BIOMETRIC_SUCCESS);
        res.put("status", mapBiometricManagerStatus(authState));
        call.resolve(res);
    }

    @PluginMethod
    public void authenticateBiometric(PluginCall call) {
        AppCompatActivity activity = getActivity();
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) {
            JSObject res = new JSObject();
            res.put("status", "unavailable");
            res.put("message", "Activity is not active for biometric authentication.");
            call.resolve(res);
            return;
        }

        BiometricManager biometricManager = BiometricManager.from(activity);
        int authState = biometricManager.canAuthenticate(ALLOWED_AUTHENTICATORS);
        if (authState != BiometricManager.BIOMETRIC_SUCCESS) {
            JSObject res = new JSObject();
            res.put("status", "unavailable");
            res.put("availabilityStatus", mapBiometricManagerStatus(authState));
            res.put("message", "Biometric authentication is unavailable or not enrolled on this device.");
            call.resolve(res);
            return;
        }

        String title = call.getString("title", "Unlock EasyDay");
        String subtitle = call.getString("subtitle", "Verify your fingerprint or biometrics to continue");
        String negativeText = call.getString("negativeButtonText", "Use PIN");

        activity.runOnUiThread(() -> {
            AtomicBoolean settled = new AtomicBoolean(false);
            Executor executor = ContextCompat.getMainExecutor(activity);

            BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    if (settled.compareAndSet(false, true)) {
                        JSObject res = new JSObject();
                        res.put("status", "success");
                        call.resolve(res);
                    }
                }

                @Override
                public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    if (!settled.compareAndSet(false, true)) {
                        return;
                    }
                    JSObject res = new JSObject();
                    res.put("errorCode", errorCode);
                    res.put("message", errString != null ? errString.toString() : "");

                    if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                        res.put("status", "fallback");
                    } else if (
                        errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                        errorCode == BiometricPrompt.ERROR_CANCELED
                    ) {
                        res.put("status", "cancelled");
                    } else if (
                        errorCode == BiometricPrompt.ERROR_LOCKOUT ||
                        errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT
                    ) {
                        res.put("status", "lockout");
                        res.put("permanent", errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT);
                    } else if (
                        errorCode == BiometricPrompt.ERROR_NO_BIOMETRICS ||
                        errorCode == BiometricPrompt.ERROR_HW_NOT_PRESENT ||
                        errorCode == BiometricPrompt.ERROR_HW_UNAVAILABLE ||
                        errorCode == BiometricPrompt.ERROR_SECURITY_UPDATE_REQUIRED
                    ) {
                        res.put("status", "unavailable");
                    } else {
                        res.put("status", "failed");
                    }
                    call.resolve(res);
                }

                @Override
                public void onAuthenticationFailed() {
                    // System sheet remains visible for subsequent finger attempts until succeeded, error, or lockout.
                    super.onAuthenticationFailed();
                }
            };

            try {
                BiometricPrompt prompt = new BiometricPrompt(activity, executor, callback);
                BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title != null && !title.trim().isEmpty() ? title : "Unlock EasyDay")
                    .setNegativeButtonText(
                        negativeText != null && !negativeText.trim().isEmpty() ? negativeText : "Use PIN"
                    )
                    .setAllowedAuthenticators(ALLOWED_AUTHENTICATORS)
                    .setConfirmationRequired(false);

                if (subtitle != null && !subtitle.trim().isEmpty()) {
                    builder.setSubtitle(subtitle);
                }

                prompt.authenticate(builder.build());
            } catch (Exception ex) {
                if (settled.compareAndSet(false, true)) {
                    JSObject res = new JSObject();
                    res.put("status", "failed");
                    res.put("message", ex.getMessage() != null ? ex.getMessage() : "Unable to start biometric prompt.");
                    call.resolve(res);
                }
            }
        });
    }

    private String mapBiometricManagerStatus(int code) {
        switch (code) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return "available";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "none_enrolled";
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "no_hardware";
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "hw_unavailable";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "security_update_required";
            default:
                return "unknown";
        }
    }
}
