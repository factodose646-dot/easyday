package com.zaidiinteractive.easyday;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PdfExportPlugin.class);
        registerPlugin(BillReminderPlugin.class);
        registerPlugin(DataBackupPlugin.class);
        registerPlugin(AppSecurityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
