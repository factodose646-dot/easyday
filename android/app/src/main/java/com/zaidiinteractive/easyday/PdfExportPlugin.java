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
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "PdfExport")
public class PdfExportPlugin extends Plugin {

    @PluginMethod
    public void savePdfWithPicker(PluginCall call) {
        String rawFilename = call.getString("filename", "EasyDay-Expense-Report.pdf");
        String base64Data = call.getString("base64Data");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("PDF data is missing.");
            return;
        }

        String safeFilename = sanitizeFilename(rawFilename);

        try {
            // Validate base64 early before launching picker
            Base64.decode(base64Data, Base64.DEFAULT);
        } catch (IllegalArgumentException ex) {
            call.reject("Invalid PDF binary encoding.", ex);
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_TITLE, safeFilename);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            intent.putExtra(
                DocumentsContract.EXTRA_INITIAL_URI,
                MediaStore.Downloads.EXTERNAL_CONTENT_URI
            );
        }

        try {
            startActivityForResult(call, intent, "handleSaveDocumentResult");
        } catch (ActivityNotFoundException ex) {
            call.reject("No file manager available on this device.", ex);
        }
    }

    @ActivityCallback
    private void handleSaveDocumentResult(PluginCall call, ActivityResult result) {
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

        String base64Data = call.getString("base64Data");
        String fallbackName = sanitizeFilename(call.getString("filename", "EasyDay-Expense-Report.pdf"));
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("PDF payload was lost while waiting for file picker.");
            return;
        }

        byte[] pdfBytes;
        try {
            pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (IllegalArgumentException ex) {
            call.reject("Invalid PDF data.", ex);
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        try {
            OutputStream outputStream = openWritableStream(resolver, uri);
            if (outputStream == null) {
                call.reject("Could not open selected location for writing.");
                return;
            }
            try (OutputStream out = outputStream) {
                out.write(pdfBytes);
                out.flush();
            }
        } catch (IOException ex) {
            call.reject("Failed writing PDF to selected location: " + ex.getMessage(), ex);
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
    public void sharePdf(PluginCall call) {
        String rawFilename = call.getString("filename", "EasyDay-Expense-Report.pdf");
        String base64Data = call.getString("base64Data");
        String title = call.getString("title", "EasyDay Expense Report");
        String caption = call.getString("caption", "");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("PDF data is missing.");
            return;
        }

        String safeFilename = sanitizeFilename(rawFilename);
        byte[] pdfBytes;
        try {
            pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (IllegalArgumentException ex) {
            call.reject("Invalid PDF data.", ex);
            return;
        }

        File exportDir = new File(getContext().getCacheDir(), "pdf_exports");
        if (!exportDir.exists() && !exportDir.mkdirs()) {
            call.reject("Could not create temporary export folder.");
            return;
        }

        cleanupOldCacheExports(exportDir);

        File outFile = new File(exportDir, safeFilename);
        try (FileOutputStream fos = new FileOutputStream(outFile, false)) {
            fos.write(pdfBytes);
            fos.flush();
        } catch (IOException ex) {
            call.reject("Failed preparing PDF for sharing: " + ex.getMessage(), ex);
            return;
        }

        Uri contentUri = FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            outFile
        );

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("application/pdf");
        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
        shareIntent.putExtra(Intent.EXTRA_SUBJECT, safeFilename);
        if (caption != null && !caption.trim().isEmpty()) {
            shareIntent.putExtra(Intent.EXTRA_TEXT, caption);
        }
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
            call.reject("No app available to share this PDF.", ex);
        }
    }

    @PluginMethod
    public void openPdfUri(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr == null || uriStr.isEmpty()) {
            call.reject("PDF URI is required.");
            return;
        }

        Uri uri = Uri.parse(uriStr);
        Intent viewIntent = new Intent(Intent.ACTION_VIEW);
        viewIntent.setDataAndType(uri, "application/pdf");
        viewIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            getContext().startActivity(viewIntent);
            JSObject res = new JSObject();
            res.put("opened", true);
            call.resolve(res);
        } catch (ActivityNotFoundException ex) {
            JSObject res = new JSObject();
            res.put("opened", false);
            res.put("reason", "no_viewer");
            call.resolve(res);
        }
    }

    @PluginMethod
    public void shareText(PluginCall call) {
        String text = call.getString("text", "");
        String title = call.getString("title", "EasyDay");
        if (text == null || text.trim().isEmpty()) {
            call.reject("Text content is required.");
            return;
        }

        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType("text/plain");
        sendIntent.putExtra(Intent.EXTRA_SUBJECT, title);
        sendIntent.putExtra(Intent.EXTRA_TEXT, text);

        Intent chooser = Intent.createChooser(sendIntent, title);
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
            call.resolve(res);
        } catch (ActivityNotFoundException ex) {
            call.reject("No app available to share this text.", ex);
        }
    }

    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        String url = call.getString("url", "");
        if (url == null || (!url.startsWith("https://") && !url.startsWith("http://"))) {
            call.reject("Only valid http/https URLs are supported.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            Activity activity = getActivity();
            if (activity != null) {
                activity.startActivity(intent);
            } else {
                getContext().startActivity(intent);
            }
            JSObject res = new JSObject();
            res.put("opened", true);
            call.resolve(res);
        } catch (ActivityNotFoundException ex) {
            JSObject res = new JSObject();
            res.put("opened", false);
            call.resolve(res);
        }
    }

    private OutputStream openWritableStream(ContentResolver resolver, Uri uri) throws IOException {
        try {
            OutputStream stream = resolver.openOutputStream(uri, "wt");
            if (stream != null) {
                return stream;
            }
        } catch (Exception ignored) {
            // Some third-party document providers reject "wt"; fallback to default mode.
        }
        return resolver.openOutputStream(uri);
    }

    private String sanitizeFilename(String rawFilename) {
        String cleaned = (rawFilename == null ? "" : rawFilename.trim())
            .replaceAll("[\\\\/:*?\"<>|]", "_");
        if (cleaned.isEmpty()) {
            cleaned = "EasyDay-Expense-Report.pdf";
        }
        if (!cleaned.toLowerCase().endsWith(".pdf")) {
            cleaned = cleaned + ".pdf";
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
            String docId = null;
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
            // Fallback to displayName
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
