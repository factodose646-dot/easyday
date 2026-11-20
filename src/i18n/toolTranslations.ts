import { Language } from '../types';
import { TransactionCategory } from '../utils/storage';
import { ConverterCategory, UnitCode } from '../utils/unitConverter';

export interface ToolTranslationBundle {
  calculator: {
    historyTitle: string;
    clearHistory: string;
    noHistory: string;
    showHistory: string;
    hideHistory: string;
    tapToReuse: string;
    errors: {
      divideByZero: string;
      invalidExpression: string;
      overflow: string;
    };
  };
  age: {
    dobLabel: string;
    calculateBtn: string;
    clearBtn: string;
    yearsLabel: string;
    monthsLabel: string;
    daysLabel: string;
    totalMonthsLabel: string;
    totalDaysLabel: string;
    nextBirthdayLabel: string;
    daysRemaining: string;
    birthdayToday: string;
    exactAgeHeading: string;
    errors: {
      empty: string;
      invalid: string;
      future: string;
    };
  };
  notes: {
    searchPlaceholder: string;
    newNoteBtn: string;
    emptyTitle: string;
    emptySubtitle: string;
    noMatch: string;
    titlePlaceholder: string;
    descPlaceholder: string;
    untitled: string;
    createdLabel: string;
    modifiedLabel: string;
    savedStatus: string;
    backToList: string;
    editBtn: string;
    deleteBtn: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    cancelBtn: string;
    confirmBtn: string;
  };
  todo: {
    inputPlaceholder: string;
    addBtn: string;
    emptyInputError: string;
    progressLabel: string;
    tasksCompletedOf: string;
    pendingTitle: string;
    completedTitle: string;
    noPending: string;
    noCompleted: string;
    createdLabel: string;
    saveBtn: string;
    cancelBtn: string;
    editBtn: string;
    deleteBtn: string;
    clearCompletedBtn: string;
    confirmClearTitle: string;
    confirmClearBody: string;
  };
  expense: {
    currencyCode: string;
    balanceLabel: string;
    incomeLabel: string;
    expensesLabel: string;
    addTransactionBtn: string;
    editTransactionTitle: string;
    newTransactionTitle: string;
    typeIncome: string;
    typeExpense: string;
    amountLabel: string;
    amountPlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    categoryLabel: string;
    dateLabel: string;
    saveBtn: string;
    updateBtn: string;
    cancelBtn: string;
    dailySummaryTitle: string;
    weeklySummaryTitle: string;
    monthlySummaryTitle: string;
    selectDayLabel: string;
    selectWeekLabel: string;
    selectMonthLabel: string;
    netLabel: string;
    exportPdfBtn: string;
    pdfModalTitle: string;
    reportPeriodLabel: string;
    periodDaily: string;
    periodWeekly: string;
    periodMonthly: string;
    reportRangeLabel: string;
    reportPreviewTitle: string;
    transactionsCountLabel: string;
    downloadPdfBtn: string;
    sharePdfBtn: string;
    generatingPdf: string;
    exportSuccess: string;
    exportError: string;
    emptyPeriodNotice: string;
    pdfLabels: {
      reportTitle: string;
      subtitle: string;
      dailyBadge: string;
      weeklyBadge: string;
      monthlyBadge: string;
      periodLabel: string;
      generatedLabel: string;
      recordsLabel: string;
      totalIncomeLabel: string;
      totalExpensesLabel: string;
      netBalanceLabel: string;
      categoryHeading: string;
      categoryCol: string;
      countCol: string;
      amountCol: string;
      shareCol: string;
      transactionsHeading: string;
      dateCol: string;
      descriptionCol: string;
      typeCol: string;
      noTransactionsInPeriod: string;
      footerLeft: string;
      pageLabel: string;
      ofLabel: string;
    };
    historyTitle: string;
    filterAll: string;
    filterIncome: string;
    filterExpense: string;
    noTransactions: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    deleteBtn: string;
    errors: {
      invalidAmount: string;
      emptyDescription: string;
      invalidDate: string;
    };
    categories: Record<TransactionCategory, string>;
  };
  converter: {
    valueLabel: string;
    valuePlaceholder: string;
    fromLabel: string;
    toLabel: string;
    swapLabel: string;
    resultLabel: string;
    allUnitsTitle: string;
    categories: Record<ConverterCategory, string>;
    units: Record<UnitCode, string>;
    errors: {
      invalidNumber: string;
      belowAbsoluteZero: string;
    };
  };
}

