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
      tagline: 'Everything Made Easy',
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
      subtitle: 'Your daily utility companion is ready.',
    },
    dashboard: {
      searchPlaceholder: 'Search tools (e.g. Calculator, Notes)...',
      clearSearch: 'Clear search',
      searchResultsTitle: 'Matching Tools',
      noToolsFound: 'No tools match your search query.',
      resetSearch: 'Show all tools',
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
    },
    toolsDirectory: {
      title: 'Tools Directory',
      subtitle: 'Six essential Android utilities designed for everyday speed and clarity.',
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
      foundationStatusTitle: 'Foundation Screen Ready',
      foundationStatusBody:
        'Navigation and screen layout are active. Full interactive tool functionality will be implemented in the next development phase.',
      plannedCapabilities: 'Planned Capabilities',
      returnDirectory: 'Return to Tools Directory',
      stepBadge: 'Next Development Phase',
    },
    tools: {
      calculator: {
        name: 'Calculator',
        shortDesc: 'Fast arithmetic and daily math calculations.',
        fullDesc:
          'A clean, responsive calculator built for quick everyday arithmetic, percentages, and instant totals.',
        capabilities: [
          'Basic arithmetic and percentage calculations',
          'Instant expression preview and clear history',
          'Large thumb-friendly keypad layout',
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
          'Date difference comparison between two dates',
        ],
      },
      notes: {
        name: 'Notes',
        shortDesc: 'Capture quick thoughts and daily reminders.',
        fullDesc:
          'A lightweight notepad for saving ideas, shopping lists, and important reminders offline.',
        capabilities: [
          'Quick note creation and editing',
          'Color-coded organization for fast scanning',
          'Instant local search across saved notes',
        ],
      },
      'todo-list': {
        name: 'To-do List',
        shortDesc: 'Organize daily tasks and stay on schedule.',
        fullDesc:
          'Keep daily priorities structured with clear task checklists and completion progress.',
        capabilities: [
          'Create, check off, and prioritize daily tasks',
          'Active and completed task filtering',
          'Lightweight offline persistence',
        ],
      },
      'expense-tracker': {
        name: 'Expense Tracker',
        shortDesc: 'Track daily spending and stay on budget.',
        fullDesc:
          'Record everyday expenses cleanly so you can review where your money goes each week and month.',
        capabilities: [
          'Fast daily expense entry by category',
          'Daily and monthly spending totals',
          'Clean tabular expense summary',
        ],
      },
      'unit-converter': {
        name: 'Unit Converter',
        shortDesc: 'Convert length, weight, temperature & more.',
        fullDesc:
          'Switch effortlessly between metric and imperial measurements for everyday, school, and travel needs.',
        capabilities: [
          'Length, weight, temperature, and volume units',
          'Two-way instant conversion swap',
          'High-precision tabular numeric output',
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
        'EasyDay brings essential everyday utilities together in a fast, lightweight Android-focused experience built for clarity and speed.',
      previewSplashBtn: 'Preview Splash Screen',
      developerTitle: 'Developer Information',
      developerBody:
        'Designed and engineered by ZAIDI INTERACTIVE with a focus on accessible, low-end friendly Android applications.',
      distributedBy: 'Official Distribution: ZAIDI STORE',
      versionLabel: 'App Version',
      versionValue: '1.0.0',
      buildPhaseLabel: 'Release Stage',
      buildPhaseValue: 'All 6 Tools & Global Ads Active',
      privacyTitle: 'Privacy Policy',
      privacySummary:
        'Placeholder policy for EasyDay. User notes, tasks, and expenses stay stored locally on your device.',
      privacyPlaceholderBody:
        'This is a Privacy Policy placeholder for EasyDay. EasyDay stores your language, theme, calculator history, notes, tasks, and expense records locally on your device. No personal user records are collected, sold, or uploaded.',
      viewPrivacyBtn: 'Read Privacy Policy Placeholder',
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
      tagline: 'ہر کام بنائیں آسان',
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
      subtitle: 'آپ کا روزمرہ معاون استعمال کے لیے تیار ہے۔',
    },
    dashboard: {
      searchPlaceholder: 'ٹولز تلاش کریں (مثلاً کیلکولیٹر، نوٹس)...',
      clearSearch: 'تلاش صاف کریں',
      searchResultsTitle: 'تلاش کے نتائج',
      noToolsFound: 'آپ کی تلاش کے مطابق کوئی ٹول نہیں ملا۔',
      resetSearch: 'تمام ٹولز دکھائیں',
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
      foundationStatusTitle: 'بنیادی اسکرین تیار ہے',
      foundationStatusBody:
        'نیویگیشن اور اسکرین ڈھانچہ فعال ہے۔ اس ٹول کی مکمل فعالیت اگلے ترقیاتی مرحلے میں شامل کی جائے گی۔',
      plannedCapabilities: 'منصوبہ بند خصوصیات',
      returnDirectory: 'ٹولز ڈائریکٹری پر واپس جائیں',
      stepBadge: 'اگلا ترقیاتی مرحلہ',
    },
    tools: {
      calculator: {
        name: 'کیلکولیٹر',
        shortDesc: 'تیز حساب کتاب اور روزمرہ ریاضی کے لیے۔',
        fullDesc:
          'روزمرہ کے تیز حساب کتاب، فیصد اور فوری نتائج کے لیے بنایا گیا سادہ اور صاف کیلکولیٹر۔',
        capabilities: [
          'بنیادی حساب کتاب اور فیصد کی گنتی',
          'فوری نتیجہ اور صاف ہسٹری',
          'بڑے اور آرام دہ بٹنوں والا کی پیڈ',
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
          'دو تاریخوں کے درمیان فرق کا موازنہ',
        ],
      },
      notes: {
        name: 'نوٹس',
        shortDesc: 'فوری خیالات اور روزمرہ یاد دہانیاں محفوظ کریں۔',
        fullDesc:
          'خیالات، خریداری کی فہرستیں اور اہم یاد دہانیاں آف لائن محفوظ کرنے کے لیے ہلکا پھلکا نوٹ پیڈ۔',
        capabilities: [
          'فوری نوٹس تحریر اور ترمیم',
          'آسان شناخت کے لیے رنگین ترتیب',
          'محفوظ شدہ نوٹس میں فوری تلاش',
        ],
      },
      'todo-list': {
        name: 'ٹو ڈو لسٹ',
        shortDesc: 'روزمرہ کاموں کو ترتیب دیں اور وقت پر مکمل کریں۔',
        fullDesc:
          'واضح چیک لسٹ اور تکمیل کی پیشرفت کے ساتھ اپنے روزمرہ کاموں کو منظم رکھیں۔',
        capabilities: [
          'روزمرہ کام شامل کریں، مکمل نشان زد کریں اور ترجیح دیں',
          'جاری اور مکمل شدہ کاموں کی فلٹرنگ',
          'تیز اور ہلکا پھلکا آف لائن ریکارڈ',
        ],
      },
      'expense-tracker': {
        name: 'اخراجات کا حساب',
        shortDesc: 'روزمرہ اخراجات کا ریکارڈ اور بجٹ پر نظر رکھیں۔',
        fullDesc:
          'اپنے روزانہ کے اخراجات آسانی سے درج کریں تاکہ ہفتہ وار اور ماہانہ خرچ کا درست اندازہ رہے۔',
        capabilities: [
          'زمرہ کے لحاظ سے فوری اخراجات کا اندراج',
          'روزانہ اور ماہانہ اخراجات کا مجموعی خلاصہ',
          'واضح اعداد و شمار پر مبنی ریکارڈ',
        ],
      },
      'unit-converter': {
        name: 'یونٹ کنورٹر',
        shortDesc: 'لمبائی، وزن، درجہ حرارت اور دیگر اکائیاں تبدیل کریں۔',
        fullDesc:
          'روزمرہ، تعلیمی اور سفر کی ضروریات کے لیے مختلف پیمائشی اکائیوں کو آسانی سے تبدیل کریں۔',
        capabilities: [
          'لمبائی، وزن، درجہ حرارت اور حجم کی اکائیاں',
          'فوری دو طرفہ تبدیلی کی سہولت',
          'درست اور واضح عددی نتائج',
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
        'EasyDay روزمرہ کے ضروری ٹولز کو ایک تیز، سادہ اور کم وزن اینڈرائیڈ تجربے میں یکجا کرتا ہے۔',
      previewSplashBtn: 'اسپلیش اسکرین دیکھیں',
      developerTitle: 'ڈویلپر کی معلومات',
      developerBody:
        'ZAIDI INTERACTIVE کی جانب سے تیار کردہ، سادہ اور ہر اینڈرائیڈ فون پر تیز چلنے والی ایپلیکیشن۔',
      distributedBy: 'باضابطہ تقسیم: ZAIDI STORE',
      versionLabel: 'ایپ ورژن',
      versionValue: '1.0.0',
      buildPhaseLabel: 'ریلیز مرحلہ',
      buildPhaseValue: 'تمام 6 ٹولز اور گلوبل اشتہارات فعال',
      privacyTitle: 'پرائیویسی پالیسی',
      privacySummary:
        'EasyDay کے لیے عارضی پرائیویسی پالیسی۔ آپ کے نوٹس، کام اور اخراجات صرف آپ کی ڈیوائس پر محفوظ رہتے ہیں۔',
      privacyPlaceholderBody:
        'یہ EasyDay کے لیے پرائیویسی پالیسی کا عارضی متن ہے۔ EasyDay آپ کی منتخب زبان، تھیم، حساب کی ہسٹری، نوٹس، کام اور اخراجات کا ریکارڈ صرف آپ کے اپنے براؤزر یا ڈیوائس میں محفوظ رکھتا ہے۔ کوئی ذاتی ڈیٹا اکٹھا یا باہر ارسال نہیں کیا جاتا۔',
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
