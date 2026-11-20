import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaidiinteractive.easyday',
  appName: 'EasyDay',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'easyday-13712.firebaseapp.com',
      '*.firebaseapp.com',
      '*.googleapis.com',
    ],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#040D21',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#040D21',
    },
  },
};

export default config;
