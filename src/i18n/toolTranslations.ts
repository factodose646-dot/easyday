import { Language } from '../types';
import {
  BillCategory,
  BillReminderTiming,
  BillRepeat,
  TransactionCategory,
} from '../utils/storage';

export interface ToolTranslationBundle {
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
    pdfFilenameLabel: string;
    downloadPdfBtn: string;
    choosePathAndSaveBtn: string;
    sharePdfBtn: string;
    openPdfBtn: string;
    generatingPdf: string;
    exportPathHint: string;
    exportSuccess: string;
    exportSavedLocation: string;
    exportCancelled: string;
    noPdfViewerFound: string;
    exportError: string;
    emptyPeriodNotice: string;
    dashboardTitle: string;
    dashboardSubtitle: string;
    savingsRateLabel: string;
    topCategoryLabel: string;
    avgDailySpendLabel: string;
    cashflowTrendTitle: string;
    categoryBreakdownTitle: string;
    noCategorySpending: string;
    prevPeriodAria: string;
    nextPeriodAria: string;
    previewPdfBtn: string;
    previewModalTitle: string;
    previewModalSubtitle: string;
    pageCounterLabel: string;
    ofWord: string;
    zoomFitLabel: string;
    zoomActualLabel: string;
    prevPageAria: string;
    nextPageAria: string;
    shareCancelled: string;
    backBtn: string;
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
  udhaar: {
    givenTotalLabel: string;
    givenSubLabel: string;
    borrowedTotalLabel: string;
    borrowedSubLabel: string;
    netBalanceLabel: string;
    netReceivableNote: string;
    netPayableNote: string;
    netSettledNote: string;
    activeCountLabel: string;
    activeSubLabel: string;
    tabPeople: string;
    tabTransactions: string;
    tabSummary: string;
    addPersonBtn: string;
    addEntryBtn: string;
    searchPlaceholder: string;
    filterAll: string;
    filterGiven: string;
    filterBorrowed: string;
    statusAll: string;
    statusPending: string;
    statusPartial: string;
    statusPaid: string;
    willReceiveBadge: string;
    willPayBadge: string;
    settledBadge: string;
    noContactsTitle: string;
    noContactsBody: string;
    noTransactionsTitle: string;
    noTransactionsBody: string;
    backToPeople: string;
    shareWhatsappStatement: string;
    shareEntryBtn: string;
    copyStatementBtn: string;
    copiedFeedback: string;
    editPersonBtn: string;
    deletePersonBtn: string;
    recordPaymentBtn: string;
    markFullPaidBtn: string;
    paymentHistoryTitle: string;
    noPaymentsYet: string;
    remainingLabel: string;
    paidSoFarLabel: string;
    totalAmountLabel: string;
    dueDateLabel: string;
    optionalDueDate: string;
    personModalAddTitle: string;
    personModalEditTitle: string;
    personNameLabel: string;
    personNamePlaceholder: string;
    personPhoneLabel: string;
    personPhonePlaceholder: string;
    entryModalAddTitle: string;
    entryModalEditTitle: string;
    selectPersonLabel: string;
    quickNewPersonToggle: string;
    directionLabel: string;
    directionGivenOption: string;
    directionBorrowedOption: string;
    amountLabel: string;
    dateLabel: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    paymentModalTitle: string;
    paymentAmountLabel: string;
    paymentDateLabel: string;
    paymentNoteLabel: string;
    paymentNotePlaceholder: string;
    fillRemainingBtn: string;
    confirmPaymentBtn: string;
    saveBtn: string;
    updateBtn: string;
    cancelBtn: string;
    deleteBtn: string;
    editBtn: string;
    confirmDeletePersonTitle: string;
    confirmDeletePersonBody: string;
    confirmDeleteEntryTitle: string;
    confirmDeleteEntryBody: string;
    confirmDeletePaymentTitle: string;
    confirmDeletePaymentBody: string;
    monthlySummaryTitle: string;
    overallSummaryTitle: string;
    selectMonthLabel: string;
    givenInMonthLabel: string;
    borrowedInMonthLabel: string;
    collectedInMonthLabel: string;
    returnedInMonthLabel: string;
    errors: {
      emptyName: string;
      selectPerson: string;
      invalidAmount: string;
      paymentExceedsRemaining: string;
      invalidDate: string;
    };
  };
  bills: {
    upcomingCountLabel: string;
    pendingAmountLabel: string;
    paidMonthLabel: string;
    overdueCountLabel: string;
    notificationBannerTitle: string;
    notificationPermissionMissing: string;
    notificationPermissionReady: string;
    enableNotificationsBtn: string;
    testNotificationBtn: string;
    testNotificationSent: string;
    viewList: string;
    viewCalendar: string;
    viewHistory: string;
    addBillBtn: string;
    searchPlaceholder: string;
    filterAllCategories: string;
    statusAll: string;
    statusOverdue: string;
    statusUpcoming: string;
    statusPaid: string;
    markPaidBtn: string;
    paidSuccessMsg: string;
    recurringGeneratedMsg: string;
    editBtn: string;
    deleteBtn: string;
    dueOnLabel: string;
    overdueByDays: string;
    dueTodayLabel: string;
    dueInDays: string;
    paidOnLabel: string;
    accountRefLabel: string;
    providerLabel: string;
    viewPhotoBtn: string;
    photoPreviewTitle: string;
    closeBtn: string;
    noBillsTitle: string;
    noBillsBody: string;
    noHistoryTitle: string;
    noHistoryBody: string;
    calendarTodayBtn: string;
    calendarSelectedDayTitle: string;
    calendarNoBillsOnDay: string;
    modalAddTitle: string;
    modalEditTitle: string;
    billNameLabel: string;
    billNamePlaceholder: string;
    categoryLabel: string;
    providerFieldLabel: string;
    providerPlaceholder: string;
    amountFieldLabel: string;
    dueDateFieldLabel: string;
    accountNumberLabel: string;
    accountNumberPlaceholder: string;
    repeatLabel: string;
    customDaysLabel: string;
    reminderTimingLabel: string;
    photoAttachLabel: string;
    uploadPhotoBtn: string;
    removePhotoBtn: string;
    photoHint: string;
    saveBillBtn: string;
    updateBillBtn: string;
    cancelBtn: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    categories: Record<BillCategory, string>;
    repeats: Record<BillRepeat, string>;
    timings: Record<BillReminderTiming, string>;
    errors: {
      emptyName: string;
      invalidAmount: string;
      invalidDate: string;
      invalidCustomDays: string;
      imageReadFailed: string;
    };
  };
}