export const TOOL_TRANSLATIONS: Record<Language, ToolTranslationBundle> = {
  en: {
    calculator: {
      historyTitle: 'Calculation History',
      clearHistory: 'Clear History',
      noHistory: 'Your completed calculations will appear here.',
      showHistory: 'History',
      hideHistory: 'Keypad',
      tapToReuse: 'Tap any entry to reuse its result',
      errors: {
        divideByZero: 'Cannot divide by zero.',
        invalidExpression: 'Invalid mathematical expression.',
        overflow: 'Number is too large to calculate.',
      },
    },
    age: {
      dobLabel: 'Date of Birth',
      calculateBtn: 'Calculate Age',
      clearBtn: 'Clear',
      yearsLabel: 'Years',
      monthsLabel: 'Months',
      daysLabel: 'Days',
      totalMonthsLabel: 'Total Months',
      totalDaysLabel: 'Total Days',
      nextBirthdayLabel: 'Next Birthday',
      daysRemaining: 'days remaining',
      birthdayToday: 'Happy Birthday! Today is your birthday.',
      exactAgeHeading: 'Exact Age',
      errors: {
        empty: 'Please select your date of birth.',
        invalid: 'Please enter a valid calendar date.',
        future: 'Date of birth cannot be in the future.',
      },
    },
    notes: {
      searchPlaceholder: 'Search notes by title or text...',
      newNoteBtn: 'New Note',
      emptyTitle: 'No notes saved yet',
      emptySubtitle: 'Tap "New Note" to write down ideas, lists, or reminders.',
      noMatch: 'No notes match your search.',
      titlePlaceholder: 'Note title...',
      descPlaceholder: 'Write your note here...',
      untitled: 'Untitled Note',
      createdLabel: 'Created',
      modifiedLabel: 'Modified',
      savedStatus: 'Auto-saved',
      backToList: 'All Notes',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      confirmDeleteTitle: 'Delete Note?',
      confirmDeleteBody: 'This note will be permanently removed from this device.',
      cancelBtn: 'Cancel',
      confirmBtn: 'Delete',
    },
    todo: {
      inputPlaceholder: 'Add a new task...',
      addBtn: 'Add Task',
      emptyInputError: 'Please enter a task description before adding.',
      progressLabel: 'Daily Progress',
      tasksCompletedOf: 'completed',
      pendingTitle: 'Pending Tasks',
      completedTitle: 'Completed Tasks',
      noPending: 'All caught up! No pending tasks.',
      noCompleted: 'No tasks completed yet.',
      createdLabel: 'Created',
      saveBtn: 'Save',
      cancelBtn: 'Cancel',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      clearCompletedBtn: 'Clear Completed',
      confirmClearTitle: 'Clear Completed Tasks?',
      confirmClearBody: 'All completed tasks will be permanently removed.',
    },
    expense: {
      currencyCode: 'PKR',
      balanceLabel: 'Remaining Balance',
      incomeLabel: 'Total Income',
      expensesLabel: 'Total Expenses',
      addTransactionBtn: 'Add Entry',
      editTransactionTitle: 'Edit Transaction',
      newTransactionTitle: 'New Transaction',
      typeIncome: 'Income',
      typeExpense: 'Expense',
      amountLabel: 'Amount (PKR)',
      amountPlaceholder: '0',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'e.g. Grocery shopping or monthly salary',
      categoryLabel: 'Category',
      dateLabel: 'Date',
      saveBtn: 'Save Transaction',
      updateBtn: 'Update Transaction',
      cancelBtn: 'Cancel',
      dailySummaryTitle: 'Daily Summary',
      weeklySummaryTitle: 'Weekly Summary',
      monthlySummaryTitle: 'Monthly Summary',
      selectDayLabel: 'Day',
      selectWeekLabel: 'Week of',
      selectMonthLabel: 'Month',
      netLabel: 'Net',
      exportPdfBtn: 'Export PDF Report',
      pdfModalTitle: 'Export Expense Report (PDF)',
      reportPeriodLabel: 'Report Period',
      periodDaily: 'Daily',
      periodWeekly: 'Weekly',
      periodMonthly: 'Monthly',
      reportRangeLabel: 'Date Range',
      reportPreviewTitle: 'Report Summary Preview',
      transactionsCountLabel: 'Transactions',
      downloadPdfBtn: 'Download PDF',
      sharePdfBtn: 'Share PDF',
      generatingPdf: 'Generating PDF...',
      exportSuccess: 'PDF saved:',
      exportError: 'Could not generate PDF report. Please try again.',
      emptyPeriodNotice:
        'No transactions recorded in this period. Downloading will create a zero-summary PDF report.',
      pdfLabels: {
        reportTitle: 'EasyDay — Expense Report',
        subtitle: 'Everything Made Easy · ZAIDI INTERACTIVE',
        dailyBadge: 'DAILY REPORT',
        weeklyBadge: 'WEEKLY REPORT',
        monthlyBadge: 'MONTHLY REPORT',
        periodLabel: 'Period',
        generatedLabel: 'Generated',
        recordsLabel: 'Records',
        totalIncomeLabel: 'Total Income',
        totalExpensesLabel: 'Total Expenses',
        netBalanceLabel: 'Net Balance',
        categoryHeading: 'Category Breakdown',
        categoryCol: 'Category',
        countCol: 'Entries',
        amountCol: 'Amount',
        shareCol: 'Share',
        transactionsHeading: 'Transactions',
        dateCol: 'Date',
        descriptionCol: 'Description',
        typeCol: 'Type',
        noTransactionsInPeriod:
          'No income or expense transactions recorded during this period.',
        footerLeft: 'EasyDay Expense Tracker · Stored locally on device',
        pageLabel: 'Page',
        ofLabel: 'of',
      },
      historyTitle: 'Transaction History',
      filterAll: 'All',
      filterIncome: 'Income',
      filterExpense: 'Expense',
      noTransactions: 'No transactions recorded yet.',
      confirmDeleteTitle: 'Delete Transaction?',
      confirmDeleteBody: 'This record will be permanently removed and totals updated.',
      deleteBtn: 'Delete',
      errors: {
        invalidAmount: 'Please enter a valid amount greater than 0.',
        emptyDescription: 'Please enter a short description.',
        invalidDate: 'Please select a valid transaction date.',
      },
      categories: {
        salary: 'Salary',
        business: 'Business',
        freelance: 'Freelance',
        gift: 'Gift',
        food: 'Food & Dining',
        transport: 'Transport',
        bills: 'Bills & Utilities',
        shopping: 'Shopping',
        health: 'Health',
        education: 'Education',
        other: 'Other',
      },
    },
    converter: {
      valueLabel: 'Enter Value',
      valuePlaceholder: 'Enter a number...',
      fromLabel: 'From',
      toLabel: 'To',
      swapLabel: 'Swap units',
      resultLabel: 'Converted Result',
      allUnitsTitle: 'All Conversions in This Category',
      categories: {
        length: 'Length',
        weight: 'Weight',
        temperature: 'Temperature',
        volume: 'Volume',
      },
      units: {
        mm: 'Millimeter (mm)',
        cm: 'Centimeter (cm)',
        m: 'Meter (m)',
        km: 'Kilometer (km)',
        in: 'Inch (in)',
        ft: 'Foot (ft)',
        yd: 'Yard (yd)',
        mi: 'Mile (mi)',
        mg: 'Milligram (mg)',
        g: 'Gram (g)',
        kg: 'Kilogram (kg)',
        lb: 'Pound (lb)',
        oz: 'Ounce (oz)',
        c: 'Celsius (°C)',
        f: 'Fahrenheit (°F)',
        k: 'Kelvin (K)',
        ml: 'Milliliter (mL)',
        l: 'Liter (L)',
        gal: 'Gallon (gal)',
      },
      errors: {
        invalidNumber: 'Enter a valid numeric value to convert.',
        belowAbsoluteZero: 'Temperature cannot be below absolute zero (-273.15 °C).',
      },
    },
  },
  ur: {
    calculator: {
      historyTitle: 'حساب کی ہسٹری',
      clearHistory: 'ہسٹری صاف کریں',
      noHistory: 'آپ کے مکمل حساب کتاب یہاں ظاہر ہوں گے۔',
      showHistory: 'ہسٹری',
      hideHistory: 'کی پیڈ',
      tapToReuse: 'نتیجہ دوبارہ استعمال کرنے کے لیے ٹیپ کریں',
      errors: {
        divideByZero: 'صفر پر تقسیم ممکن نہیں ہے۔',
        invalidExpression: 'حسابی عبارت درست نہیں ہے۔',
        overflow: 'یہ عدد حساب کے لیے بہت بڑا ہے۔',
      },
    },
    age: {
      dobLabel: 'تاریخ پیدائش',
      calculateBtn: 'عمر معلوم کریں',
      clearBtn: 'صاف کریں',
      yearsLabel: 'سال',
      monthsLabel: 'مہینے',
      daysLabel: 'دن',
      totalMonthsLabel: 'کل مہینے',
      totalDaysLabel: 'کل دن',
      nextBirthdayLabel: 'اگلی سالگرہ',
      daysRemaining: 'دن باقی ہیں',
      birthdayToday: 'سالگرہ مبارک! آج آپ کی سالگرہ ہے۔',
      exactAgeHeading: 'درست عمر',
      errors: {
        empty: 'براہ کرم اپنی تاریخ پیدائش منتخب کریں۔',
        invalid: 'براہ کرم درست تاریخ درج کریں۔',
        future: 'تاریخ پیدائش مستقبل کی نہیں ہو سکتی۔',
      },
    },
    notes: {
      searchPlaceholder: 'عنوان یا متن سے نوٹس تلاش کریں...',
      newNoteBtn: 'نیا نوٹ',
      emptyTitle: 'ابھی کوئی نوٹ محفوظ نہیں',
      emptySubtitle: 'خیالات یا یاد دہانیاں لکھنے کے لیے "نیا نوٹ" پر ٹیپ کریں۔',
      noMatch: 'آپ کی تلاش کے مطابق کوئی نوٹ نہیں ملا۔',
      titlePlaceholder: 'نوٹ کا عنوان...',
      descPlaceholder: 'اپنا نوٹ یہاں لکھیں...',
      untitled: 'بغیر عنوان نوٹ',
      createdLabel: 'تیار کردہ',
      modifiedLabel: 'ترمیم شدہ',
      savedStatus: 'خودکار محفوظ',
      backToList: 'تمام نوٹس',
      editBtn: 'ترمیم',
      deleteBtn: 'حذف کریں',
      confirmDeleteTitle: 'نوٹ حذف کریں؟',
      confirmDeleteBody: 'یہ نوٹ اس ڈیوائس سے مستقل طور پر حذف ہو جائے گا۔',
      cancelBtn: 'منسوخ کریں',
      confirmBtn: 'حذف کریں',
    },
    todo: {
      inputPlaceholder: 'نیا کام شامل کریں...',
      addBtn: 'شامل کریں',
      emptyInputError: 'براہ کرم شامل کرنے سے پہلے کام تحریر کریں۔',
      progressLabel: 'آج کی پیشرفت',
      tasksCompletedOf: 'مکمل',
      pendingTitle: 'باقی کام',
      completedTitle: 'مکمل شدہ کام',
      noPending: 'شاباش! کوئی کام باقی نہیں ہے۔',
      noCompleted: 'ابھی کوئی کام مکمل نہیں ہوا۔',
      createdLabel: 'شامل کردہ',
      saveBtn: 'محفوظ کریں',
      cancelBtn: 'منسوخ کریں',
      editBtn: 'ترمیم',
      deleteBtn: 'حذف کریں',
      clearCompletedBtn: 'مکمل کام صاف کریں',
      confirmClearTitle: 'مکمل شدہ کام صاف کریں؟',
      confirmClearBody: 'تمام مکمل شدہ کام مستقل طور پر ہٹا دیے جائیں گے۔',
    },
    expense: {
      currencyCode: 'PKR',
      balanceLabel: 'باقی رقم',
      incomeLabel: 'کل آمدنی',
      expensesLabel: 'کل اخراجات',
      addTransactionBtn: 'نیا اندراج',
      editTransactionTitle: 'اندراج میں ترمیم',
      newTransactionTitle: 'نیا مالی اندراج',
      typeIncome: 'آمدنی',
      typeExpense: 'خرچ',
      amountLabel: 'رقم (PKR)',
      amountPlaceholder: '0',
      descriptionLabel: 'تفصیل',
      descriptionPlaceholder: 'مثلاً راشن یا ماہانہ تنخواہ',
      categoryLabel: 'زمرہ',
      dateLabel: 'تاریخ',
      saveBtn: 'محفوظ کریں',
      updateBtn: 'اپ ڈیٹ کریں',
      cancelBtn: 'منسوخ کریں',
      dailySummaryTitle: 'روزانہ کا خلاصہ',
      weeklySummaryTitle: 'ہفتہ وار خلاصہ',
      monthlySummaryTitle: 'ماہانہ خلاصہ',
      selectDayLabel: 'دن',
      selectWeekLabel: 'ہفتہ',
      selectMonthLabel: 'مہینہ',
      netLabel: 'خالص',
      exportPdfBtn: 'پی ڈی ایف رپورٹ',
      pdfModalTitle: 'اخراجات کی پی ڈی ایف رپورٹ',
      reportPeriodLabel: 'رپورٹ کی مدت',
      periodDaily: 'روزانہ',
      periodWeekly: 'ہفتہ وار',
      periodMonthly: 'ماہانہ',
      reportRangeLabel: 'تاریخ کی حد',
      reportPreviewTitle: 'رپورٹ کا پیشگی خلاصہ',
      transactionsCountLabel: 'اندراجات',
      downloadPdfBtn: 'پی ڈی ایف ڈاؤن لوڈ کریں',
      sharePdfBtn: 'رپورٹ شیئر کریں',
      generatingPdf: 'پی ڈی ایف تیار ہو رہی ہے...',
      exportSuccess: 'پی ڈی ایف تیار ہو گئی:',
      exportError: 'پی ڈی ایف رپورٹ تیار نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔',
      emptyPeriodNotice:
        'اس مدت میں کوئی مالی اندراج موجود نہیں ہے۔ ڈاؤن لوڈ کرنے پر صفر خلاصہ رپورٹ تیار ہوگی۔',
      pdfLabels: {
        reportTitle: 'EasyDay — اخراجات اور آمدنی کی رپورٹ',
        subtitle: 'Everything Made Easy · ZAIDI INTERACTIVE',
        dailyBadge: 'روزانہ رپورٹ',
        weeklyBadge: 'ہفتہ وار رپورٹ',
        monthlyBadge: 'ماہانہ رپورٹ',
        periodLabel: 'مدت',
        generatedLabel: 'تیاری کا وقت',
        recordsLabel: 'تعداد',
        totalIncomeLabel: 'کل آمدنی',
        totalExpensesLabel: 'کل اخراجات',
        netBalanceLabel: 'خالص بچت',
        categoryHeading: 'زمرہ وار تفصیل',
        categoryCol: 'زمرہ',
        countCol: 'تعداد',
        amountCol: 'رقم',
        shareCol: 'تناسب',
        transactionsHeading: 'لین دین کی تفصیل',
        dateCol: 'تاریخ',
        descriptionCol: 'تفصیل',
        typeCol: 'قسم',
        noTransactionsInPeriod: 'اس مدت کے دوران کوئی آمدنی یا خرچ درج نہیں کیا گیا۔',
        footerLeft: 'EasyDay Expense Tracker · ڈیٹا صرف آپ کی ڈیوائس پر محفوظ ہے',
        pageLabel: 'صفحہ',
        ofLabel: 'از',
      },
      historyTitle: 'لین دین کی ہسٹری',
      filterAll: 'سب',
      filterIncome: 'آمدنی',
      filterExpense: 'اخراجات',
      noTransactions: 'ابھی کوئی مالی اندراج موجود نہیں ہے۔',
      confirmDeleteTitle: 'اندراج حذف کریں؟',
      confirmDeleteBody: 'یہ ریکارڈ مستقل طور پر حذف ہو جائے گا اور حساب اپ ڈیٹ ہو جائے گا۔',
      deleteBtn: 'حذف کریں',
      errors: {
        invalidAmount: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        emptyDescription: 'براہ کرم مختصر تفصیل درج کریں۔',
        invalidDate: 'براہ کرم درست تاریخ منتخب کریں۔',
      },
      categories: {
        salary: 'تنخواہ',
        business: 'کاروبار',
        freelance: 'فری لانس',
        gift: 'تحفہ',
        food: 'کھانا اور راشن',
        transport: 'سفر اور کرایہ',
        bills: 'بلز اور یوٹیلیٹیز',
        shopping: 'خریداری',
        health: 'صحت',
        education: 'تعلیم',
        other: 'دیگر',
      },
    },
    converter: {
      valueLabel: 'قدر درج کریں',
      valuePlaceholder: 'عدد لکھیں...',
      fromLabel: 'اس اکائی سے',
      toLabel: 'اس اکائی میں',
      swapLabel: 'اکائیاں تبدیل کریں',
      resultLabel: 'تبدیل شدہ نتیجہ',
      allUnitsTitle: 'اس زمرے کی تمام اکائیاں',
      categories: {
        length: 'لمبائی',
        weight: 'وزن',
        temperature: 'درجہ حرارت',
        volume: 'حجم',
      },
      units: {
        mm: 'ملی میٹر (mm)',
        cm: 'سینٹی میٹر (cm)',
        m: 'میٹر (m)',
        km: 'کلومیٹر (km)',
        in: 'انچ (in)',
        ft: 'فٹ (ft)',
        yd: 'گز (yd)',
        mi: 'میل (mi)',
        mg: 'ملی گرام (mg)',
        g: 'گرام (g)',
        kg: 'کلوگرام (kg)',
        lb: 'پاؤنڈ (lb)',
        oz: 'اونس (oz)',
        c: 'سیلسیئس (°C)',
        f: 'فارن ہائیٹ (°F)',
        k: 'کیلون (K)',
        ml: 'ملی لیٹر (mL)',
        l: 'لیٹر (L)',
        gal: 'گیلن (gal)',
      },
      errors: {
        invalidNumber: 'تبدیلی کے لیے درست عدد درج کریں۔',
        belowAbsoluteZero: 'درجہ حرارت مطلق صفر (-273.15 °C) سے کم نہیں ہو سکتا۔',
      },
    },
  },
};
