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
      viewAllTools: 'All 5 tools',
      recentlyUsed: 'Recently Used',
      recentHint: 'Tap any tool to keep it handy here',
      quickAccess: 'Quick Access',
      announcementLabel: 'Announcement',
      announcementCtaFallback: 'Open Link',
      quickActions: {
        openToolsTitle: 'Tools Directory',
        openToolsSub: 'Browse all 5 everyday tools',
        languageTitle: 'App Language',
        languageSub: 'Switch to اردو (RTL)',
        themeTitle: 'Appearance',
        themeLightSub: 'Currently Light · Tap for Dark',
        themeDarkSub: 'Currently Dark · Tap for Light',
        settingsTitle: 'Settings',
        settingsSub: 'Language, theme & preferences',
      },
    },
    toolsDirectory: {
      title: 'Tools Directory',
      subtitle: 'Five essential Android utilities designed for everyday clarity and speed.',
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
      buildPhaseValue: 'All 5 Tools & Global Ads Active',
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
      viewAllTools: 'تمام 5 ٹولز',
      recentlyUsed: 'حالیہ استعمال شدہ',
      recentHint: 'آسان رسائی کے لیے کسی بھی ٹول پر ٹیپ کریں',
      quickAccess: 'فوری رسائی',
      announcementLabel: 'اعلان',
      announcementCtaFallback: 'لنک کھولیں',
      quickActions: {
        openToolsTitle: 'ٹولز ڈائریکٹری',
        openToolsSub: 'تمام 5 روزمرہ ٹولز دیکھیں',
        languageTitle: 'ایپ کی زبان',
        languageSub: 'English (LTR) پر جائیں',
        themeTitle: 'ظاہری انداز',
        themeLightSub: 'فی الحال روشن · تاریک کے لیے ٹیپ کریں',
        themeDarkSub: 'فی الحال تاریک · روشن کے لیے ٹیپ کریں',
        settingsTitle: 'سیٹنگز',
        settingsSub: 'زبان، تھیم اور ترجیحات',
      },
    },
    toolsDirectory: {
      title: 'ٹولز ڈائریکٹری',
      subtitle: 'روزمرہ رفتار اور سہولت کے لیے پانچ ضروری اینڈرائیڈ ٹولز۔',
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
      buildPhaseValue: 'تمام 5 ٹولز اور گلوبل اشتہارات فعال',
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
    },
    splash: {
      title: 'اسپلیش اسکرین پیش نظارہ',
      poweredBy: 'پیشکش',
      distributedBy: 'تقسیم کنندہ',
      closePreview: 'ایپ پر واپس جائیں',
    },
  },
};