export const TOOL_TRANSLATIONS: Record<Language, ToolTranslationBundle> = {
  en: {
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
      pdfFilenameLabel: 'PDF File Name',
      downloadPdfBtn: 'Download PDF',
      choosePathAndSaveBtn: 'Choose Folder & Save PDF',
      sharePdfBtn: 'Share PDF',
      openPdfBtn: 'Open PDF',
      generatingPdf: 'Generating PDF...',
      exportPathHint:
        'Tap "Choose Folder & Save PDF" to pick any folder on your phone (Downloads, Documents, SD Card, etc.).',
      exportSuccess: 'PDF saved:',
      exportSavedLocation: 'Saved to:',
      exportCancelled: 'Save cancelled — no folder was selected.',
      noPdfViewerFound: 'No PDF viewer app found, or use File Manager at the saved path.',
      exportError: 'Could not generate PDF report. Please try again.',
      emptyPeriodNotice:
        'No transactions recorded in this period. Exporting will create a zero-summary PDF report.',
      dashboardTitle: 'Reports & Analytics Dashboard',
      dashboardSubtitle: 'Interactive Daily, Weekly & Monthly financial insights',
      savingsRateLabel: 'Savings Rate',
      topCategoryLabel: 'Top Spend',
      avgDailySpendLabel: 'Daily Avg Spend',
      cashflowTrendTitle: 'Cashflow Breakdown',
      categoryBreakdownTitle: 'Expense Categories',
      noCategorySpending: 'No expenses recorded in this period yet.',
      prevPeriodAria: 'Previous period',
      nextPeriodAria: 'Next period',
      previewPdfBtn: 'Preview PDF',
      previewModalTitle: 'PDF Report Preview',
      previewModalSubtitle: 'Inspect your formatted report before saving to a folder or sharing.',
      pageCounterLabel: 'Page',
      ofWord: 'of',
      zoomFitLabel: 'Fit Width',
      zoomActualLabel: 'Zoom 140%',
      prevPageAria: 'Previous page',
      nextPageAria: 'Next page',
      shareCancelled: 'Share cancelled.',
      backBtn: 'Back',
      pdfLabels: {
        reportTitle: 'EasyDay — Expense Report',
        subtitle: 'make you easy · ZAIDI INTERACTIVE',
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
    udhaar: {
      givenTotalLabel: 'Total Money Given',
      givenSubLabel: 'Mujhe lene hain',
      borrowedTotalLabel: 'Total Borrowed',
      borrowedSubLabel: 'Mujhe dene hain',
      netBalanceLabel: 'Outstanding Balance',
      netReceivableNote: 'Net Receivable',
      netPayableNote: 'Net Payable',
      netSettledNote: 'All Settled',
      activeCountLabel: 'Active Records',
      activeSubLabel: 'Pending & Partial',
      tabPeople: 'People Ledger',
      tabTransactions: 'All Entries',
      tabSummary: 'Monthly & Overall',
      addPersonBtn: 'Add Person',
      addEntryBtn: 'New Udhaar',
      searchPlaceholder: 'Search by person name, phone, or note...',
      filterAll: 'All',
      filterGiven: 'Given',
      filterBorrowed: 'Borrowed',
      statusAll: 'All Status',
      statusPending: 'Pending',
      statusPartial: 'Partial',
      statusPaid: 'Paid',
      willReceiveBadge: 'To Receive',
      willPayBadge: 'To Pay',
      settledBadge: 'Settled',
      noContactsTitle: 'No Udhaar contacts yet',
      noContactsBody:
        'Add a person or record your first money given/borrowed entry to start tracking balances.',
      noTransactionsTitle: 'No matching Udhaar records',
      noTransactionsBody: 'Adjust your filters or tap "New Udhaar" to record a transaction.',
      backToPeople: 'All People',
      shareWhatsappStatement: 'WhatsApp Statement',
      shareEntryBtn: 'Share',
      copyStatementBtn: 'Copy Statement',
      copiedFeedback: 'Copied to clipboard',
      editPersonBtn: 'Edit Person',
      deletePersonBtn: 'Delete Person',
      recordPaymentBtn: 'Add Payment',
      markFullPaidBtn: 'Mark Paid',
      paymentHistoryTitle: 'Payment History',
      noPaymentsYet: 'No payments recorded yet.',
      remainingLabel: 'Remaining',
      paidSoFarLabel: 'Paid',
      totalAmountLabel: 'Total',
      dueDateLabel: 'Due Date',
      optionalDueDate: 'Due Date (Optional)',
      personModalAddTitle: 'Add Contact',
      personModalEditTitle: 'Edit Contact',
      personNameLabel: 'Person Name',
      personNamePlaceholder: 'e.g. Bilal Ahmed / Ali Kiryana',
      personPhoneLabel: 'Phone Number (Optional)',
      personPhonePlaceholder: 'e.g. 0300-1234567',
      entryModalAddTitle: 'Record Udhaar Entry',
      entryModalEditTitle: 'Edit Udhaar Entry',
      selectPersonLabel: 'Select Person',
      quickNewPersonToggle: '+ Quick Add New Person',
      directionLabel: 'Transaction Type',
      directionGivenOption: 'Money Given (Mujhe lene hain)',
      directionBorrowedOption: 'Money Borrowed (Mujhe dene hain)',
      amountLabel: 'Amount (PKR)',
      dateLabel: 'Transaction Date',
      descriptionLabel: 'Description / Note',
      descriptionPlaceholder: 'e.g. Shop goods, emergency loan, advance...',
      paymentModalTitle: 'Record Payment',
      paymentAmountLabel: 'Payment Amount (PKR)',
      paymentDateLabel: 'Payment Date',
      paymentNoteLabel: 'Payment Note (Optional)',
      paymentNotePlaceholder: 'e.g. Cash received, JazzCash, EasyPaisa...',
      fillRemainingBtn: 'Full Remaining',
      confirmPaymentBtn: 'Save Payment',
      saveBtn: 'Save',
      updateBtn: 'Update',
      cancelBtn: 'Cancel',
      deleteBtn: 'Delete',
      editBtn: 'Edit',
      confirmDeletePersonTitle: 'Delete Contact & Records?',
      confirmDeletePersonBody:
        'Deleting this person will permanently remove their profile and all associated Udhaar transactions.',
      confirmDeleteEntryTitle: 'Delete Udhaar Record?',
      confirmDeleteEntryBody:
        'This transaction and its payment history will be permanently removed and totals recalculated.',
      confirmDeletePaymentTitle: 'Remove Payment Entry?',
      confirmDeletePaymentBody:
        'Removing this payment will restore the amount back to the remaining balance.',
      monthlySummaryTitle: 'Monthly Summary',
      overallSummaryTitle: 'Overall Account Summary',
      selectMonthLabel: 'Select Month',
      givenInMonthLabel: 'Given in Month',
      borrowedInMonthLabel: 'Borrowed in Month',
      collectedInMonthLabel: 'Collected in Month',
      returnedInMonthLabel: 'Returned in Month',
      errors: {
        emptyName: 'Please enter the person name.',
        selectPerson: 'Please select or add a person.',
        invalidAmount: 'Please enter a valid amount greater than 0.',
        paymentExceedsRemaining: 'Payment cannot exceed remaining balance.',
        invalidDate: 'Please choose a valid date.',
      },
    },
    bills: {
      upcomingCountLabel: 'Upcoming Bills',
      pendingAmountLabel: 'Total Pending',
      paidMonthLabel: 'Paid This Month',
      overdueCountLabel: 'Overdue Bills',
      notificationBannerTitle: 'Android Bill Reminders',
      notificationPermissionMissing:
        'Enable notification permission so EasyDay can alert you before due dates and on overdue bills.',
      notificationPermissionReady:
        'Reminders active · Local alerts scheduled for pending bills.',
      enableNotificationsBtn: 'Allow Alerts',
      testNotificationBtn: 'Test Alert',
      testNotificationSent: 'Test bill reminder notification triggered.',
      viewList: 'Bills List',
      viewCalendar: 'Calendar',
      viewHistory: 'Payment History',
      addBillBtn: 'Add Bill',
      searchPlaceholder: 'Search bill name, provider, or account #...',
      filterAllCategories: 'All Categories',
      statusAll: 'All',
      statusOverdue: 'Overdue',
      statusUpcoming: 'Pending',
      statusPaid: 'Paid',
      markPaidBtn: 'Mark Paid',
      paidSuccessMsg: 'Bill marked as paid.',
      recurringGeneratedMsg: 'Next recurring bill scheduled automatically:',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      dueOnLabel: 'Due',
      overdueByDays: 'days overdue',
      dueTodayLabel: 'Due Today',
      dueInDays: 'days left',
      paidOnLabel: 'Paid on',
      accountRefLabel: 'Ref / Consumer #',
      providerLabel: 'Provider',
      viewPhotoBtn: 'View Bill Photo',
      photoPreviewTitle: 'Attached Bill Photo',
      closeBtn: 'Close',
      noBillsTitle: 'No bills scheduled',
      noBillsBody:
        'Tap "Add Bill" to track electricity, gas, internet, rent, or school fee deadlines.',
      noHistoryTitle: 'No bill payments recorded yet',
      noHistoryBody: 'Marked-as-paid bills appear here with date and amount history.',
      calendarTodayBtn: 'Today',
      calendarSelectedDayTitle: 'Bills Due on',
      calendarNoBillsOnDay: 'No bills due on this date.',
      modalAddTitle: 'Add Bill Reminder',
      modalEditTitle: 'Edit Bill',
      billNameLabel: 'Bill Name',
      billNamePlaceholder: 'e.g. Home Electricity Bill',
      categoryLabel: 'Bill Category',
      providerFieldLabel: 'Provider / Company (Optional)',
      providerPlaceholder: 'e.g. LESCO, K-Electric, SNGPL, PTCL',
      amountFieldLabel: 'Amount (PKR)',
      dueDateFieldLabel: 'Due Date',
      accountNumberLabel: 'Account / Reference Number (Optional)',
      accountNumberPlaceholder: 'e.g. 14-11223-445566',
      repeatLabel: 'Repeat Frequency',
      customDaysLabel: 'Repeat Every (Days)',
      reminderTimingLabel: 'Reminder Timing',
      photoAttachLabel: 'Bill Photo (Optional)',
      uploadPhotoBtn: 'Attach Photo',
      removePhotoBtn: 'Remove',
      photoHint: 'Saved locally on device only.',
      saveBillBtn: 'Save Bill',
      updateBillBtn: 'Update Bill',
      cancelBtn: 'Cancel',
      confirmDeleteTitle: 'Delete Bill?',
      confirmDeleteBody:
        'This bill and its scheduled reminder will be permanently removed.',
      categories: {
        electricity: 'Electricity',
        gas: 'Gas',
        water: 'Water',
        internet: 'Internet / Wi-Fi',
        mobile: 'Mobile Packages',
        rent: 'House Rent',
        school: 'School Fees',
        other: 'Other Custom Bills',
      },
      repeats: {
        'one-time': 'One-time',
        monthly: 'Monthly',
        custom: 'Custom Days',
      },
      timings: {
        '1-day': '1 day before',
        '3-days': '3 days before',
        'on-due': 'On due date',
      },
      errors: {
        emptyName: 'Please enter a bill name.',
        invalidAmount: 'Please enter a valid amount greater than 0.',
        invalidDate: 'Please select a valid due date.',
        invalidCustomDays: 'Custom repeat days must be at least 1.',
        imageReadFailed: 'Could not read the selected image.',
      },
    },
  },
  ur: {
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
      pdfFilenameLabel: 'فائل کا نام',
      downloadPdfBtn: 'پی ڈی ایف ڈاؤن لوڈ کریں',
      choosePathAndSaveBtn: 'فولڈر منتخب کر کے محفوظ کریں',
      sharePdfBtn: 'رپورٹ شیئر کریں',
      openPdfBtn: 'پی ڈی ایف کھولیں',
      generatingPdf: 'پی ڈی ایف تیار ہو رہی ہے...',
      exportPathHint:
        'فون کے کسی بھی فولڈر (Downloads، Documents، SD Card وغیرہ) میں محفوظ کرنے کے لیے بٹن دبائیں۔',
      exportSuccess: 'پی ڈی ایف تیار ہو گئی:',
      exportSavedLocation: 'محفوظ شدہ جگہ:',
      exportCancelled: 'محفوظ کرنا منسوخ کر دیا گیا — کوئی فولڈر منتخب نہیں کیا گیا۔',
      noPdfViewerFound: 'فون میں کوئی پی ڈی ایف ریڈر ایپ نہیں ملی، فائل مینیجر سے کھولیں۔',
      exportError: 'پی ڈی ایف رپورٹ تیار نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔',
      emptyPeriodNotice:
        'اس مدت میں کوئی مالی اندراج موجود نہیں ہے۔ محفوظ کرنے پر صفر خلاصہ رپورٹ تیار ہوگی۔',
      dashboardTitle: 'ہفتہ وار اور ماہانہ رپورٹس ڈیش بورڈ',
      dashboardSubtitle: 'روزانہ، ہفتہ وار اور ماہانہ مالی کارکردگی کا جدید تجزیہ',
      savingsRateLabel: 'بچت کی شرح',
      topCategoryLabel: 'سب سے زیادہ خرچ',
      avgDailySpendLabel: 'یومیہ اوسط خرچ',
      cashflowTrendTitle: 'آمدنی بمقابلہ اخراجات کا چارٹ',
      categoryBreakdownTitle: 'زمرہ وار اخراجات',
      noCategorySpending: 'اس مدت میں ابھی کوئی خرچ درج نہیں ہوا۔',
      prevPeriodAria: 'پچھلی مدت',
      nextPeriodAria: 'اگلی مدت',
      previewPdfBtn: 'پی ڈی ایف پیش نظارہ',
      previewModalTitle: 'پی ڈی ایف رپورٹ کا پیش نظارہ',
      previewModalSubtitle: 'فولڈر میں محفوظ کرنے یا شیئر کرنے سے پہلے رپورٹ کی مکمل جانچ کریں۔',
      pageCounterLabel: 'صفحہ',
      ofWord: 'از',
      zoomFitLabel: 'مکمل فٹ',
      zoomActualLabel: 'بڑا منظر',
      prevPageAria: 'پچھلا صفحہ',
      nextPageAria: 'اگلا صفحہ',
      shareCancelled: 'شیئرنگ منسوخ کر دی گئی۔',
      backBtn: 'واپس',
      pdfLabels: {
        reportTitle: 'EasyDay — اخراجات اور آمدنی کی رپورٹ',
        subtitle: 'make you easy · ZAIDI INTERACTIVE',
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
    udhaar: {
      givenTotalLabel: 'کل دی گئی رقم',
      givenSubLabel: 'مجھے لینے ہیں',
      borrowedTotalLabel: 'کل لی گئی رقم',
      borrowedSubLabel: 'مجھے دینے ہیں',
      netBalanceLabel: 'مجموعی باقی حساب',
      netReceivableNote: 'آپ کو ملنے ہیں',
      netPayableNote: 'آپ نے دینے ہیں',
      netSettledNote: 'حساب برابر',
      activeCountLabel: 'جاری ریکارڈ',
      activeSubLabel: 'باقی اور جزوی',
      tabPeople: 'افراد کا کھاتہ',
      tabTransactions: 'تمام اندراجات',
      tabSummary: 'ماہانہ اور مجموعی',
      addPersonBtn: 'نیا شخص',
      addEntryBtn: 'نیا ادھار',
      searchPlaceholder: 'نام، فون نمبر یا تفصیل سے تلاش کریں...',
      filterAll: 'سب',
      filterGiven: 'دیے گئے',
      filterBorrowed: 'لیے گئے',
      statusAll: 'سب حالتیں',
      statusPending: 'باقی',
      statusPartial: 'جزوی ادا',
      statusPaid: 'مکمل ادا',
      willReceiveBadge: 'لینے ہیں',
      willPayBadge: 'دینے ہیں',
      settledBadge: 'برابر',
      noContactsTitle: 'ابھی کوئی ادھار کھاتہ موجود نہیں',
      noContactsBody:
        'حساب کتاب شروع کرنے کے لیے نیا شخص شامل کریں یا پہلا ادھار اندراج درج کریں۔',
      noTransactionsTitle: 'کوئی ادھار ریکارڈ نہیں ملا',
      noTransactionsBody: 'فلٹر تبدیل کریں یا نیا اندراج شامل کرنے کے لیے "نیا ادھار" پر ٹیپ کریں۔',
      backToPeople: 'تمام افراد',
      shareWhatsappStatement: 'واٹس ایپ اسٹیٹمنٹ',
      shareEntryBtn: 'شیئر',
      copyStatementBtn: 'اسٹیٹمنٹ کاپی کریں',
      copiedFeedback: 'کلپ بورڈ پر کاپی ہو گیا',
      editPersonBtn: 'ترمیم',
      deletePersonBtn: 'شخص حذف کریں',
      recordPaymentBtn: 'ادائیگی درج کریں',
      markFullPaidBtn: 'مکمل ادا',
      paymentHistoryTitle: 'ادائیگیوں کی ہسٹری',
      noPaymentsYet: 'ابھی کوئی ادائیگی درج نہیں ہوئی۔',
      remainingLabel: 'باقی',
      paidSoFarLabel: 'وصول/ادا',
      totalAmountLabel: 'کل رقم',
      dueDateLabel: 'واپسی کی تاریخ',
      optionalDueDate: 'واپسی کی تاریخ (اختیاری)',
      personModalAddTitle: 'نیا شخص شامل کریں',
      personModalEditTitle: 'شخص کی تفصیل میں ترمیم',
      personNameLabel: 'شخص کا نام',
      personNamePlaceholder: 'مثلاً بلال احمد / علی کریانہ',
      personPhoneLabel: 'فون نمبر (اختیاری)',
      personPhonePlaceholder: 'مثلاً 0300-1234567',
      entryModalAddTitle: 'نیا ادھار اندراج',
      entryModalEditTitle: 'ادھار اندراج میں ترمیم',
      selectPersonLabel: 'شخص منتخب کریں',
      quickNewPersonToggle: '+ نیا شخص فوری شامل کریں',
      directionLabel: 'لین دین کی قسم',
      directionGivenOption: 'رقم دی (مجھے لینے ہیں)',
      directionBorrowedOption: 'رقم لی (مجھے دینے ہیں)',
      amountLabel: 'رقم (PKR)',
      dateLabel: 'تاریخ',
      descriptionLabel: 'تفصیل / نوٹ',
      descriptionPlaceholder: 'مثلاً دکان کا سامان، قرض یا پیشگی...',
      paymentModalTitle: 'ادائیگی / وصولی درج کریں',
      paymentAmountLabel: 'ادائیگی کی رقم (PKR)',
      paymentDateLabel: 'ادائیگی کی تاریخ',
      paymentNoteLabel: 'نوٹ (اختیاری)',
      paymentNotePlaceholder: 'مثلاً نقد، جیز کیش یا ایزی پیسہ...',
      fillRemainingBtn: 'مکمل باقی رقم',
      confirmPaymentBtn: 'ادائیگی محفوظ کریں',
      saveBtn: 'محفوظ کریں',
      updateBtn: 'اپ ڈیٹ کریں',
      cancelBtn: 'منسوخ کریں',
      deleteBtn: 'حذف کریں',
      editBtn: 'ترمیم',
      confirmDeletePersonTitle: 'شخص اور اس کا کھاتہ حذف کریں؟',
      confirmDeletePersonBody:
        'اس شخص کو حذف کرنے سے اس کے تمام ادھار ریکارڈ مستقل طور پر ختم ہو جائیں گے۔',
      confirmDeleteEntryTitle: 'ادھار ریکارڈ حذف کریں؟',
      confirmDeleteEntryBody:
        'یہ اندراج اور اس کی ادائیگیوں کی ہسٹری مستقل طور پر حذف ہو جائے گی۔',
      confirmDeletePaymentTitle: 'ادائیگی کا اندراج ہٹائیں؟',
      confirmDeletePaymentBody:
        'یہ ادائیگی ہٹانے سے رقم دوبارہ باقی کھاتے میں شامل ہو جائے گی۔',
      monthlySummaryTitle: 'ماہانہ خلاصہ',
      overallSummaryTitle: 'مجموعی کھاتہ خلاصہ',
      selectMonthLabel: 'مہینہ منتخب کریں',
      givenInMonthLabel: 'اس ماہ دی گئی رقم',
      borrowedInMonthLabel: 'اس ماہ لی گئی رقم',
      collectedInMonthLabel: 'اس ماہ وصول شدہ',
      returnedInMonthLabel: 'اس ماہ واپس کی گئی',
      errors: {
        emptyName: 'براہ کرم شخص کا نام درج کریں۔',
        selectPerson: 'براہ کرم کوئی شخص منتخب کریں یا نیا شامل کریں۔',
        invalidAmount: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        paymentExceedsRemaining: 'ادائیگی باقی رقم سے زیادہ نہیں ہو سکتی۔',
        invalidDate: 'براہ کرم درست تاریخ منتخب کریں۔',
      },
    },
    bills: {
      upcomingCountLabel: 'آنے والے بلز',
      pendingAmountLabel: 'کل واجب الادا رقم',
      paidMonthLabel: 'اس ماہ ادا شدہ',
      overdueCountLabel: 'تاخیر شدہ بلز',
      notificationBannerTitle: 'اینڈرائیڈ بل ریمائنڈرز',
      notificationPermissionMissing:
        'بل کی آخری تاریخ سے پہلے اور تاخیر کے الرٹس پانے کے لیے نوٹیفکیشن کی اجازت دیں۔',
      notificationPermissionReady:
        'ریمائنڈرز فعال ہیں · تمام باقی بلز کے الرٹس شیڈول ہو چکے ہیں۔',
      enableNotificationsBtn: 'اجازت دیں',
      testNotificationBtn: 'ٹیسٹ الرٹ',
      testNotificationSent: 'ٹیسٹ بل ریمائنڈر نوٹیفکیشن بھیج دیا گیا۔',
      viewList: 'بلز کی فہرست',
      viewCalendar: 'کیلنڈر',
      viewHistory: 'ادائیگیوں کی ہسٹری',
      addBillBtn: 'نیا بل شامل کریں',
      searchPlaceholder: 'بل کا نام، کمپنی یا اکاؤنٹ نمبر تلاش کریں...',
      filterAllCategories: 'تمام زمرے',
      statusAll: 'سب',
      statusOverdue: 'تاخیر شدہ',
      statusUpcoming: 'باقی',
      statusPaid: 'ادا شدہ',
      markPaidBtn: 'ادا ہو گیا',
      paidSuccessMsg: 'بل ادا شدہ نشان زد کر دیا گیا۔',
      recurringGeneratedMsg: 'اگلے ماہ/دور کا بل خودکار تیار ہو گیا:',
      editBtn: 'ترمیم',
      deleteBtn: 'حذف کریں',
      dueOnLabel: 'آخری تاریخ',
      overdueByDays: 'دن تاخیر',
      dueTodayLabel: 'آج آخری تاریخ',
      dueInDays: 'دن باقی',
      paidOnLabel: 'ادائیگی کی تاریخ',
      accountRefLabel: 'صارف / ریفرنس نمبر',
      providerLabel: 'کمپنی',
      viewPhotoBtn: 'بل کی تصویر دیکھیں',
      photoPreviewTitle: 'منسلک بل کی تصویر',
      closeBtn: 'بند کریں',
      noBillsTitle: 'ابھی کوئی بل شامل نہیں',
      noBillsBody:
        'بجلی، گیس، انٹرنیٹ، کرایہ یا اسکول فیس کے بلز منظم کرنے کے لیے "نیا بل شامل کریں" پر ٹیپ کریں۔',
      noHistoryTitle: 'ابھی کوئی بل ادائیگی درج نہیں',
      noHistoryBody: 'ادا شدہ بلز کی تاریخ اور تفصیل یہاں محفوظ رہے گی۔',
      calendarTodayBtn: 'آج',
      calendarSelectedDayTitle: 'اس تاریخ کے بلز:',
      calendarNoBillsOnDay: 'اس تاریخ پر کوئی بل واجب الادا نہیں۔',
      modalAddTitle: 'نیا بل ریمائنڈر',
      modalEditTitle: 'بل میں ترمیم',
      billNameLabel: 'بل کا نام',
      billNamePlaceholder: 'مثلاً گھر کا بجلی کا بل',
      categoryLabel: 'بل کا زمرہ',
      providerFieldLabel: 'کمپنی / ادارہ (اختیاری)',
      providerPlaceholder: 'مثلاً LESCO، K-Electric، SNGPL، PTCL',
      amountFieldLabel: 'رقم (PKR)',
      dueDateFieldLabel: 'آخری تاریخ',
      accountNumberLabel: 'اکاؤنٹ / ریفرنس نمبر (اختیاری)',
      accountNumberPlaceholder: 'مثلاً 14-11223-445566',
      repeatLabel: 'دہرائی کی ترتیب',
      customDaysLabel: 'کتنے دن بعد دہرائیں',
      reminderTimingLabel: 'یاد دہانی کا وقت',
      photoAttachLabel: 'بل کی تصویر (اختیاری)',
      uploadPhotoBtn: 'تصویر منسلک کریں',
      removePhotoBtn: 'ہٹائیں',
      photoHint: 'صرف آپ کی ڈیوائس پر محفوظ رہے گی۔',
      saveBillBtn: 'بل محفوظ کریں',
      updateBillBtn: 'بل اپ ڈیٹ کریں',
      cancelBtn: 'منسوخ کریں',
      confirmDeleteTitle: 'بل حذف کریں؟',
      confirmDeleteBody:
        'یہ بل اور اس کا شیڈول شدہ ریمائنڈر مستقل طور پر حذف ہو جائے گا۔',
      categories: {
        electricity: 'بجلی',
        gas: 'گیس',
        water: 'پانی',
        internet: 'انٹرنیٹ / وائی فائی',
        mobile: 'موبائل پیکجز',
        rent: 'گھر کا کرایہ',
        school: 'اسکول فیس',
        other: 'دیگر بل',
      },
      repeats: {
        'one-time': 'صرف ایک بار',
        monthly: 'ماہانہ',
        custom: 'مخصوص دن',
      },
      timings: {
        '1-day': '1 دن پہلے',
        '3-days': '3 دن پہلے',
        'on-due': 'آخری تاریخ پر',
      },
      errors: {
        emptyName: 'براہ کرم بل کا نام درج کریں۔',
        invalidAmount: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        invalidDate: 'براہ کرم درست آخری تاریخ منتخب کریں۔',
        invalidCustomDays: 'مخصوص دن کم از کم 1 ہونا ضروری ہے۔',
        imageReadFailed: 'منتخب تصویر لوڈ نہیں ہو سکی۔',
      },
    },
  },
};
