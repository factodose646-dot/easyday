package com.zaidiinteractive.easyday;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "DataBackup")
public class DataBackupPlugin extends Plugin {

    private static final long MAX_IMPORT_BYTES = 30L * 1024L * 1024L; // 30 MB safety cap

    @PluginMethod
    public void saveJsonWithPicker(PluginCall call) {
        String rawFilename = call.getString("filename", "EasyDay-Backup.json");
        String content = call.getString("content");

        if (content == null || content.isEmpty()) {
            call.reject("Backup content is missing.");
            return;
        }

        String safeFilename = sanitizeJsonFilename(rawFilename);

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, safeFilename);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            intent.putExtra(
                DocumentsContract.EXTRA_INITIAL_URI,
                MediaStore.Downloads.EXTERNAL_CONTENT_URI
            );
        }

        try {
            startActivityForResult(call, intent, "handleSaveJsonResult");
        } catch (ActivityNotFoundException ex) {
            call.reject("No file manager available on this device.", ex);
        }
    }

    @ActivityCallback
    private void handleSaveJsonResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_CANCELED || result.getData() == null) {
            JSObject res = new JSObject();
            res.put("saved", false);
            res.put("cancelled", true);
            call.resolve(res);
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            JSObject res = new JSObject();
            res.put("saved", false);
            res.put("cancelled", true);
            call.resolve(res);
            return;
        }

        String content = call.getString("content");
        String fallbackName = sanitizeJsonFilename(
            call.getString("filename", "EasyDay-Backup.json")
        );
        if (content == null || content.isEmpty()) {
            call.reject("Backup data was lost while waiting for folder picker.");
            return;
        }

        byte[] jsonBytes = content.getBytes(StandardCharsets.UTF_8);
        ContentResolver resolver = getContext().getContentResolver();
        try {
            OutputStream outputStream = openWritableStream(resolver, uri);
            if (outputStream == null) {
                call.reject("Could not open selected location for writing.");
                return;
            }
            try (BufferedOutputStream out = new BufferedOutputStream(outputStream)) {
                out.write(jsonBytes);
                out.flush();
            }
        } catch (IOException ex) {
            call.reject("Failed writing backup file: " + ex.getMessage(), ex);
            return;
        }

        String displayName = queryDisplayName(resolver, uri, fallbackName);
        String displayPath = buildReadablePath(uri, displayName);

        JSObject res = new JSObject();
        res.put("saved", true);
        res.put("cancelled", false);
        res.put("uri", uri.toString());
        res.put("displayName", displayName);
        res.put("displayPath", displayPath);
        call.resolve(res);
    }

    @PluginMethod
    public void shareJsonFile(PluginCall call) {
        String rawFilename = call.getString("filename", "EasyDay-Backup.json");
        String content = call.getString("content");
        String title = call.getString("title", "EasyDay Backup");

        if (content == null || content.isEmpty()) {
            call.reject("Backup content is missing.");
            return;
        }

        String safeFilename = sanitizeJsonFilename(rawFilename);
        byte[] jsonBytes = content.getBytes(StandardCharsets.UTF_8);

        File exportDir = new File(getContext().getCacheDir(), "backup_exports");
        if (!exportDir.exists() && !exportDir.mkdirs()) {
            call.reject("Could not create temporary backup folder.");
            return;
        }

        cleanupOldCacheExports(exportDir);

        File outFile = new File(exportDir, safeFilename);
        try (FileOutputStream fos = new FileOutputStream(outFile, false)) {
            fos.write(jsonBytes);
            fos.flush();
        } catch (IOException ex) {
            call.reject("Failed preparing backup for sharing: " + ex.getMessage(), ex);
            return;
        }

        Uri contentUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            outFile
        );

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("application/json");
        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, safeFilename);
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent chooser = Intent.createChooser(shareIntent, title);
        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        try {
            Activity activity = getActivity();
            if (activity != null) {
                activity.startActivity(chooser);
            } else {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(chooser);
            }
            JSObject res = new JSObject();
            res.put("shared", true);
            res.put("displayName", safeFilename);
            call.resolve(res);
        } catch (ActivityNotFoundException ex) {
            call.reject("No app available to share this backup.", ex);
        }
    }

    @PluginMethod
    public void openJsonWithPicker(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(
            Intent.EXTRA_MIME_TYPES,
            new String[] { "application/json", "text/plain", "application/octet-stream" }
        );

        try {
            startActivityForResult(call, intent, "handleOpenJsonResult");
        } catch (ActivityNotFoundException ex) {
            call.reject("No file picker available on this device.", ex);
        }
    }

    @ActivityCallback
    private void handleOpenJsonResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_CANCELED || result.getData() == null) {
            JSObject res = new JSObject();
            res.put("cancelled", true);
            call.resolve(res);
            return;
        }

        Uri uri = result.getData().getData();
        if (uri == null) {
            JSObject res = new JSObject();
            res.put("cancelled", true);
            call.resolve(res);
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        String displayName = queryDisplayName(resolver, uri, "backup.json");

        try (InputStream is = resolver.openInputStream(uri)) {
            if (is == null) {
                call.reject("Could not read selected backup file.");
                return;
            }
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[16384];
            long total = 0L;
            int read;
            while ((read = is.read(chunk)) != -1) {
                total += read;
                if (total > MAX_IMPORT_BYTES) {
                    call.reject("Selected backup file exceeds 30 MB limit.");
                    return;
                }
                buffer.write(chunk, 0, read);
            }
            String content = buffer.toString(StandardCharsets.UTF_8.name());

            JSObject res = new JSObject();
            res.put("cancelled", false);
            res.put("displayName", displayName);
            res.put("sizeBytes", total);
            res.put("content", content);
            call.resolve(res);
        } catch (IOException ex) {
            call.reject("Failed reading backup file: " + ex.getMessage(), ex);
        }
    }

    private OutputStream openWritableStream(ContentResolver resolver, Uri uri) throws IOException {
        try {
            OutputStream stream = resolver.openOutputStream(uri, "wt");
            if (stream != null) {
                return stream;
            }
        } catch (Exception ignored) {
            // Fallback to default write mode for providers rejecting "wt"
        }
        return resolver.openOutputStream(uri);
    }

    private String sanitizeJsonFilename(String rawFilename) {
        String cleaned = (rawFilename == null ? "" : rawFilename.trim())
            .replaceAll("[\\\\/:*?\"<>|]", "_");
        if (cleaned.isEmpty()) {
            cleaned = "EasyDay-Backup.json";
        }
        if (!cleaned.toLowerCase().endsWith(".json")) {
            cleaned = cleaned + ".json";
        }
        return cleaned;
    }

    private String queryDisplayName(ContentResolver resolver, Uri uri, String fallbackName) {
        try (Cursor cursor = resolver.query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) {
                    String name = cursor.getString(idx);
                    if (name != null && !name.trim().isEmpty()) {
                        return name.trim();
                    }
                }
            }
        } catch (Exception ignored) {
            // Fallback below
        }
        return fallbackName;
    }

    private String buildReadablePath(Uri uri, String displayName) {
        try {
            String docId;
            if (DocumentsContract.isDocumentUri(getContext(), uri)) {
                docId = DocumentsContract.getDocumentId(uri);
            } else {
                docId = uri.getLastPathSegment();
            }

            if (docId != null && docId.contains(":")) {
                int colon = docId.indexOf(':');
                String root = docId.substring(0, colon);
                String rel = docId.substring(colon + 1);
                String prefix = "primary".equalsIgnoreCase(root) ? "Internal Storage" : root;
                if (!rel.isEmpty()) {
                    return prefix + "/" + rel;
                }
            }

            String authority = uri.getAuthority();
            if (authority != null && authority.contains("downloads")) {
                return "Downloads/" + displayName;
            }
        } catch (Exception ignored) {
            // Fallback below
        }
        return displayName;
    }

    private void cleanupOldCacheExports(File exportDir) {
        File[] files = exportDir.listFiles();
        if (files == null) {
            return;
        }
        long cutoff = System.currentTimeMillis() - (60L * 60L * 1000L);
        for (File f : files) {
            if (f.isFile() && f.lastModified() < cutoff) {
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
        }
    }
}
