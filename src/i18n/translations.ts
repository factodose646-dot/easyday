import { Language, NavTab, ToolCategory, ToolId } from '../types';

export interface TranslationBundle {
  brand: {
    name: string;
    tagline: string;
    developerLabel: string;
    developerName: string;
    distributionLabel: string;
    storeName: string;
  };
  nav: Record<NavTab, string>;
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
    subtitle: string;
  };
  dashboard: {
    searchPlaceholder: string;
    clearSearch: string;
    searchResultsTitle: string;
    noToolsFound: string;
    resetSearch: string;
    spotlightHeading: string;
    udhaarSpotlightBadge: string;
    udhaarSpotlightTitle: string;
    udhaarSpotlightBody: string;
    udhaarSpotlightCta: string;
    udhaarReceivableHint: string;
    udhaarPayableHint: string;
    billsSpotlightBadge: string;
    billsSpotlightTitle: string;
    billsSpotlightBody: string;
    billsSpotlightCta: string;
    billsUpcomingHint: string;
    billsOverdueHint: string;
    featuredTools: string;
    viewAllTools: string;
    recentlyUsed: string;
    recentHint: string;
    quickAccess: string;
    announcementLabel: string;
    announcementCtaFallback: string;
    quickActions: {
      openToolsTitle: string;
      openToolsSub: string;
      languageTitle: string;
      languageSub: string;
      themeTitle: string;
      themeLightSub: string;
      themeDarkSub: string;
      settingsTitle: string;
      settingsSub: string;
    };
    financialSummary: {
      title: string;
      subtitle: string;
      toReceiveLabel: string;
      toPayLabel: string;
      outstandingBillsLabel: string;
      totalExpensesLabel: string;
      paymentsReceivedLabel: string;
      paymentsMadeLabel: string;
      paidBillsHint: string;
      debtRepaidHint: string;
    };
    todaySummary: {
      title: string;
      todayExpenses: string;
      toReceive: string;
      toPay: string;
      dueTodayBills: string;
      overdueBills: string;
      upcomingBills: string;
      dueTodayTag: string;
      overdueTag: string;
      upcomingTag: string;
      billsCountLabel: string;
      billSingularLabel: string;
    };
    quickAdd: {
      heading: string;
      addExpense: string;
      addUdhaar: string;
      addNote: string;
    };
    overview: {
      heading: string;
      udhaarTitle: string;
      udhaarToReceive: string;
      udhaarToPay: string;
      udhaarActiveMeta: string;
      billsTitle: string;
      billsPaid: string;
      billsUnpaid: string;
      billsOverdue: string;
      expensesTitle: string;
      expensesToday: string;
      expensesMonthly: string;
      openToolCta: string;
    };
    toolsGrid: {
      heading: string;
      viewDirectory: string;
    };
    fab: {
      openLabel: string;
      closeLabel: string;
      expenseShort: string;
      udhaarShort: string;
      noteShort: string;
    };
  };
  toolsDirectory: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categories: Record<ToolCategory, string>;
    openTool: string;
    phaseLabel: string;
  };
  toolDetail: {
    backToTools: string;
    foundationStatusTitle: string;
    foundationStatusBody: string;
    plannedCapabilities: string;
    returnDirectory: string;
    stepBadge: string;
  };
  tools: Record<
    ToolId,
    {
      name: string;
      shortDesc: string;
      fullDesc: string;
      capabilities: string[];
    }
  >;
  settings: {
    title: string;
    subtitle: string;
    preferencesSection: string;
    languageLabel: string;
    languageDesc: string;
    englishOption: string;
    urduOption: string;
    themeLabel: string;
    themeDesc: string;
    lightTheme: string;
    darkTheme: string;
    aboutSection: string;
    aboutEasyDayTitle: string;
    aboutEasyDayBody: string;
    previewSplashBtn: string;
    developerTitle: string;
    developerBody: string;
    distributedBy: string;
    versionLabel: string;
    versionValue: string;
    buildPhaseLabel: string;
    buildPhaseValue: string;
    privacyTitle: string;
    privacySummary: string;
    privacyPlaceholderBody: string;
    viewPrivacyBtn: string;
    closeBtn: string;
    adminSection: string;
    adminTitle: string;
    adminSummary: string;
    openAdminBtn: string;
    dataSafety: {
      sectionTitle: string;
      cardTitle: string;
      cardSubtitle: string;
      lastBackupLabel: string;
      noBackupWarningTitle: string;
      noBackupWarningBody: string;
      regularBackupTip: string;
      storageHealthLabel: string;
      storageHealthyStatus: string;
      storageNearLimitWarning: string;
      storageCriticalWarning: string;
      photosStoredLabel: string;
      legacyMigratingNote: string;
      saveBackupBtn: string;
      shareBackupBtn: string;
      restoreBackupBtn: string;
      busyExporting: string;
      busySharing: string;
      busyReading: string;
      busyRestoring: string;
      backupSavedTitle: string;
      backupSharedSuccess: string;
      backupCancelled: string;
      restoreModalTitle: string;
      restorePreviewCreated: string;
      restorePreviewAppVersion: string;
      countBills: string;
      countExpenses: string;
      countUdhaarEntries: string;
      countUdhaarContacts: string;
      countKametis: string;
      countNotes: string;
      countPhotos: string;
      restoreWarningExact: string;
      confirmRestoreBtn: string;
      cancelBtn: string;
      restoreSuccessTitle: string;
      restoreSuccessBody: string;
      restoreRolledBackTitle: string;
    };
    security: {
      sectionTitle: string;
      cardTitle: string;
      cardSubtitle: string;
      pinStatusEnabled: string;
      pinStatusDisabled: string;
      pinLengthBadge4: string;
      pinLengthBadge6: string;
      enablePinBtn: string;
      disablePinBtn: string;
      changePinBtn: string;
      biometricTitle: string;
      biometricDesc: string;
      biometricRequiresPinHint: string;
      biometricReadyHint: string;
      biometricNotEnrolledHint: string;
      biometricNoHardwareHint: string;
      biometricHwUnavailableHint: string;
      biometricWebPreviewHint: string;
      biometricEnableModalTitle: string;
      biometricEnableModalBody: string;
      autoLockLabel: string;
      lockOnBackgroundTitle: string;
      lockOnBackgroundDesc: string;
      inactivityLabel: string;
      timeoutBackgroundOnly: string;
      timeout30s: string;
      timeout1m: string;
      timeout5m: string;
      timeout10m: string;
      lockNowBtn: string;
      pinLengthLabel: string;
      pinLength4: string;
      pinLength6: string;
      modalCreateTitle: string;
      modalCreateStep1: string;
      modalCreateStep2: string;
      modalChangeTitle: string;
      modalChangeStepCurrent: string;
      modalChangeStepNew: string;
      modalChangeStepConfirm: string;
      modalDisableTitle: string;
      modalDisableBody: string;
      modalSuccessPinSet: string;
      modalSuccessPinChanged: string;
      modalSuccessPinDisabled: string;
      modalSuccessBiometricEnabled: string;
      modalSuccessBiometricDisabled: string;
      errorMismatch: string;
      errorWrongPin: string;
      errorWrongPinAttempts: string;
      errorLockedOutPrefix: string;
      errorCryptoUnavailable: string;
      cancelBtn: string;
      backStepBtn: string;
      clearBtn: string;
      backspaceAria: string;
      lockScreenTitle: string;
      lockScreenSubtitle: string;
      enterCurrentPinDotsAria: string;
      unlockBiometricBtn: string;
      biometricPromptTitle: string;
      biometricPromptSubtitle: string;
      biometricNegativeBtn: string;
      biometricCancelledMsg: string;
      biometricFallbackMsg: string;
      biometricLockoutMsg: string;
      biometricFailedMsg: string;
      biometricUnavailableMsg: string;
      forgotPinBtn: string;
      recoveryTitle: string;
      recoveryWarningBody: string;
      recoveryDataSafeBox: string;
      recoveryCheckboxLabel: string;
      recoveryConfirmBtn: string;
      recoverySuccessToast: string;
    };
  };
  splash: {
    title: string;
    poweredBy: string;
    distributedBy: string;
    closePreview: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationBundle> = {
  en: {
    brand: {
      name: 'EasyDay',
      tagline: 'make you easy',
      developerLabel: 'Developed by',
      developerName: 'ZAIDI INTERACTIVE',
      distributionLabel: 'Distributed by',
      storeName: 'ZAIDI STORE',
    },
    nav: {
      home: 'Home',
      tools: 'Tools',
      settings: 'Settings',
    },
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      subtitle: 'Your daily finance and utility companion is ready.',
    },
    dashboard: {
      searchPlaceholder: 'Search tools (e.g. Udhaar, Bills, Notes)...',
      clearSearch: 'Clear search',
      searchResultsTitle: 'Matching Tools',
      noToolsFound: 'No tools match your search query.',
      resetSearch: 'Show all tools',
      spotlightHeading: 'Finance & Reminder Spotlights',
      udhaarSpotlightBadge: 'PKR Ledger',
      udhaarSpotlightTitle: 'Udhaar Manager',
      udhaarSpotlightBody:
        'Track money given & borrowed, partial payments, and share WhatsApp statements.',
      udhaarSpotlightCta: 'Open Ledger',
      udhaarReceivableHint: 'To Receive',
      udhaarPayableHint: 'To Pay',
      billsSpotlightBadge: 'Smart Alerts',
      billsSpotlightTitle: 'Bills & Payment Reminder',
      billsSpotlightBody:
        'Manage utility bills, recurring due dates, calendar view & native Android alerts.',
      billsSpotlightCta: 'Manage Bills',
      billsUpcomingHint: 'Upcoming',
      billsOverdueHint: 'Overdue',
      featuredTools: 'Featured Tools',
      viewAllTools: 'All 6 tools',
      recentlyUsed: 'Recently Used',
      recentHint: 'Tap any tool to keep it handy here',
      quickAccess: 'Quick Access',
      announcementLabel: 'Announcement',
      announcementCtaFallback: 'Open Link',
      quickActions: {
        openToolsTitle: 'Tools Directory',
        openToolsSub: 'Browse all 6 everyday tools',
        languageTitle: 'App Language',
        languageSub: 'Switch to اردو (RTL)',
        themeTitle: 'Appearance',
        themeLightSub: 'Currently Light · Tap for Dark',
        themeDarkSub: 'Currently Dark · Tap for Light',
        settingsTitle: 'Settings',
        settingsSub: 'Language, theme & preferences',
      },
      financialSummary: {
        title: 'Smart Financial Summary',
        subtitle: 'Live non-duplicated totals across Bills, Udhaar & Expenses',
        toReceiveLabel: 'Money to Receive',
        toPayLabel: 'Money to Pay',
        outstandingBillsLabel: 'Outstanding Bills',
        totalExpensesLabel: 'Total Expenses',
        paymentsReceivedLabel: 'Payments Received',
        paymentsMadeLabel: 'Payments Made',
        paidBillsHint: 'Includes paid bills:',
        debtRepaidHint: 'Udhaar repayments (cash outflow)',
      },
      todaySummary: {
        title: "Today's Summary",
        todayExpenses: "Today's Expenses",
        toReceive: 'To Receive (Lena Hai)',
        toPay: 'To Pay (Dena Hai)',
        dueTodayBills: 'Due Today',
        overdueBills: 'Overdue Bills',
        upcomingBills: 'Upcoming Bills',
        dueTodayTag: 'Due Today',
        overdueTag: 'Overdue',
        upcomingTag: 'Upcoming',
        billsCountLabel: 'bills',
        billSingularLabel: 'bill',
      },
      quickAdd: {
        heading: 'Quick Add',
        addExpense: 'Add Expense',
        addUdhaar: 'Add Udhaar',
        addNote: 'Add Note',
      },
      overview: {
        heading: 'Financial Overview',
        udhaarTitle: 'Udhaar Overview',
        udhaarToReceive: 'Money to Receive',
        udhaarToPay: 'Money to Pay',
        udhaarActiveMeta: 'active entries',
        billsTitle: 'Bills Overview',
        billsPaid: 'Paid (This Month)',
        billsUnpaid: 'Unpaid',
        billsOverdue: 'Overdue',
        expensesTitle: 'Expenses Overview',
        expensesToday: "Today's Spending",
        expensesMonthly: 'Monthly Spending',
        openToolCta: 'Open',
      },
      toolsGrid: {
        heading: 'All Tools',
        viewDirectory: 'Directory',
      },
      fab: {
        openLabel: 'Quick add',
        closeLabel: 'Close quick add',
        expenseShort: 'Expense',
        udhaarShort: 'Udhaar',
        noteShort: 'Note',
      },
    },
    toolsDirectory: {
      title: 'Tools Directory',
      subtitle: 'Six essential Android utilities designed for everyday clarity and speed.',
      searchPlaceholder: 'Filter tools by name or task...',
      categories: {
        all: 'All Tools',
        utilities: 'Utilities',
        productivity: 'Productivity',
        finance: 'Finance',
      },
      openTool: 'Open',
      phaseLabel: 'Ready',
    },
    toolDetail: {
      backToTools: 'Back',
      foundationStatusTitle: 'Tool Workspace',
      foundationStatusBody: 'All data stays safely stored on your device.',
      plannedCapabilities: 'Capabilities',
      returnDirectory: 'Return to Tools Directory',
      stepBadge: 'Ready',
    },
    tools: {
      'udhaar-manager': {
        name: 'Udhaar Manager',
        shortDesc: 'Track money given & borrowed, partial payments & WhatsApp statements.',
        fullDesc:
          'Complete personal and business Udhaar ledger tailored for Pakistan with contact balances, partial payments, and shareable WhatsApp summaries.',
        capabilities: [
          'Money given (Mujhe lene hain) & borrowed (Mujhe dene hain) ledgers',
          'Partial & full payment tracking with automatic remaining balances',
          'WhatsApp account statements & monthly summaries',
        ],
      },
      'bills-reminder': {
        name: 'Bills & Payment Reminder',
        shortDesc: 'Schedule utility bills, recurring cycles & Android due notifications.',
        fullDesc:
          'Stay ahead of electricity, gas, water, Wi-Fi, rent, and school fee deadlines with native Android notifications and calendar tracking.',
        capabilities: [
          'Native Android due-date & overdue notifications',
          'Monthly & custom recurring bill auto-generation',
          'Calendar view, bill photo attachment & payment history',
        ],
      },
      'expense-tracker': {
        name: 'Expense Tracker',
        shortDesc: 'Track daily spending, view reports & export formatted PDFs.',
        fullDesc:
          'Record everyday expenses cleanly so you can review where your money goes each week and month.',
        capabilities: [
          'Fast daily expense entry by category',
          'Weekly & monthly analytics dashboard',
          'PDF report preview, folder export & share',
        ],
      },
      'kameti-manager': {
        name: 'Kameti (BC) Manager',
        shortDesc: 'Manage savings committees, members, installments, draws & PDF reports.',
        fullDesc:
          'Complete rotating savings committee (Kameti / BC) management system with member turns, installment tracking, random/manual parchi draws, WhatsApp reminders & PDF statements.',
        capabilities: [
          'Multiple committees with automatic monthly schedules',
          'Partial/full installment collection, draws & turn tracking',
          'Member statements, committee PDF reports & WhatsApp sharing',
        ],
      },
      notes: {
        name: 'Notes',
        shortDesc: 'Capture quick thoughts and daily reminders.',
        fullDesc:
          'A lightweight notepad for saving ideas, shopping lists, and important reminders offline.',
        capabilities: [
          'Quick note creation and editing',
          'Timestamps and clean reading view',
          'Instant local search across saved notes',
        ],
      },
      'age-calculator': {
        name: 'Age Calculator',
        shortDesc: 'Exact age in years, months, and days.',
        fullDesc:
          'Calculate exact chronological age from any date of birth along with upcoming birthday countdowns.',
        capabilities: [
          'Exact years, months, and days breakdown',
          'Next birthday countdown summary',
          'Total months and days summary',
        ],
      },
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize language, visual theme, and application details.',
      preferencesSection: 'Preferences',
      languageLabel: 'Language',
      languageDesc: 'Switch immediately between English and Urdu (RTL).',
      englishOption: 'English',
      urduOption: 'اردو (Urdu)',
      themeLabel: 'Theme',
      themeDesc: 'Choose Light or Dark appearance for comfortable viewing.',
      lightTheme: 'Light',
      darkTheme: 'Dark',
      aboutSection: 'Application & Branding',
      aboutEasyDayTitle: 'About EasyDay',
      aboutEasyDayBody:
        'EasyDay brings essential everyday financial and utility tools together in a fast, lightweight Android-focused experience built for clarity and speed.',
      previewSplashBtn: 'Preview Splash Screen',
      developerTitle: 'Developer Information',
      developerBody:
        'Designed and engineered by ZAIDI INTERACTIVE with a focus on accessible, reliable Android applications.',
      distributedBy: 'Official Distribution: ZAIDI STORE',
      versionLabel: 'App Version',
      versionValue: '1.0.0',
      buildPhaseLabel: 'Release Stage',
      buildPhaseValue: 'All 6 Tools & Global Ads Active',
      privacyTitle: 'Privacy Policy',
      privacySummary:
        'Privacy overview for EasyDay. Your Udhaar ledger, bills, notes, and expenses stay stored locally on your device.',
      privacyPlaceholderBody:
        'EasyDay stores your language, theme, Udhaar ledger, bill reminders, notes, and expense records locally on your device. No personal financial records are collected, sold, or uploaded.',
      viewPrivacyBtn: 'Read Privacy Policy',
      closeBtn: 'Close',
      adminSection: 'Administration',
      adminTitle: 'ZAIDI STORE Admin Panel',
      adminSummary:
        'Authorized administrator sign-in to manage global in-app ads and announcements.',
      openAdminBtn: 'Open Admin Panel',
      dataSafety: {
        sectionTitle: 'Data Safety & Backup',
        cardTitle: 'Offline Local Backup & Restore',
        cardSubtitle:
          'Export all Udhaar ledgers, bills, bill photos, expenses, notes, and preferences into one portable JSON file.',
        lastBackupLabel: 'Last Successful Backup',
        noBackupWarningTitle: 'No backup created yet',
        noBackupWarningBody:
          'Your financial records and photos are stored only on this device. Create a backup regularly to prevent accidental data loss.',
        regularBackupTip:
          'Tip: Save a fresh backup file or share it to WhatsApp / Google Drive weekly.',
        storageHealthLabel: 'Device Storage Health',
        storageHealthyStatus: 'Healthy',
        storageNearLimitWarning:
          'Local storage is filling up. Export a backup and clear old unnecessary records.',
        storageCriticalWarning:
          'Storage quota is critically full! Saving new financial records may fail until space is freed.',
        photosStoredLabel: 'Bill Photos (IndexedDB)',
        legacyMigratingNote: 'legacy inline photo(s) pending migration',
        saveBackupBtn: 'Save Backup',
        shareBackupBtn: 'Share Backup',
        restoreBackupBtn: 'Restore Backup',
        busyExporting: 'Preparing Backup...',
        busySharing: 'Preparing Share...',
        busyReading: 'Validating File...',
        busyRestoring: 'Restoring Safely...',
        backupSavedTitle: 'Backup saved successfully:',
        backupSharedSuccess: 'Backup shared successfully via device apps.',
        backupCancelled: 'Action cancelled. No changes were made.',
        restoreModalTitle: 'Review Backup Before Restore',
        restorePreviewCreated: 'Backup Created',
        restorePreviewAppVersion: 'App Version',
        countBills: 'Bills',
        countExpenses: 'Expenses',
        countUdhaarEntries: 'Udhaar Entries',
        countUdhaarContacts: 'Udhaar Contacts',
        countKametis: 'Kametis (BC)',
        countNotes: 'Notes',
        countPhotos: 'Bill Photos',
        restoreWarningExact:
          'Restoring this backup will replace your current local data. Make sure you have saved a backup first.',
        confirmRestoreBtn: 'Confirm & Restore Data',
        cancelBtn: 'Cancel',
        restoreSuccessTitle: 'Data restored successfully',
        restoreSuccessBody:
          'All records, photos, and settings from the backup have been restored safely.',
        restoreRolledBackTitle: 'Restore Failed — Previous Data Preserved',
      },
      security: {
        sectionTitle: 'App Security & Biometric Lock',
        cardTitle: 'PIN & Biometric Protection',
        cardSubtitle:
          'Lock EasyDay with a 4 or 6-digit PIN and optional Android fingerprint/biometric unlock. Your PIN is salted & cryptographically hashed offline.',
        pinStatusEnabled: 'PIN Lock Active',
        pinStatusDisabled: 'PIN Lock Off',
        pinLengthBadge4: '4-Digit PIN',
        pinLengthBadge6: '6-Digit PIN',
        enablePinBtn: 'Set Up PIN Lock',
        disablePinBtn: 'Disable PIN',
        changePinBtn: 'Change PIN',
        biometricTitle: 'Fingerprint / Biometric Unlock',
        biometricDesc:
          'Unlock EasyDay faster using your Android device fingerprint or supported biometrics.',
        biometricRequiresPinHint:
          'Set up a PIN lock first before enabling biometric unlock.',
        biometricReadyHint: 'Device biometrics are available and ready.',
        biometricNotEnrolledHint:
          'No fingerprint or biometric is enrolled in Android device settings yet.',
        biometricNoHardwareHint:
          'This device does not have biometric hardware. PIN lock works on all devices.',
        biometricHwUnavailableHint:
          'Biometric sensor is currently unavailable on this device.',
        biometricWebPreviewHint:
          'Biometric hardware unlock runs inside the installed EasyDay Android app. PIN lock works everywhere.',
        biometricEnableModalTitle: 'Confirm PIN to Enable Biometrics',
        biometricEnableModalBody:
          'Enter your current EasyDay PIN to authorize fingerprint/biometric unlock.',
        autoLockLabel: 'Automatic Locking',
        lockOnBackgroundTitle: 'Lock When Leaving App',
        lockOnBackgroundDesc:
          'Immediately lock EasyDay whenever you switch to another app or minimize it.',
        inactivityLabel: 'Inactivity Auto-Lock Timer',
        timeoutBackgroundOnly: 'Background / Manual Only',
        timeout30s: '30 sec',
        timeout1m: '1 min',
        timeout5m: '5 min',
        timeout10m: '10 min',
        lockNowBtn: 'Lock Now',
        pinLengthLabel: 'PIN Length',
        pinLength4: '4 Digits',
        pinLength6: '6 Digits',
        modalCreateTitle: 'Create App Lock PIN',
        modalCreateStep1: 'Enter a new numeric PIN',
        modalCreateStep2: 'Re-enter your PIN to confirm',
        modalChangeTitle: 'Change App Lock PIN',
        modalChangeStepCurrent: 'Verify your current PIN first',
        modalChangeStepNew: 'Enter your new PIN',
        modalChangeStepConfirm: 'Confirm your new PIN',
        modalDisableTitle: 'Verify PIN to Disable Lock',
        modalDisableBody:
          'Enter your current PIN to turn off App Lock and Biometric Unlock.',
        modalSuccessPinSet: 'PIN Lock enabled safely on this device.',
        modalSuccessPinChanged: 'Your App Lock PIN has been updated.',
        modalSuccessPinDisabled: 'App Lock has been disabled.',
        modalSuccessBiometricEnabled: 'Fingerprint / Biometric unlock enabled.',
        modalSuccessBiometricDisabled: 'Fingerprint / Biometric unlock turned off.',
        errorMismatch: 'PINs did not match. Please try entering your new PIN again.',
        errorWrongPin: 'Incorrect PIN. Please check and try again.',
        errorWrongPinAttempts: 'Incorrect PIN. Failed attempts:',
        errorLockedOutPrefix: 'Too many incorrect attempts. Try again in',
        errorCryptoUnavailable:
          'Secure device cryptography is unavailable in this browser context.',
        cancelBtn: 'Cancel',
        backStepBtn: 'Start Over',
        clearBtn: 'Clear',
        backspaceAria: 'Delete last digit',
        lockScreenTitle: 'Unlock EasyDay',
        lockScreenSubtitle: 'Enter your PIN or use biometrics to access your records',
        enterCurrentPinDotsAria: 'PIN entry progress',
        unlockBiometricBtn: 'Unlock with Fingerprint / Biometrics',
        biometricPromptTitle: 'Unlock EasyDay',
        biometricPromptSubtitle: 'Verify your fingerprint or device biometrics',
        biometricNegativeBtn: 'Use PIN',
        biometricCancelledMsg: 'Biometric prompt cancelled. Enter your PIN to unlock.',
        biometricFallbackMsg: 'Enter your EasyDay PIN to unlock.',
        biometricLockoutMsg:
          'Biometrics temporarily locked by Android. Use your PIN to unlock.',
        biometricFailedMsg:
          'Biometric verification did not succeed. Use your PIN to unlock.',
        biometricUnavailableMsg:
          'Biometrics are unavailable right now. Please unlock with your PIN.',
        forgotPinBtn: 'Forgot PIN?',
        recoveryTitle: 'Recover App Access',
        recoveryWarningBody:
          'If you forgot your PIN, you can reset local App Lock security on this device.',
        recoveryDataSafeBox:
          '100% Data Safe: Resetting removes ONLY your App Lock PIN and Biometric setting. Your Udhaar ledger, Bills, Expenses, Notes, and Photos will NEVER be deleted.',
        recoveryCheckboxLabel:
          'I understand only my PIN & biometric lock will be reset, and all financial records remain intact.',
        recoveryConfirmBtn: 'Reset PIN Lock & Unlock',
        recoverySuccessToast: 'PIN Lock reset. Your financial records remain intact.',
      },
    },
    splash: {
      title: 'Splash Screen Preview',
      poweredBy: 'Powered by',
      distributedBy: 'Distributed by',
      closePreview: 'Back to App',
    },
  },
  ur: {
    brand: {
      name: 'EasyDay',
      tagline: 'make you easy',
      developerLabel: 'تیار کردہ',
      developerName: 'ZAIDI INTERACTIVE',
      distributionLabel: 'تقسیم کنندہ',
      storeName: 'ZAIDI STORE',
    },
    nav: {
      home: 'ہوم',
      tools: 'ٹولز',
      settings: 'سیٹنگز',
    },
    greetings: {
      morning: 'صبح بخیر',
      afternoon: 'دوپہر بخیر',
      evening: 'شام بخیر',
      subtitle: 'آپ کا روزمرہ مالیاتی اور یوٹیلیٹی معاون تیار ہے۔',
    },
    dashboard: {
      searchPlaceholder: 'ٹولز تلاش کریں (مثلاً ادھار، بلز، نوٹس)...',
      clearSearch: 'تلاش صاف کریں',
      searchResultsTitle: 'تلاش کے نتائج',
      noToolsFound: 'آپ کی تلاش کے مطابق کوئی ٹول نہیں ملا۔',
      resetSearch: 'تمام ٹولز دکھائیں',
      spotlightHeading: 'اہم مالیاتی ٹولز',
      udhaarSpotlightBadge: 'PKR کھاتہ',
      udhaarSpotlightTitle: 'ادھار مینیجر',
      udhaarSpotlightBody:
        'دی گئی اور لی گئی رقم، جزوی ادائیگیاں اور واٹس ایپ تفصیلات باآسانی منظم کریں۔',
      udhaarSpotlightCta: 'کھاتہ کھولیں',
      udhaarReceivableHint: 'لینے ہیں',
      udhaarPayableHint: 'دینے ہیں',
      billsSpotlightBadge: 'فوری الرٹس',
      billsSpotlightTitle: 'بلز اور پیمنٹ ریمائنڈر',
      billsSpotlightBody:
        'گھریلو بلز، ماہانہ ادائیگیوں، کیلنڈر اور اینڈرائیڈ نوٹیفکیشنز کا مکمل انتظام۔',
      billsSpotlightCta: 'بلز دیکھیں',
      billsUpcomingHint: 'آنے والے',
      billsOverdueHint: 'تاخیر شدہ',
      featuredTools: 'نمایاں ٹولز',
      viewAllTools: 'تمام 6 ٹولز',
      recentlyUsed: 'حالیہ استعمال شدہ',
      recentHint: 'آسان رسائی کے لیے کسی بھی ٹول پر ٹیپ کریں',
      quickAccess: 'فوری رسائی',
      announcementLabel: 'اعلان',
      announcementCtaFallback: 'لنک کھولیں',
      quickActions: {
        openToolsTitle: 'ٹولز ڈائریکٹری',
        openToolsSub: 'تمام 6 روزمرہ ٹولز دیکھیں',
        languageTitle: 'ایپ کی زبان',
        languageSub: 'English (LTR) پر جائیں',
        themeTitle: 'ظاہری انداز',
        themeLightSub: 'فی الحال روشن · تاریک کے لیے ٹیپ کریں',
        themeDarkSub: 'فی الحال تاریک · روشن کے لیے ٹیپ کریں',
        settingsTitle: 'سیٹنگز',
        settingsSub: 'زبان، تھیم اور ترجیحات',
      },
      financialSummary: {
        title: 'اسمارٹ مالیاتی خلاصہ',
        subtitle: 'بلز، ادھار اور اخراجات کا درست اور غیر دہرا مجموعی حساب',
        toReceiveLabel: 'وصول طلب رقم (لینے ہیں)',
        toPayLabel: 'واجب الادا قرض (دینے ہیں)',
        outstandingBillsLabel: 'واجب الادا بلز',
        totalExpensesLabel: 'کل اخراجات',
        paymentsReceivedLabel: 'وصول شدہ ادائیگیاں',
        paymentsMadeLabel: 'کی گئی ادائیگیاں',
        paidBillsHint: 'ادا شدہ بلز شامل:',
        debtRepaidHint: 'ادھار واپسی (نقد ادائیگی)',
      },
      todaySummary: {
        title: 'آج کا مالیاتی خلاصہ',
        todayExpenses: 'آج کے اخراجات',
        toReceive: 'لینے ہیں (وصول طلب)',
        toPay: 'دینے ہیں (واجب الادا)',
        dueTodayBills: 'آج واجب الادا بلز',
        overdueBills: 'تاخیر شدہ بلز',
        upcomingBills: 'آنے والے بلز',
        dueTodayTag: 'آج آخری تاریخ',
        overdueTag: 'تاخیر شدہ',
        upcomingTag: 'آئندہ',
        billsCountLabel: 'بلز',
        billSingularLabel: 'بل',
      },
      quickAdd: {
        heading: 'فوری اندراج',
        addExpense: 'خرچ شامل کریں',
        addUdhaar: 'ادھار شامل کریں',
        addNote: 'نوٹ لکھیں',
      },
      overview: {
        heading: 'مالیاتی جائزہ',
        udhaarTitle: 'ادھار کا خلاصہ',
        udhaarToReceive: 'لینے ہیں',
        udhaarToPay: 'دینے ہیں',
        udhaarActiveMeta: 'فعال کھاتے',
        billsTitle: 'بلز کا خلاصہ',
        billsPaid: 'ادا شدہ (اس ماہ)',
        billsUnpaid: 'باقی واجب',
        billsOverdue: 'تاخیر شدہ',
        expensesTitle: 'اخراجات کا خلاصہ',
        expensesToday: 'آج کا خرچ',
        expensesMonthly: 'اس ماہ کا خرچ',
        openToolCta: 'کھولیں',
      },
      toolsGrid: {
        heading: 'تمام ٹولز',
        viewDirectory: 'ڈائریکٹری',
      },
      fab: {
        openLabel: 'فوری اندراج',
        closeLabel: 'فوری اندراج بند کریں',
        expenseShort: 'خرچ',
        udhaarShort: 'ادھار',
        noteShort: 'نوٹ',
      },
    },
    toolsDirectory: {
      title: 'ٹولز ڈائریکٹری',
      subtitle: 'روزمرہ رفتار اور سہولت کے لیے چھ ضروری اینڈرائیڈ ٹولز۔',
      searchPlaceholder: 'نام یا کام کے لحاظ سے ٹولز فلٹر کریں...',
      categories: {
        all: 'تمام ٹولز',
        utilities: 'یوٹیلیٹیز',
        productivity: 'پروڈکٹیوٹی',
        finance: 'مالیات',
      },
      openTool: 'کھولیں',
      phaseLabel: 'تیار',
    },
    toolDetail: {
      backToTools: 'واپس',
      foundationStatusTitle: 'ٹول ورک اسپیس',
      foundationStatusBody: 'آپ کا تمام ریکارڈ صرف آپ کی ڈیوائس پر محفوظ رہتا ہے۔',
      plannedCapabilities: 'خصوصیات',
      returnDirectory: 'ٹولز ڈائریکٹری پر واپس جائیں',
      stepBadge: 'تیار',
    },
    tools: {
      'udhaar-manager': {
        name: 'ادھار مینیجر',
        shortDesc: 'ادھار دی گئی اور لی گئی رقم، اقساط اور واٹس ایپ اسٹیٹمنٹ۔',
        fullDesc:
          'پاکستان کے روزمرہ استعمال کے لیے مکمل ادھار کھاتہ جس میں افراد کا حساب، جزوی ادائیگی اور واٹس ایپ شیئرنگ شامل ہے۔',
        capabilities: [
          'مجھے لینے ہیں اور مجھے دینے ہیں کا مکمل کھاتہ',
          'جزوی اور مکمل ادائیگیوں اور باقی رقم کا خودکار حساب',
          'واٹس ایپ اسٹیٹمنٹ اور ماہانہ خلاصہ',
        ],
      },
      'bills-reminder': {
        name: 'بلز اور پیمنٹ ریمائنڈر',
        shortDesc: 'بجلی، گیس، انٹرنیٹ بلز اور اینڈرائیڈ نوٹیفکیشن یاد دہانیاں۔',
        fullDesc:
          'بجلی، گیس، پانی، وائی فائی، کرایہ اور اسکول فیس کے بلز کی تاریخ، کیلنڈر اور بروقت اینڈرائیڈ الرٹس منظم کریں۔',
        capabilities: [
          'آخری تاریخ سے پہلے اور تاخیر کے اینڈرائیڈ نوٹیفکیشنز',
          'ماہانہ اور حسبِ ضرورت خودکار نئے بل کی تیاری',
          'کیلنڈر منظر، بل کی تصویر اور ادائیگیوں کا ریکارڈ',
        ],
      },
      'expense-tracker': {
        name: 'اخراجات کا حساب',
        shortDesc: 'روزمرہ اخراجات کا ریکارڈ، رپورٹس اور پی ڈی ایف ایکسپورٹ۔',
        fullDesc:
          'اپنے روزانہ کے اخراجات آسانی سے درج کریں تاکہ ہفتہ وار اور ماہانہ خرچ کا درست اندازہ رہے۔',
        capabilities: [
          'زمرہ کے لحاظ سے فوری اخراجات کا اندراج',
          'ہفتہ وار اور ماہانہ تجزیاتی ڈیش بورڈ',
          'پی ڈی ایف رپورٹ پیش نظارہ، محفوظ اور شیئر',
        ],
      },
      'kameti-manager': {
        name: 'کمیٹی (BC) مینیجر',
        shortDesc: 'کمیٹی، ممبرز، اقساط، پرچی قرعہ اندازی اور پی ڈی ایف رپورٹس کا مکمل نظام۔',
        fullDesc:
          'پاکستانی کمیٹی / بی سی کے مکمل انتظام کے لیے ممبرز، ماہانہ اقساط، جزوی ادائیگیاں، دستی یا خودکار قرعہ اندازی (پرچی)، واٹس ایپ ریمائنڈر اور پی ڈی ایف رپورٹس۔',
        capabilities: [
          'متعدد کمیٹیاں اور خودکار ماہانہ اقساط شیڈول',
          'جزوی/مکمل وصولی، قرعہ اندازی اور باری کی نگرانی',
          'ممبر اسٹیٹمنٹ، کمیٹی پی ڈی ایف رپورٹ اور واٹس ایپ شیئرنگ',
        ],
      },
      notes: {
        name: 'نوٹس',
        shortDesc: 'فوری خیالات اور روزمرہ یاد دہانیاں محفوظ کریں۔',
        fullDesc:
          'خیالات، خریداری کی فہرستیں اور اہم یاد دہانیاں آف لائن محفوظ کرنے کے لیے ہلکا پھلکا نوٹ پیڈ۔',
        capabilities: [
          'فوری نوٹس تحریر اور ترمیم',
          'وقت اور تاریخ کے ساتھ صاف منظر',
          'محفوظ شدہ نوٹس میں فوری تلاش',
        ],
      },
      'age-calculator': {
        name: 'عمر کیلکولیٹر',
        shortDesc: 'سال، مہینوں اور دنوں میں درست عمر معلوم کریں۔',
        fullDesc:
          'تاریخ پیدائش سے درست عمر اور آنے والی سالگرہ تک باقی دنوں کی گنتی معلوم کریں۔',
        capabilities: [
          'سال، مہینوں اور دنوں کی مکمل تفصیل',
          'اگلی سالگرہ تک باقی دنوں کا خلاصہ',
          'کل مہینے اور دنوں کی گنتی',
        ],
      },
    },
    settings: {
      title: 'سیٹنگز',
      subtitle: 'زبان، ظاہری تھیم اور ایپ کی تفصیلات ترتیب دیں۔',
      preferencesSection: 'ترجیحات',
      languageLabel: 'زبان',
      languageDesc: 'بغیر ریسٹارٹ انگریزی اور اردو (RTL) کے درمیان فوری تبدیلی۔',
      englishOption: 'English',
      urduOption: 'اردو (Urdu)',
      themeLabel: 'تھیم',
      themeDesc: 'آرام دہ مطالعے کے لیے روشن یا تاریک موڈ منتخب کریں۔',
      lightTheme: 'روشن (Light)',
      darkTheme: 'تاریک (Dark)',
      aboutSection: 'ایپ اور برانڈنگ',
      aboutEasyDayTitle: 'EasyDay کے بارے میں',
      aboutEasyDayBody:
        'EasyDay روزمرہ کے ضروری مالیاتی اور یوٹیلیٹی ٹولز کو ایک تیز، سادہ اور کم وزن اینڈرائیڈ تجربے میں یکجا کرتا ہے۔',
      previewSplashBtn: 'اسپلیش اسکرین دیکھیں',
      developerTitle: 'ڈویلپر کی معلومات',
      developerBody:
        'ZAIDI INTERACTIVE کی جانب سے تیار کردہ، سادہ اور قابلِ اعتماد اینڈرائیڈ ایپلیکیشن۔',
      distributedBy: 'باضابطہ تقسیم: ZAIDI STORE',
      versionLabel: 'ایپ ورژن',
      versionValue: '1.0.0',
      buildPhaseLabel: 'ریلیز مرحلہ',
      buildPhaseValue: 'تمام 6 ٹولز اور گلوبل اشتہارات فعال',
      privacyTitle: 'پرائیویسی پالیسی',
      privacySummary:
        'EasyDay پرائیویسی معلومات۔ آپ کا ادھار کھاتہ، بلز، نوٹس اور اخراجات صرف آپ کی ڈیوائس پر محفوظ رہتے ہیں۔',
      privacyPlaceholderBody:
        'EasyDay آپ کی منتخب زبان، تھیم، ادھار کھاتہ، بلز کے ریمائنڈر، نوٹس اور اخراجات کا ریکارڈ صرف آپ کی اپنی ڈیوائس میں محفوظ رکھتا ہے۔ کوئی ذاتی مالی ڈیٹا باہر ارسال نہیں کیا جاتا۔',
      viewPrivacyBtn: 'پرائیویسی پالیسی دیکھیں',
      closeBtn: 'بند کریں',
      adminSection: 'انتظامیہ',
      adminTitle: 'ZAIDI STORE ایڈمن پینل',
      adminSummary:
        'گلوبل اشتہارات اور اعلانات منظم کرنے کے لیے مجاز ایڈمنسٹریٹر لاگ ان۔',
      openAdminBtn: 'ایڈمن پینل کھولیں',
      dataSafety: {
        sectionTitle: 'ڈیٹا کی حفاظت اور بیک اپ',
        cardTitle: 'مکمل آف لائن بیک اپ اور بحالی',
        cardSubtitle:
          'اپنے تمام ادھار کھاتے، بلز، بلوں کی تصاویر، اخراجات، نوٹس اور سیٹنگز ایک JSON فائل میں محفوظ کریں۔',
        lastBackupLabel: 'آخری کامیاب بیک اپ',
        noBackupWarningTitle: 'ابھی تک کوئی بیک اپ نہیں بنایا گیا',
        noBackupWarningBody:
          'آپ کا تمام مالی ریکارڈ اور تصاویر صرف اسی ڈیوائس پر محفوظ ہیں۔ ڈیٹا ضائع ہونے سے بچنے کے لیے باقاعدگی سے بیک اپ بنائیں۔',
        regularBackupTip:
          'مشورہ: ہر ہفتے نیا بیک اپ محفوظ کریں یا واٹس ایپ / گوگل ڈرائیو پر شیئر کر کے محفوظ رکھیں۔',
        storageHealthLabel: 'ڈیوائس اسٹوریج کی صورتحال',
        storageHealthyStatus: 'بہترین',
        storageNearLimitWarning:
          'مقامی اسٹوریج بھر رہی ہے۔ بیک اپ محفوظ کریں اور غیر ضروری پرانا ریکارڈ کم کریں۔',
        storageCriticalWarning:
          'اسٹوریج کی حد تقریباً پوری ہو چکی ہے! نیا مالی ریکارڈ محفوظ کرنے کے لیے فوری جگہ خالی کریں۔',
        photosStoredLabel: 'بل کی تصاویر (IndexedDB)',
        legacyMigratingNote: 'پرانی تصاویر IndexedDB میں منتقل ہو رہی ہیں',
        saveBackupBtn: 'بیک اپ محفوظ کریں',
        shareBackupBtn: 'بیک اپ شیئر کریں',
        restoreBackupBtn: 'بیک اپ بحال کریں',
        busyExporting: 'بیک اپ تیار ہو رہا ہے...',
        busySharing: 'شیئر کے لیے تیاری...',
        busyReading: 'فائل کی جانچ ہو رہی ہے...',
        busyRestoring: 'محفوظ طریقے سے بحالی...',
        backupSavedTitle: 'بیک اپ کامیابی سے محفوظ ہو گیا:',
        backupSharedSuccess: 'بیک اپ کامیابی سے شیئر کر دیا گیا۔',
        backupCancelled: 'عمل منسوخ کر دیا گیا۔ کوئی تبدیلی نہیں کی گئی۔',
        restoreModalTitle: 'بحالی سے پہلے بیک اپ کا جائزہ لیں',
        restorePreviewCreated: 'بیک اپ کا وقت',
        restorePreviewAppVersion: 'ایپ ورژن',
        countBills: 'بلز',
        countExpenses: 'اخراجات',
        countUdhaarEntries: 'ادھار اندراجات',
        countUdhaarContacts: 'ادھار افراد',
        countKametis: 'کمیٹیاں (BC)',
        countNotes: 'نوٹس',
        countPhotos: 'بل تصاویر',
        restoreWarningExact:
          'اس بیک اپ کو بحال کرنے سے آپ کا موجودہ مقامی ڈیٹا تبدیل ہو جائے گا۔ براہ کرم یقینی بنائیں کہ آپ نے پہلے بیک اپ محفوظ کر لیا ہے۔',
        confirmRestoreBtn: 'تصدیق کریں اور بحال کریں',
        cancelBtn: 'منسوخ کریں',
        restoreSuccessTitle: 'ڈیٹا کامیابی سے بحال ہو گیا',
        restoreSuccessBody:
          'بیک اپ سے تمام ریکارڈ، تصاویر اور سیٹنگز محفوظ طریقے سے بحال کر دی گئی ہیں۔',
        restoreRolledBackTitle: 'بحالی ناکام — پچھلا ڈیٹا مکمل محفوظ رہا',
      },
      security: {
        sectionTitle: 'ایپ سیکیورٹی اور فنگر پرنٹ لاک',
        cardTitle: 'پن (PIN) اور بائیومیٹرک تحفظ',
        cardSubtitle:
          'اپنے ایزی ڈے کھاتے کو 4 یا 6 ہندسوں کے پن اور اینڈرائیڈ فنگر پرنٹ لاک سے محفوظ بنائیں۔ آپ کا پن مکمل خفیہ ہیش کے ساتھ آف لائن محفوظ رہتا ہے۔',
        pinStatusEnabled: 'پن لاک فعال ہے',
        pinStatusDisabled: 'پن لاک بند ہے',
        pinLengthBadge4: '4 ہندسوں کا پن',
        pinLengthBadge6: '6 ہندسوں کا پن',
        enablePinBtn: 'پن لاک لگائیں',
        disablePinBtn: 'پن لاک بند کریں',
        changePinBtn: 'پن تبدیل کریں',
        biometricTitle: 'فنگر پرنٹ / بائیومیٹرک ان لاک',
        biometricDesc:
          'اپنے اینڈرائیڈ فون کے فنگر پرنٹ یا بائیومیٹرک سنسر سے ایپ فوری کھولیں۔',
        biometricRequiresPinHint:
          'فنگر پرنٹ لاک فعال کرنے سے پہلے براہِ کرم پن لاک سیٹ کریں۔',
        biometricReadyHint: 'آپ کی ڈیوائس پر بائیومیٹرک ان لاک دستیاب اور تیار ہے۔',
        biometricNotEnrolledHint:
          'آپ کے فون کی اینڈرائیڈ سیٹنگز میں ابھی کوئی فنگر پرنٹ شامل نہیں ہے۔',
        biometricNoHardwareHint:
          'اس ڈیوائس میں فنگر پرنٹ سنسر دستیاب نہیں ہے۔ پن لاک تمام ڈیوائسز پر کام کرتا ہے۔',
        biometricHwUnavailableHint:
          'اس وقت بائیومیٹرک سنسر دستیاب نہیں ہے۔',
        biometricWebPreviewHint:
          'فنگر پرنٹ سنسر انسٹال شدہ ایزی ڈے اینڈرائیڈ ایپ میں کام کرتا ہے۔ پن لاک ہر جگہ کام کرتا ہے۔',
        biometricEnableModalTitle: 'فنگر پرنٹ کے لیے پن کی تصدیق کریں',
        biometricEnableModalBody:
          'بائیومیٹرک ان لاک فعال کرنے کے لیے اپنا موجودہ ایزی ڈے پن درج کریں۔',
        autoLockLabel: 'خودکار ایپ لاک',
        lockOnBackgroundTitle: 'ایپ چھوڑنے پر فوری لاک',
        lockOnBackgroundDesc:
          'کسی دوسری ایپ پر جانے یا ایزی ڈے کم از کم کرنے پر ایپ خودکار لاک ہو جائے گی۔',
        inactivityLabel: 'غیر فعال وقت کے بعد خودکار لاک',
        timeoutBackgroundOnly: 'صرف بیک گراؤنڈ / دستی',
        timeout30s: '30 سیکنڈ',
        timeout1m: '1 منٹ',
        timeout5m: '5 منٹ',
        timeout10m: '10 منٹ',
        lockNowBtn: 'ابھی لاک کریں',
        pinLengthLabel: 'پن کی لمبائی',
        pinLength4: '4 ہندسے',
        pinLength6: '6 ہندسے',
        modalCreateTitle: 'ایپ لاک پن بنائیں',
        modalCreateStep1: 'نیا عددی پن درج کریں',
        modalCreateStep2: 'تصدیق کے لیے وہی پن دوبارہ درج کریں',
        modalChangeTitle: 'ایپ لاک پن تبدیل کریں',
        modalChangeStepCurrent: 'پہلے اپنا موجودہ پن درج کریں',
        modalChangeStepNew: 'اپنا نیا پن درج کریں',
        modalChangeStepConfirm: 'نئے پن کی تصدیق کے لیے دوبارہ درج کریں',
        modalDisableTitle: 'لاک بند کرنے کے لیے پن کی تصدیق',
        modalDisableBody:
          'ایپ لاک اور فنگر پرنٹ تحفظ بند کرنے کے لیے اپنا موجودہ پن درج کریں۔',
        modalSuccessPinSet: 'اس ڈیوائس پر پن لاک محفوظ طریقے سے فعال ہو گیا۔',
        modalSuccessPinChanged: 'آپ کا ایپ لاک پن کامیابی سے تبدیل ہو گیا۔',
        modalSuccessPinDisabled: 'ایپ لاک بند کر دیا گیا ہے۔',
        modalSuccessBiometricEnabled: 'فنگر پرنٹ / بائیومیٹرک ان لاک فعال ہو گیا۔',
        modalSuccessBiometricDisabled: 'فنگر پرنٹ / بائیومیٹرک ان لاک بند کر دیا گیا۔',
        errorMismatch: 'دونوں پن آپس میں نہیں ملے۔ براہ کرم دوبارہ نیا پن درج کریں۔',
        errorWrongPin: 'غلط پن درج کیا گیا ہے۔ براہ کرم دوبارہ کوشش کریں۔',
        errorWrongPinAttempts: 'غلط پن۔ ناکام کوششیں:',
        errorLockedOutPrefix: 'زیادہ غلط کوششوں کی وجہ سے عارضی پابندی۔ دوبارہ کوشش:',
        errorCryptoUnavailable:
          'اس براؤزر ماحول میں محفوظ خفیہ نگاری دستیاب نہیں ہے۔',
        cancelBtn: 'منسوخ کریں',
        backStepBtn: 'دوبارہ شروع کریں',
        clearBtn: 'صاف کریں',
        backspaceAria: 'آخری ہندسہ مٹائیں',
        lockScreenTitle: 'EasyDay ان لاک کریں',
        lockScreenSubtitle:
          'اپنا مالی ریکارڈ کھولنے کے لیے پن درج کریں یا فنگر پرنٹ استعمال کریں',
        enterCurrentPinDotsAria: 'پن اندراج کی صورتحال',
        unlockBiometricBtn: 'فنگر پرنٹ / بائیومیٹرک سے کھولیں',
        biometricPromptTitle: 'EasyDay ان لاک کریں',
        biometricPromptSubtitle: 'اپنے فنگر پرنٹ یا بائیومیٹرک کی تصدیق کریں',
        biometricNegativeBtn: 'پن استعمال کریں',
        biometricCancelledMsg:
          'بائیومیٹرک منسوخ کر دیا گیا۔ کھولنے کے لیے اپنا پن درج کریں۔',
        biometricFallbackMsg: 'ایپ کھولنے کے لیے اپنا EasyDay پن درج کریں۔',
        biometricLockoutMsg:
          'اینڈرائیڈ کی جانب سے فنگر پرنٹ عارضی طور پر لاک ہے۔ اپنا پن درج کریں۔',
        biometricFailedMsg:
          'بائیومیٹرک تصدیق مکمل نہیں ہو سکی۔ براہ کرم اپنا پن درج کریں۔',
        biometricUnavailableMsg:
          'اس وقت بائیومیٹرک دستیاب نہیں ہے۔ براہ کرم پن کے ذریعے کھولیں۔',
        forgotPinBtn: 'پن بھول گئے؟',
        recoveryTitle: 'ایپ تک رسائی بحال کریں',
        recoveryWarningBody:
          'اگر آپ اپنا پن بھول گئے ہیں تو آپ اس ڈیوائس سے صرف مقامی ایپ لاک سیکیورٹی صاف کر سکتے ہیں۔',
        recoveryDataSafeBox:
          '100% محفوظ ڈیٹا: اس عمل سے صرف آپ کا پن لاک اور فنگر پرنٹ سیٹنگ ختم ہوگی۔ آپ کا ادھار کھاتہ، بلز، اخراجات، نوٹس اور تصاویر بالکل محفوظ رہیں گے۔',
        recoveryCheckboxLabel:
          'میں سمجھتا/سمجھتی ہوں کہ صرف پن اور فنگر پرنٹ لاک ختم ہوگا، میرا تمام مالی ریکارڈ محفوظ رہے گا۔',
        recoveryConfirmBtn: 'پن لاک صاف کریں اور کھولیں',
        recoverySuccessToast: 'پن لاک ہٹا دیا گیا۔ آپ کا تمام مالی ڈیٹا محفوظ ہے۔',
      },
    },
    splash: {
      title: 'اسپلیش اسکرین پیش نظارہ',
      poweredBy: 'پیشکش',
      distributedBy: 'تقسیم کنندہ',
      closePreview: 'ایپ پر واپس جائیں',
    },
  },
};
