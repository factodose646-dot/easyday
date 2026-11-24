import { Language } from '../types';
import {
  BillCategory,
  BillReminderTiming,
  BillRepeat,
  KametiInstallmentStatus,
  KametiPaymentFrequency,
  KametiPaymentMethod,
  KametiStatus,
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
    linkedBillBadge: string;
    linkedUdhaarBadge: string;
    udhaarRepaidSummaryLabel: string;
    udhaarCollectedHint: string;
    linkedEditBannerBill: string;
    linkedEditBannerUdhaar: string;
    confirmDeleteLinkedBillTitle: string;
    confirmDeleteLinkedBillBody: string;
    deleteExpenseAndUnpayBillBtn: string;
    deleteExpenseOnlyBtn: string;
    confirmDeleteLinkedUdhaarTitle: string;
    confirmDeleteLinkedUdhaarBody: string;
    errors: {
      invalidAmount: string;
      emptyDescription: string;
      invalidDate: string;
      linkedUdhaarExceedsMax: string;
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
    paymentsReceivedTotalLabel: string;
    paymentsMadeTotalLabel: string;
    cashflowSyncedHint: string;
    viewStatementBtn: string;
    downloadPdfBtn: string;
    sharePdfBtn: string;
    whatsappReminderBtn: string;
    statement: {
      modalTitle: string;
      modalSubtitle: string;
      rangeAllTime: string;
      rangeCurrentMonth: string;
      rangePreviousMonth: string;
      rangeCustom: string;
      fromDateLabel: string;
      toDateLabel: string;
      summaryTabLabel: string;
      pdfPreviewTabLabel: string;
      overallStandingTitle: string;
      periodActivityTitle: string;
      periodEntriesLabel: string;
      periodPaymentsLabel: string;
      statusReceivable: string;
      statusPayable: string;
      statusSettled: string;
      whatsappSharePdfBtn: string;
      whatsappShareHint: string;
      filenameLabel: string;
      exportPathHint: string;
      choosePathAndSaveBtn: string;
      downloadPdfBtn: string;
      generatingPdf: string;
      exportSuccess: string;
      exportSavedLocation: string;
      exportCancelled: string;
      exportError: string;
      shareCancelled: string;
      openPdfBtn: string;
      noPdfViewerFound: string;
      prevPageAria: string;
      nextPageAria: string;
      zoomFitLabel: string;
      zoomActualLabel: string;
      pdf: {
        title: string;
        subtitle: string;
        customerLabel: string;
        dateRangeLabel: string;
        generatedLabel: string;
        totalOriginalLabel: string;
        totalPaidLabel: string;
        remainingBalanceLabel: string;
        inPeriodLabel: string;
        paymentsCountLabel: string;
        periodDistinctionNote: string;
        entriesHeading: string;
        paymentHistoryHeading: string;
        dateCol: string;
        typeCol: string;
        descCol: string;
        originalCol: string;
        paidCol: string;
        balanceCol: string;
        amountCol: string;
        prevBalanceCol: string;
        remBalanceCol: string;
        givenShort: string;
        borrowedShort: string;
        noEntriesInPeriod: string;
        noPaymentsInPeriod: string;
        footerLeft: string;
        pageLabel: string;
        ofLabel: string;
      };
    };
    reminder: {
      modalTitle: string;
      modalSubtitle: string;
      modeReceivableBadge: string;
      modePayableBadge: string;
      modeSettledBadge: string;
      templateLangLabel: string;
      messageLabel: string;
      phoneTargetLabel: string;
      noPhoneSavedNote: string;
      resetTemplateBtn: string;
      confirmHint: string;
      openWhatsappBtn: string;
      shareOtherAppsBtn: string;
      copyBtn: string;
    };
    errors: {
      emptyName: string;
      selectPerson: string;
      invalidAmount: string;
      paymentExceedsRemaining: string;
      amountBelowPaid: string;
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
    markUnpaidBtn: string;
    paidSuccessMsg: string;
    paidWithExpenseMsg: string;
    unpaidSuccessMsg: string;
    linkedExpenseBadge: string;
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
    loadingPhotoMsg: string;
    photoMissingMsg: string;
    savingPhotoMsg: string;
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
    confirmDeletePaidBody: string;
    deleteBillAndExpenseBtn: string;
    deleteBillOnlyBtn: string;
    confirmUnpayTitle: string;
    confirmUnpayWithExpenseBody: string;
    confirmUnpaySimpleBody: string;
    unpayAndRemoveExpenseBtn: string;
    unpayAndKeepExpenseBtn: string;
    confirmUnpayBtn: string;
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
  kameti: {
    title: string;
    subtitle: string;
    newCommitteeBtn: string;
    editCommitteeBtn: string;
    deleteCommitteeBtn: string;
    noCommitteesTitle: string;
    noCommitteesBody: string;
    filterAll: string;
    statuses: Record<KametiStatus, string>;
    frequencies: Record<KametiPaymentFrequency, string>;
    installmentStatuses: Record<KametiInstallmentStatus, string>;
    paymentMethods: Record<KametiPaymentMethod, string>;
    isolationHint: string;
    tabs: {
      overview: string;
      members: string;
      installments: string;
      draws: string;
      reports: string;
    };
    metrics: {
      totalMembers: string;
      monthlyInstallment: string;
      expectedMonthly: string;
      totalExpected: string;
      totalCollected: string;
      remainingCollection: string;
      paidCount: string;
      partialCount: string;
      unpaidCount: string;
      overdueCount: string;
      currentCycle: string;
      currentRecipient: string;
      noRecipientYet: string;
      progressLabel: string;
    };
    committeeForm: {
      addTitle: string;
      editTitle: string;
      nameLabel: string;
      namePlaceholder: string;
      monthlyAmountLabel: string;
      memberCountLabel: string;
      startDateLabel: string;
      durationLabel: string;
      frequencyLabel: string;
      collectionDayLabel: string;
      collectionDayHint: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      statusLabel: string;
      autoPreviewHeading: string;
      saveBtn: string;
      updateBtn: string;
    };
    memberForm: {
      addBtn: string;
      addTitle: string;
      editTitle: string;
      nameLabel: string;
      namePlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      addressLabel: string;
      addressPlaceholder: string;
      memberNumberLabel: string;
      joiningDateLabel: string;
      turnNumberLabel: string;
      turnOptionalPlaceholder: string;
      emptyTitle: string;
      emptyBody: string;
      saveBtn: string;
      updateBtn: string;
      removeBtn: string;
      confirmRemoveTitle: string;
      confirmRemoveSimpleBody: string;
      confirmRemoveHistoryWarning: string;
      confirmForceRemoveBtn: string;
      paymentsRecordedLabel: string;
      drawsRecordedLabel: string;
    };
    installmentsUI: {
      collectPaymentBtn: string;
      filterByMember: string;
      allMembersOption: string;
      filterByStatus: string;
      cycleLabel: string;
      dueLabel: string;
      expectedLabel: string;
      paidLabel: string;
      remainingLabel: string;
      methodLabel: string;
      emptyBody: string;
      paymentModalTitle: string;
      selectMemberLabel: string;
      selectInstallmentLabel: string;
      amountLabel: string;
      fillRemainingBtn: string;
      dateLabel: string;
      paymentMethodLabel: string;
      noteLabel: string;
      notePlaceholder: string;
      savePaymentBtn: string;
      paymentHistoryHeading: string;
      noPaymentsYet: string;
      removePaymentTitle: string;
      removePaymentBody: string;
    };
    drawsUI: {
      manualAssignTitle: string;
      randomDrawTitle: string;
      randomDrawBtn: string;
      manualAssignBtn: string;
      selectMemberLabel: string;
      selectTurnLabel: string;
      payoutDateLabel: string;
      payoutAmountLabel: string;
      markCompletedLabel: string;
      notesLabel: string;
      notesPlaceholder: string;
      eligibleCountLabel: string;
      noEligibleMsg: string;
      confirmModalTitle: string;
      confirmRandomTitle: string;
      confirmModalHint: string;
      winnerLabel: string;
      turnLabel: string;
      payoutLabel: string;
      redrawBtn: string;
      confirmSaveDrawBtn: string;
      historyHeading: string;
      noDrawsYet: string;
      completedBadge: string;
      scheduledBadge: string;
      modeRandomBadge: string;
      modeManualBadge: string;
      markPayoutDoneBtn: string;
      wheelTitle: string;
      wheelSubtitle: string;
      spinWheelBtn: string;
      spinningBtn: string;
      spinAgainBtn: string;
      wheelPointerLabel: string;
      wheelStoppedOnLabel: string;
      saveWheelWinnerBtn: string;
      wheelHubSpin: string;
    };
    reportsUI: {
      committeeReportTitle: string;
      committeeReportSubtitle: string;
      previewCommitteePdfBtn: string;
      memberStatementBtn: string;
      whatsappReminderBtn: string;
      memberStatementModalTitle: string;
      memberStatementModalSubtitle: string;
      pdfPreviewTab: string;
      detailsTab: string;
      filenameLabel: string;
      choosePathAndSaveBtn: string;
      downloadPdfBtn: string;
      sharePdfBtn: string;
      whatsappSharePdfBtn: string;
      whatsappShareHint: string;
      exportPathHint: string;
      generatingPdf: string;
      exportSuccess: string;
      exportSavedLocation: string;
      exportCancelled: string;
      shareCancelled: string;
      exportError: string;
      openPdfBtn: string;
      noPdfViewerFound: string;
      prevPageAria: string;
      nextPageAria: string;
      zoomFitLabel: string;
      zoomActualLabel: string;
      reminderTitle: string;
      reminderSubtitle: string;
      reminderMessageLabel: string;
      resetTemplateBtn: string;
      openWhatsappBtn: string;
      shareOtherAppsBtn: string;
      copyBtn: string;
      copiedFeedback: string;
      phoneTargetLabel: string;
      noPhoneSavedNote: string;
      confirmSendHint: string;
      pdf: {
        memberStatementTitle: string;
        committeeReportTitle: string;
        subtitle: string;
        committeeLabel: string;
        memberLabel: string;
        phoneLabel: string;
        turnStatusLabel: string;
        generatedLabel: string;
        statusLabel: string;
        frequencyLabel: string;
        collectionDayLabel: string;
        startDateLabel: string;
        durationLabel: string;
        expectedMonthlyLabel: string;
        expectedTotalLabel: string;
        collectedLabel: string;
        remainingLabel: string;
        memberExpectedLabel: string;
        memberPaidLabel: string;
        memberOutstandingLabel: string;
        installmentsHeading: string;
        paymentHistoryHeading: string;
        membersHeading: string;
        monthlySummaryHeading: string;
        drawsHeading: string;
        outstandingHeading: string;
        cycleCol: string;
        dueDateCol: string;
        expectedCol: string;
        paidCol: string;
        remainingCol: string;
        statusCol: string;
        dateCol: string;
        methodCol: string;
        amountCol: string;
        noteCol: string;
        memberCol: string;
        turnCol: string;
        winnerCol: string;
        payoutCol: string;
        noRowsMsg: string;
        footerLeft: string;
        pageLabel: string;
        ofLabel: string;
      };
    };
    confirmDeleteCommitteeTitle: string;
    confirmDeleteCommitteeBody: string;
    cancelBtn: string;
    deleteBtn: string;
    closeBtn: string;
    errors: {
      INVALID_COMMITTEE_NAME: string;
      INVALID_INSTALLMENT_AMOUNT: string;
      INVALID_MEMBER_COUNT: string;
      INVALID_DURATION: string;
      INVALID_COLLECTION_DAY: string;
      INVALID_DATE: string;
      COMMITTEE_NOT_FOUND: string;
      COMMITTEE_FULL: string;
      INVALID_MEMBER_NAME: string;
      INVALID_MEMBER_NUMBER: string;
      INVALID_TURN_NUMBER: string;
      DUPLICATE_MEMBER_NUMBER: string;
      DUPLICATE_MEMBER_PHONE: string;
      DUPLICATE_MEMBER_NAME: string;
      DUPLICATE_TURN_NUMBER: string;
      MEMBER_NOT_FOUND: string;
      MEMBER_HAS_HISTORY: string;
      INSTALLMENT_NOT_FOUND: string;
      INVALID_PAYMENT_AMOUNT: string;
      PAYMENT_EXCEEDS_REMAINING: string;
      DUPLICATE_PAYMENT_SUBMISSION: string;
      PAYMENT_NOT_FOUND: string;
      DRAW_MEMBER_ALREADY_ASSIGNED: string;
      DRAW_TURN_ALREADY_TAKEN: string;
      NO_ELIGIBLE_MEMBERS: string;
      INVALID_PAYOUT_AMOUNT: string;
      DRAW_NOT_FOUND: string;
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
      linkedBillBadge: 'Synced · Bill',
      linkedUdhaarBadge: 'Synced · Udhaar',
      udhaarRepaidSummaryLabel: 'Debt Repayments (Cash Outflow)',
      udhaarCollectedHint: 'Includes Udhaar Collections:',
      linkedEditBannerBill:
        'This expense is linked to a Paid Bill. Amount and date edits will also update the linked bill record.',
      linkedEditBannerUdhaar:
        'This cashflow entry is linked to an Udhaar payment. Amount and date edits will sync back to Udhaar.',
      confirmDeleteLinkedBillTitle: 'Delete Bill-Linked Expense?',
      confirmDeleteLinkedBillBody:
        'This expense was automatically created from a paid bill. Choose whether to revert that bill back to Unpaid or delete only this expense:',
      deleteExpenseAndUnpayBillBtn: 'Delete & Mark Bill Unpaid',
      deleteExpenseOnlyBtn: 'Delete Expense Only',
      confirmDeleteLinkedUdhaarTitle: 'Delete Udhaar Payment Entry?',
      confirmDeleteLinkedUdhaarBody:
        'Deleting this entry will also remove the linked payment from its Udhaar record and restore the remaining balance.',
      errors: {
        invalidAmount: 'Please enter a valid amount greater than 0.',
        emptyDescription: 'Please enter a short description.',
        invalidDate: 'Please select a valid transaction date.',
        linkedUdhaarExceedsMax:
          'Amount cannot exceed the Udhaar remaining allowance for this entry.',
      },
      categories: {
        salary: 'Salary',
        business: 'Business',
        freelance: 'Freelance',
        gift: 'Gift',
        udhaar_collection: 'Udhaar Received',
        food: 'Food & Dining',
        transport: 'Transport',
        bills: 'Bills & Utilities',
        shopping: 'Shopping',
        health: 'Health',
        education: 'Education',
        udhaar_repayment: 'Udhaar Repayment',
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
      paymentsReceivedTotalLabel: 'Total Payments Received',
      paymentsMadeTotalLabel: 'Total Payments Made',
      cashflowSyncedHint:
        'Payments update balances automatically & record cashflow accurately without inflating expenses.',
      viewStatementBtn: 'View Statement',
      downloadPdfBtn: 'Download PDF',
      sharePdfBtn: 'Share PDF',
      whatsappReminderBtn: 'WhatsApp Reminder',
      statement: {
        modalTitle: 'Customer Account Statement',
        modalSubtitle: 'Preview ledger details, filter dates, download PDF, or share on WhatsApp.',
        rangeAllTime: 'All Time',
        rangeCurrentMonth: 'Current Month',
        rangePreviousMonth: 'Previous Month',
        rangeCustom: 'Custom Range',
        fromDateLabel: 'From',
        toDateLabel: 'To',
        summaryTabLabel: 'Ledger & History',
        pdfPreviewTabLabel: 'A4 PDF Preview',
        overallStandingTitle: 'Overall Current Standing',
        periodActivityTitle: 'Selected Period Activity',
        periodEntriesLabel: 'Entries in Period',
        periodPaymentsLabel: 'Payments in Period',
        statusReceivable: 'Outstanding · To Receive',
        statusPayable: 'Outstanding · To Pay',
        statusSettled: 'Settled · Zero Balance',
        whatsappSharePdfBtn: 'Share PDF on WhatsApp',
        whatsappShareHint:
          'Generates and attaches the actual PDF file via your Android share sheet so you can pick WhatsApp and confirm before sending.',
        filenameLabel: 'Statement PDF Filename',
        exportPathHint:
          'You can select any phone folder (Documents, Downloads, SD card) before saving.',
        choosePathAndSaveBtn: 'Choose Folder & Save',
        downloadPdfBtn: 'Download PDF',
        generatingPdf: 'Generating PDF...',
        exportSuccess: 'PDF ready:',
        exportSavedLocation: 'Saved to:',
        exportCancelled: 'Save cancelled.',
        exportError: 'Could not generate or share the statement PDF.',
        shareCancelled: 'Share cancelled.',
        openPdfBtn: 'Open Saved PDF',
        noPdfViewerFound: 'Saved successfully, no default PDF viewer app found.',
        prevPageAria: 'Previous page',
        nextPageAria: 'Next page',
        zoomFitLabel: 'Fit Width',
        zoomActualLabel: 'Zoom 140%',
        pdf: {
          title: 'Customer Udhaar Statement',
          subtitle: 'EasyDay Daily Finance & Khata Ledger',
          customerLabel: 'Customer',
          dateRangeLabel: 'Statement Period',
          generatedLabel: 'Generated',
          totalOriginalLabel: 'Total Original Udhaar',
          totalPaidLabel: 'Total Paid',
          remainingBalanceLabel: 'Remaining Balance',
          inPeriodLabel: 'Period Activity',
          paymentsCountLabel: 'Payments in Period',
          periodDistinctionNote:
            'Top cards show overall current account standing; tables below reflect the selected statement date range.',
          entriesHeading: 'Udhaar Entries in Period',
          paymentHistoryHeading: 'Payment History (Chronological)',
          dateCol: 'Date',
          typeCol: 'Type',
          descCol: 'Description',
          originalCol: 'Original',
          paidCol: 'Paid',
          balanceCol: 'Balance',
          amountCol: 'Payment',
          prevBalanceCol: 'Prev Bal',
          remBalanceCol: 'Rem Bal',
          givenShort: 'Given',
          borrowedShort: 'Borrowed',
          noEntriesInPeriod: 'No new Udhaar entries recorded in this date range.',
          noPaymentsInPeriod: 'No payments recorded in this date range.',
          footerLeft: 'EasyDay · Customer Financial Statement',
          pageLabel: 'Page',
          ofLabel: 'of',
        },
      },
      reminder: {
        modalTitle: 'WhatsApp Payment Reminder',
        modalSubtitle: 'Review or customize the message before opening WhatsApp.',
        modeReceivableBadge: 'Money to Receive',
        modePayableBadge: 'Money to Pay',
        modeSettledBadge: 'Settled Account',
        templateLangLabel: 'Message Wording',
        messageLabel: 'Reminder Message (Editable)',
        phoneTargetLabel: 'Recipient Number',
        noPhoneSavedNote:
          'No phone saved for this contact — WhatsApp will let you choose a chat.',
        resetTemplateBtn: 'Reset Wording',
        confirmHint:
          'Opens WhatsApp with this draft message so you can review and tap Send.',
        openWhatsappBtn: 'Open in WhatsApp',
        shareOtherAppsBtn: 'Share via Apps',
        copyBtn: 'Copy Text',
      },
      errors: {
        emptyName: 'Please enter the person name.',
        selectPerson: 'Please select or add a person.',
        invalidAmount: 'Please enter a valid amount greater than 0.',
        paymentExceedsRemaining: 'Payment cannot exceed remaining balance.',
        amountBelowPaid:
          'Original amount cannot be less than already paid total. Remove payments first if lowering amount.',
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
      markUnpaidBtn: 'Mark Unpaid',
      paidSuccessMsg: 'Bill marked as paid.',
      paidWithExpenseMsg: 'Bill marked paid & expense synced automatically.',
      unpaidSuccessMsg: 'Bill marked as unpaid.',
      linkedExpenseBadge: 'Expense Synced',
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
      loadingPhotoMsg: 'Loading photo...',
      photoMissingMsg: 'This bill photo could not be found in offline storage.',
      savingPhotoMsg: 'Saving...',
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
      confirmDeletePaidBody:
        'This paid bill has a linked expense in Expense Tracker. Choose whether to delete both the bill and its linked expense, or keep the expense record safely.',
      deleteBillAndExpenseBtn: 'Delete Bill & Linked Expense',
      deleteBillOnlyBtn: 'Delete Bill Only (Keep Expense)',
      confirmUnpayTitle: 'Mark Bill as Unpaid?',
      confirmUnpayWithExpenseBody:
        'This paid bill has a linked expense entry. Marking it unpaid will clear its paid status—choose how to handle the linked expense:',
      confirmUnpaySimpleBody:
        'This will revert the bill back to Pending status and remove its payment history entry.',
      unpayAndRemoveExpenseBtn: 'Mark Unpaid & Remove Expense',
      unpayAndKeepExpenseBtn: 'Mark Unpaid & Keep Expense',
      confirmUnpayBtn: 'Mark Unpaid',
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
    kameti: {
      title: 'Kameti (BC) Manager',
      subtitle: 'Organize rotating savings committees, members, installments, draws & PDF reports.',
      newCommitteeBtn: 'Create Kameti',
      editCommitteeBtn: 'Edit Kameti',
      deleteCommitteeBtn: 'Delete Kameti',
      noCommitteesTitle: 'No Kameti (BC) committees yet',
      noCommitteesBody:
        'Create your first savings committee with monthly installment amount, members, collection date & duration.',
      filterAll: 'All',
      statuses: {
        active: 'Active',
        completed: 'Completed',
      },
      frequencies: {
        monthly: 'Monthly',
        biweekly: 'Bi-weekly (Every 14 Days)',
        weekly: 'Weekly',
      },
      installmentStatuses: {
        paid: 'Paid',
        partial: 'Partial',
        unpaid: 'Unpaid',
        overdue: 'Overdue',
      },
      paymentMethods: {
        Cash: 'Cash',
        JazzCash: 'JazzCash',
        EasyPaisa: 'EasyPaisa',
        'Bank Transfer': 'Bank Transfer',
        Other: 'Other',
      },
      isolationHint:
        'Kameti funds are tracked separately and never mixed with your personal income or expense totals.',
      tabs: {
        overview: 'Dashboard',
        members: 'Members',
        installments: 'Installments',
        draws: 'Draw / Parchi',
        reports: 'Reports & PDF',
      },
      metrics: {
        totalMembers: 'Members',
        monthlyInstallment: 'Per Member / Month',
        expectedMonthly: 'Expected Monthly',
        totalExpected: 'Expected Total',
        totalCollected: 'Total Collected',
        remainingCollection: 'Remaining',
        paidCount: 'Paid',
        partialCount: 'Partial',
        unpaidCount: 'Unpaid',
        overdueCount: 'Overdue',
        currentCycle: 'Current Cycle',
        currentRecipient: 'Current Recipient',
        noRecipientYet: 'Not drawn yet',
        progressLabel: 'Collection Progress',
      },
      committeeForm: {
        addTitle: 'Create New Kameti (BC)',
        editTitle: 'Edit Kameti Details',
        nameLabel: 'Committee Name',
        namePlaceholder: 'e.g. Ghar Kameti 2026 / Office BC',
        monthlyAmountLabel: 'Monthly Installment (PKR)',
        memberCountLabel: 'Number of Members',
        startDateLabel: 'Start Date',
        durationLabel: 'Duration (Months)',
        frequencyLabel: 'Payment Frequency',
        collectionDayLabel: 'Collection Day of Month (1-31)',
        collectionDayHint: 'Installments become due on this day each cycle.',
        descriptionLabel: 'Description / Rules (Optional)',
        descriptionPlaceholder: 'e.g. Monthly collection on 5th, draw at 8 PM',
        statusLabel: 'Committee Status',
        autoPreviewHeading: 'Expected Collection Preview',
        saveBtn: 'Create Committee',
        updateBtn: 'Save Changes',
      },
      memberForm: {
        addBtn: 'Add Member',
        addTitle: 'Add Committee Member',
        editTitle: 'Edit Member Details',
        nameLabel: 'Member Name',
        namePlaceholder: 'e.g. Salman Tariq',
        phoneLabel: 'Phone / WhatsApp Number',
        phonePlaceholder: 'e.g. 0300-1234567',
        addressLabel: 'Address (Optional)',
        addressPlaceholder: 'e.g. Gulberg III, Lahore',
        memberNumberLabel: 'Member #',
        joiningDateLabel: 'Joining Date',
        turnNumberLabel: 'Assigned Draw / Turn # (Optional)',
        turnOptionalPlaceholder: 'Leave empty for later draw',
        emptyTitle: 'No members added yet',
        emptyBody:
          'Add members to automatically generate their installment schedules for this committee.',
        saveBtn: 'Add Member & Generate Schedule',
        updateBtn: 'Update Member',
        removeBtn: 'Remove',
        confirmRemoveTitle: 'Remove Member?',
        confirmRemoveSimpleBody:
          'This member has no recorded payments or draws. Removing will clear their unpaid installment rows.',
        confirmRemoveHistoryWarning:
          'Safety Alert: This member already has recorded payment or draw history. Removing them permanently deletes their payment and draw records from this committee.',
        confirmForceRemoveBtn: 'Confirm Remove Anyway',
        paymentsRecordedLabel: 'Payments recorded',
        drawsRecordedLabel: 'Draws assigned',
      },
      installmentsUI: {
        collectPaymentBtn: 'Collect Payment',
        filterByMember: 'Member',
        allMembersOption: 'All Members',
        filterByStatus: 'Status',
        cycleLabel: 'Cycle',
        dueLabel: 'Due',
        expectedLabel: 'Expected',
        paidLabel: 'Paid',
        remainingLabel: 'Remaining',
        methodLabel: 'Method',
        emptyBody: 'No installments match this filter.',
        paymentModalTitle: 'Collect Kameti Installment',
        selectMemberLabel: 'Member',
        selectInstallmentLabel: 'Installment / Cycle',
        amountLabel: 'Payment Amount (PKR)',
        fillRemainingBtn: 'Full Remaining',
        dateLabel: 'Payment Date',
        paymentMethodLabel: 'Payment Method',
        noteLabel: 'Notes (Optional)',
        notePlaceholder: 'e.g. Received via JazzCash ref #421',
        savePaymentBtn: 'Record Payment',
        paymentHistoryHeading: 'Recent Collection History',
        noPaymentsYet: 'No installment payments collected yet.',
        removePaymentTitle: 'Remove Payment Record?',
        removePaymentBody:
          'Removing this payment restores the amount back to the member installment balance.',
      },
      drawsUI: {
        manualAssignTitle: 'Manual Turn Assignment',
        randomDrawTitle: 'Random Draw (Parchi)',
        randomDrawBtn: 'Run Random Draw',
        manualAssignBtn: 'Assign Turn',
        selectMemberLabel: 'Eligible Member',
        selectTurnLabel: 'Turn / Month #',
        payoutDateLabel: 'Payout Date',
        payoutAmountLabel: 'Payout Amount (PKR)',
        markCompletedLabel: 'Mark payout completed now',
        notesLabel: 'Notes (Optional)',
        notesPlaceholder: 'e.g. Handed over in cash / Bank transfer',
        eligibleCountLabel: 'Eligible members remaining',
        noEligibleMsg: 'All enrolled members already have an assigned draw turn.',
        confirmModalTitle: 'Confirm Draw / Turn Assignment',
        confirmRandomTitle: 'Random Draw Selection Ready',
        confirmModalHint:
          'Review carefully before saving. Saved draw history cannot be silently overwritten.',
        winnerLabel: 'Selected Member',
        turnLabel: 'Assigned Turn',
        payoutLabel: 'Payout Amount',
        redrawBtn: 'Pick Again',
        confirmSaveDrawBtn: 'Confirm & Save Draw',
        historyHeading: 'Draw / Parchi History',
        noDrawsYet: 'No draw / turn records saved yet.',
        completedBadge: 'Payout Completed',
        scheduledBadge: 'Turn Scheduled',
        modeRandomBadge: 'Random Parchi',
        modeManualBadge: 'Manual',
        markPayoutDoneBtn: 'Mark Completed',
        wheelTitle: 'Kameti Draw Wheel',
        wheelSubtitle: 'All eligible members appear on the wheel. Spin to pick who gets this turn.',
        spinWheelBtn: 'Spin Draw Wheel',
        spinningBtn: 'Spinning...',
        spinAgainBtn: 'Spin Again',
        wheelPointerLabel: 'Current',
        wheelStoppedOnLabel: 'Wheel stopped on',
        saveWheelWinnerBtn: 'Confirm & Save Winner',
        wheelHubSpin: 'SPIN',
      },
      reportsUI: {
        committeeReportTitle: 'Committee Summary & PDF Report',
        committeeReportSubtitle:
          'Preview, download to folder, or share full Kameti report with member totals, cycles, draws & outstanding dues.',
        previewCommitteePdfBtn: 'Preview & Export Committee PDF',
        memberStatementBtn: 'Statement / PDF',
        whatsappReminderBtn: 'WhatsApp',
        memberStatementModalTitle: 'Member Kameti Statement',
        memberStatementModalSubtitle:
          'Verify paid installments, remaining balance, draw turn & export/share PDF.',
        pdfPreviewTab: 'A4 PDF Preview',
        detailsTab: 'Installments & Payments',
        filenameLabel: 'PDF Filename',
        choosePathAndSaveBtn: 'Choose Folder & Save',
        downloadPdfBtn: 'Download PDF',
        sharePdfBtn: 'Share PDF',
        whatsappSharePdfBtn: 'Share PDF on WhatsApp',
        whatsappShareHint:
          'Opens your device share sheet with this PDF attached so you can select WhatsApp and confirm before sending.',
        exportPathHint:
          'Choose any folder on your phone (Documents, Downloads, SD card) before saving.',
        generatingPdf: 'Generating PDF...',
        exportSuccess: 'PDF ready:',
        exportSavedLocation: 'Saved to:',
        exportCancelled: 'Save cancelled.',
        shareCancelled: 'Share cancelled.',
        exportError: 'Could not generate or share PDF report.',
        openPdfBtn: 'Open Saved PDF',
        noPdfViewerFound: 'File saved, no default PDF viewer app found.',
        prevPageAria: 'Previous page',
        nextPageAria: 'Next page',
        zoomFitLabel: 'Fit Width',
        zoomActualLabel: 'Zoom 140%',
        reminderTitle: 'Kameti WhatsApp Reminder',
        reminderSubtitle: 'Review or customize this update before opening WhatsApp.',
        reminderMessageLabel: 'Reminder Message (Editable)',
        resetTemplateBtn: 'Reset Wording',
        openWhatsappBtn: 'Open in WhatsApp',
        shareOtherAppsBtn: 'Share via Apps',
        copyBtn: 'Copy Message',
        copiedFeedback: 'Copied!',
        phoneTargetLabel: 'Recipient Number',
        noPhoneSavedNote:
          'No phone number saved for this member — WhatsApp will let you pick a chat.',
        confirmSendHint:
          'Opens WhatsApp with this draft message so you can confirm and tap Send.',
        pdf: {
          memberStatementTitle: 'Kameti Member Statement',
          committeeReportTitle: 'Kameti Committee Report',
          subtitle: 'EasyDay Rotating Savings (BC) Management',
          committeeLabel: 'Committee',
          memberLabel: 'Member',
          phoneLabel: 'Phone',
          turnStatusLabel: 'Draw / Turn',
          generatedLabel: 'Generated',
          statusLabel: 'Status',
          frequencyLabel: 'Frequency',
          collectionDayLabel: 'Collection Day',
          startDateLabel: 'Start Date',
          durationLabel: 'Duration',
          expectedMonthlyLabel: 'Expected Monthly',
          expectedTotalLabel: 'Expected Total',
          collectedLabel: 'Total Collected',
          remainingLabel: 'Remaining',
          memberExpectedLabel: 'Expected Total',
          memberPaidLabel: 'Total Paid',
          memberOutstandingLabel: 'Outstanding',
          installmentsHeading: 'Installment Schedule',
          paymentHistoryHeading: 'Payment History',
          membersHeading: 'Members Summary',
          monthlySummaryHeading: 'Monthly / Cycle Collection Summary',
          drawsHeading: 'Draw / Parchi History',
          outstandingHeading: 'Outstanding Installments',
          cycleCol: 'Cycle',
          dueDateCol: 'Due Date',
          expectedCol: 'Expected',
          paidCol: 'Paid',
          remainingCol: 'Remaining',
          statusCol: 'Status',
          dateCol: 'Paid Date',
          methodCol: 'Method',
          amountCol: 'Amount',
          noteCol: 'Note',
          memberCol: 'Member',
          turnCol: 'Turn',
          winnerCol: 'Recipient',
          payoutCol: 'Payout',
          noRowsMsg: 'No records available in this section.',
          footerLeft: 'EasyDay · Kameti (BC) Management Report',
          pageLabel: 'Page',
          ofLabel: 'of',
        },
      },
      confirmDeleteCommitteeTitle: 'Delete Kameti Committee?',
      confirmDeleteCommitteeBody:
        'Deleting this committee permanently removes all its members, schedules, payments, and draw records.',
      cancelBtn: 'Cancel',
      deleteBtn: 'Delete',
      closeBtn: 'Close',
      errors: {
        INVALID_COMMITTEE_NAME: 'Please enter a valid committee name.',
        INVALID_INSTALLMENT_AMOUNT: 'Monthly installment must be greater than 0.',
        INVALID_MEMBER_COUNT:
          'Member count must be at least 2 and not lower than currently enrolled members.',
        INVALID_DURATION: 'Duration must be at least 1 month.',
        INVALID_COLLECTION_DAY: 'Collection day must be between 1 and 31.',
        INVALID_DATE: 'Please choose a valid date.',
        COMMITTEE_NOT_FOUND: 'Selected committee could not be found.',
        COMMITTEE_FULL:
          'This committee already has the maximum number of members. Increase Member Count in Edit Kameti to add more.',
        INVALID_MEMBER_NAME: 'Please enter the member name.',
        INVALID_MEMBER_NUMBER: 'Member number must be a positive whole number.',
        INVALID_TURN_NUMBER: 'Turn number must be a positive whole number.',
        DUPLICATE_MEMBER_NUMBER: 'This member number is already used in this committee.',
        DUPLICATE_MEMBER_PHONE: 'A member with this phone number already exists in this committee.',
        DUPLICATE_MEMBER_NAME: 'A member with this name already exists in this committee.',
        DUPLICATE_TURN_NUMBER: 'This draw/turn number is already assigned in this committee.',
        MEMBER_NOT_FOUND: 'Member not found in this committee.',
        MEMBER_HAS_HISTORY:
          'This member has payment or draw history. Confirm removal explicitly to proceed.',
        INSTALLMENT_NOT_FOUND: 'Selected installment could not be found.',
        INVALID_PAYMENT_AMOUNT: 'Please enter a valid payment amount greater than 0.',
        PAYMENT_EXCEEDS_REMAINING: 'Payment amount exceeds remaining installment balance.',
        DUPLICATE_PAYMENT_SUBMISSION:
          'Duplicate payment blocked. Identical payment was just recorded.',
        PAYMENT_NOT_FOUND: 'Payment record not found.',
        DRAW_MEMBER_ALREADY_ASSIGNED:
          'This member already has an assigned draw/turn in this committee.',
        DRAW_TURN_ALREADY_TAKEN: 'This turn number is already assigned in this committee.',
        NO_ELIGIBLE_MEMBERS: 'No eligible members remain without an assigned turn.',
        INVALID_PAYOUT_AMOUNT: 'Payout amount must be greater than 0.',
        DRAW_NOT_FOUND: 'Draw record not found.',
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
      linkedBillBadge: 'منسلک · بل',
      linkedUdhaarBadge: 'منسلک · ادھار',
      udhaarRepaidSummaryLabel: 'قرض واپسی (نقد ادائیگی)',
      udhaarCollectedHint: 'ادھار وصولی شامل:',
      linkedEditBannerBill:
        'یہ خرچ ادا شدہ بل سے منسلک ہے۔ رقم اور تاریخ میں تبدیلی بل کے ریکارڈ کو بھی اپ ڈیٹ کرے گی۔',
      linkedEditBannerUdhaar:
        'یہ نقد اندراج ادھار ادائیگی سے منسلک ہے۔ رقم اور تاریخ میں تبدیلی ادھار کھاتے میں بھی اپ ڈیٹ ہوگی۔',
      confirmDeleteLinkedBillTitle: 'بل سے منسلک خرچ حذف کریں؟',
      confirmDeleteLinkedBillBody:
        'یہ خرچ ادا شدہ بل کے ساتھ خودکار درج ہوا تھا۔ منتخب کریں کہ بل کو دوبارہ غیر ادا شدہ کرنا ہے یا صرف یہ خرچ حذف کرنا ہے:',
      deleteExpenseAndUnpayBillBtn: 'حذف کریں اور بل غیر ادا شدہ کریں',
      deleteExpenseOnlyBtn: 'صرف خرچ حذف کریں',
      confirmDeleteLinkedUdhaarTitle: 'ادھار ادائیگی کا اندراج حذف کریں؟',
      confirmDeleteLinkedUdhaarBody:
        'اس اندراج کو حذف کرنے سے ادھار ریکارڈ سے بھی یہ ادائیگی ہٹ جائے گی اور باقی رقم بحال ہو جائے گی۔',
      errors: {
        invalidAmount: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        emptyDescription: 'براہ کرم مختصر تفصیل درج کریں۔',
        invalidDate: 'براہ کرم درست تاریخ منتخب کریں۔',
        linkedUdhaarExceedsMax:
          'یہ رقم اس ادھار ریکارڈ کی باقی حد سے زیادہ نہیں ہو سکتی۔',
      },
      categories: {
        salary: 'تنخواہ',
        business: 'کاروبار',
        freelance: 'فری لانس',
        gift: 'تحفہ',
        udhaar_collection: 'ادھار وصولی',
        food: 'کھانا اور راشن',
        transport: 'سفر اور کرایہ',
        bills: 'بلز اور یوٹیلیٹیز',
        shopping: 'خریداری',
        health: 'صحت',
        education: 'تعلیم',
        udhaar_repayment: 'ادھار واپسی',
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
      paymentsReceivedTotalLabel: 'کل وصول شدہ ادائیگیاں',
      paymentsMadeTotalLabel: 'کل کی گئی ادائیگیاں',
      cashflowSyncedHint:
        'ادائیگیاں کھاتہ اور نقد بہاؤ کو درست طریقے سے اپ ڈیٹ کرتی ہیں اور اخراجات میں دوہری گنتی نہیں کرتیں۔',
      viewStatementBtn: 'اسٹیٹمنٹ دیکھیں',
      downloadPdfBtn: 'PDF ڈاؤن لوڈ',
      sharePdfBtn: 'PDF شیئر کریں',
      whatsappReminderBtn: 'واٹس ایپ ریمائنڈر',
      statement: {
        modalTitle: 'کسٹمر کھاتہ اسٹیٹمنٹ',
        modalSubtitle: 'تفصیلات چیک کریں، تاریخ منتخب کریں، PDF محفوظ کریں یا واٹس ایپ پر شیئر کریں۔',
        rangeAllTime: 'مکمل ریکارڈ',
        rangeCurrentMonth: 'موجودہ مہینہ',
        rangePreviousMonth: 'پچھلا مہینہ',
        rangeCustom: 'مخصوص تاریخ',
        fromDateLabel: 'از تاریخ',
        toDateLabel: 'تا تاریخ',
        summaryTabLabel: 'کھاتہ اور ادائیگیاں',
        pdfPreviewTabLabel: 'A4 PDF پیش نظارہ',
        overallStandingTitle: 'مجموعی موجودہ کھاتہ',
        periodActivityTitle: 'منتخب مدت کی سرگرمی',
        periodEntriesLabel: 'مدت میں اندراجات',
        periodPaymentsLabel: 'مدت میں ادائیگیاں',
        statusReceivable: 'باقی · لینے ہیں',
        statusPayable: 'باقی · دینے ہیں',
        statusSettled: 'حساب برابر · صفر بقایا',
        whatsappSharePdfBtn: 'واٹس ایپ پر PDF شیئر کریں',
        whatsappShareHint:
          'یہ آپ کے فون کی شیئر شیٹ کے ذریعے اصل PDF فائل منسلک کرتا ہے تاکہ آپ واٹس ایپ منتخب کر کے بھیج سکیں۔',
        filenameLabel: 'PDF فائل کا نام',
        exportPathHint:
          'محفوظ کرنے سے پہلے آپ فون کا کوئی بھی فولڈر (Documents، Downloads، SD کارڈ) منتخب کر سکتے ہیں۔',
        choosePathAndSaveBtn: 'فولڈر چنیں اور محفوظ کریں',
        downloadPdfBtn: 'PDF ڈاؤن لوڈ',
        generatingPdf: 'PDF تیار ہو رہی ہے...',
        exportSuccess: 'PDF تیار ہے:',
        exportSavedLocation: 'محفوظ مقام:',
        exportCancelled: 'محفوظ کرنا منسوخ کیا گیا۔',
        exportError: 'اسٹیٹمنٹ PDF تیار یا شیئر کرنے میں مسئلہ پیش آیا۔',
        shareCancelled: 'شیئر کرنا منسوخ کیا گیا۔',
        openPdfBtn: 'محفوظ شدہ PDF کھولیں',
        noPdfViewerFound: 'فائل محفوظ ہو گئی، لیکن PDF کھولنے والی ایپ نہیں ملی۔',
        prevPageAria: 'پچھلا صفحہ',
        nextPageAria: 'اگلا صفحہ',
        zoomFitLabel: 'چوڑائی کے مطابق',
        zoomActualLabel: '140% زوم',
        pdf: {
          title: 'کسٹمر ادھار اسٹیٹمنٹ',
          subtitle: 'EasyDay روزانہ فنانس اور کھاتہ سسٹم',
          customerLabel: 'کسٹمر',
          dateRangeLabel: 'اسٹیٹمنٹ کی مدت',
          generatedLabel: 'تیار کردہ تاریخ',
          totalOriginalLabel: 'کل اصل ادھار',
          totalPaidLabel: 'کل ادا شدہ رقم',
          remainingBalanceLabel: 'باقی بقایا رقم',
          inPeriodLabel: 'مدت کا خلاصہ',
          paymentsCountLabel: 'اس مدت کی ادائیگیاں',
          periodDistinctionNote:
            'اوپری کارڈ مجموعی کھاتہ دکھاتے ہیں جبکہ نیچے دی گئی جدول منتخب تاریخوں کا ریکارڈ دکھاتی ہے۔',
          entriesHeading: 'منتخب مدت کے ادھار اندراجات',
          paymentHistoryHeading: 'ادائیگیوں کی مکمل تاریخ (ترتیب وار)',
          dateCol: 'تاریخ',
          typeCol: 'قسم',
          descCol: 'تفصیل',
          originalCol: 'اصل رقم',
          paidCol: 'ادا شدہ',
          balanceCol: 'بقایا',
          amountCol: 'ادائیگی',
          prevBalanceCol: 'پچھلا بقایا',
          remBalanceCol: 'باقی بقایا',
          givenShort: 'دیا',
          borrowedShort: 'لیا',
          noEntriesInPeriod: 'اس تاریخ کی حد میں کوئی نیا ادھار اندراج نہیں ہے۔',
          noPaymentsInPeriod: 'اس تاریخ کی حد میں کوئی ادائیگی درج نہیں ہوئی۔',
          footerLeft: 'EasyDay · کسٹمر مالیاتی اسٹیٹمنٹ',
          pageLabel: 'صفحہ',
          ofLabel: 'از',
        },
      },
      reminder: {
        modalTitle: 'واٹس ایپ ادائیگی ریمائنڈر',
        modalSubtitle: 'واٹس ایپ کھولنے سے پہلے پیغام کا جائزہ لیں یا ترمیم کریں۔',
        modeReceivableBadge: 'وصولی (لینے ہیں)',
        modePayableBadge: 'ادائیگی (دینے ہیں)',
        modeSettledBadge: 'حساب برابر',
        templateLangLabel: 'پیغام کی زبان',
        messageLabel: 'ریمائنڈر پیغام (قابلِ ترمیم)',
        phoneTargetLabel: 'موصول کنندہ نمبر',
        noPhoneSavedNote:
          'اس رابطے کا فون نمبر محفوظ نہیں — واٹس ایپ میں آپ خود چیٹ منتخب کر سکتے ہیں۔',
        resetTemplateBtn: 'اصل عبارت بحال کریں',
        confirmHint:
          'یہ پیغام واٹس ایپ میں کھولتا ہے تاکہ آپ خود چیک کر کے Send دبا سکیں۔',
        openWhatsappBtn: 'واٹس ایپ میں کھولیں',
        shareOtherAppsBtn: 'دیگر ایپس سے شیئر',
        copyBtn: 'پیغام کاپی کریں',
      },
      errors: {
        emptyName: 'براہ کرم شخص کا نام درج کریں۔',
        selectPerson: 'براہ کرم کوئی شخص منتخب کریں یا نیا شامل کریں۔',
        invalidAmount: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        paymentExceedsRemaining: 'ادائیگی باقی رقم سے زیادہ نہیں ہو سکتی۔',
        amountBelowPaid:
          'اصل رقم پہلے سے ادا شدہ رقم سے کم نہیں ہو سکتی۔ کم کرنے سے پہلے ادائیگی ہٹائیں۔',
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
      markUnpaidBtn: 'غیر ادا شدہ کریں',
      paidSuccessMsg: 'بل ادا شدہ نشان زد کر دیا گیا۔',
      paidWithExpenseMsg: 'بل ادا ہو گیا اور خرچ خودکار شامل ہو گیا۔',
      unpaidSuccessMsg: 'بل دوبارہ غیر ادا شدہ کر دیا گیا۔',
      linkedExpenseBadge: 'خرچ منسلک',
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
      loadingPhotoMsg: 'تصویر لوڈ ہو رہی ہے...',
      photoMissingMsg: 'یہ تصویر آف لائن اسٹوریج میں دستیاب نہیں ہے۔',
      savingPhotoMsg: 'محفوظ ہو رہا ہے...',
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
      confirmDeletePaidBody:
        'اس ادا شدہ بل کا خرچ اخراجات کے ریکارڈ میں منسلک ہے۔ منتخب کریں کہ بل اور منسلک خرچ دونوں حذف کریں یا صرف بل حذف کر کے خرچ برقرار رکھیں۔',
      deleteBillAndExpenseBtn: 'بل اور منسلک خرچ حذف کریں',
      deleteBillOnlyBtn: 'صرف بل حذف کریں (خرچ رکھیں)',
      confirmUnpayTitle: 'بل کو غیر ادا شدہ کریں؟',
      confirmUnpayWithExpenseBody:
        'اس ادا شدہ بل کا منسلک خرچ موجود ہے۔ غیر ادا شدہ کرنے پر منسلک خرچ کے بارے میں منتخب کریں:',
      confirmUnpaySimpleBody:
        'یہ بل دوبارہ واجب الادا ہو جائے گا اور اس کی ادائیگی کا ریکارڈ ہٹا دیا جائے گا۔',
      unpayAndRemoveExpenseBtn: 'غیر ادا شدہ کریں اور خرچ ہٹائیں',
      unpayAndKeepExpenseBtn: 'غیر ادا شدہ کریں اور خرچ رکھیں',
      confirmUnpayBtn: 'غیر ادا شدہ کریں',
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
    kameti: {
      title: 'کمیٹی (BC) مینیجر',
      subtitle: 'بچت کمیٹیوں، ممبرز، ماہانہ اقساط، قرعہ اندازی اور پی ڈی ایف رپورٹس کا مکمل انتظام۔',
      newCommitteeBtn: 'نئی کمیٹی بنائیں',
      editCommitteeBtn: 'کمیٹی میں ترمیم',
      deleteCommitteeBtn: 'کمیٹی حذف کریں',
      noCommitteesTitle: 'ابھی کوئی کمیٹی (BC) موجود نہیں',
      noCommitteesBody:
        'ماہانہ قسط، ممبرز کی تعداد، وصولی کی تاریخ اور مدت درج کر کے اپنی پہلی کمیٹی شروع کریں۔',
      filterAll: 'سب',
      statuses: {
        active: 'فعال',
        completed: 'مکمل',
      },
      frequencies: {
        monthly: 'ماہانہ',
        biweekly: 'پندرہ روزہ (ہر 14 دن)',
        weekly: 'ہفتہ وار',
      },
      installmentStatuses: {
        paid: 'ادا شدہ',
        partial: 'جزوی',
        unpaid: 'باقی',
        overdue: 'تاخیر شدہ',
      },
      paymentMethods: {
        Cash: 'نقد (Cash)',
        JazzCash: 'جیز کیش',
        EasyPaisa: 'ایزی پیسہ',
        'Bank Transfer': 'بینک ٹرانسفر',
        Other: 'دیگر',
      },
      isolationHint:
        'کمیٹی کی رقم الگ محفوظ رہتی ہے اور آپ کی ذاتی آمدنی یا اخراجات کے حساب میں شامل نہیں ہوتی۔',
      tabs: {
        overview: 'ڈیش بورڈ',
        members: 'ممبرز',
        installments: 'اقساط اور وصولی',
        draws: 'پرچی / باری',
        reports: 'رپورٹس اور PDF',
      },
      metrics: {
        totalMembers: 'کل ممبرز',
        monthlyInstallment: 'فی ممبر قسط',
        expectedMonthly: 'متوقع ماہانہ وصولی',
        totalExpected: 'کل متوقع رقم',
        totalCollected: 'اب تک وصول شدہ',
        remainingCollection: 'باقی وصولی',
        paidCount: 'مکمل ادا',
        partialCount: 'جزوی ادا',
        unpaidCount: 'غیر ادا شدہ',
        overdueCount: 'تاخیر شدہ',
        currentCycle: 'موجودہ ماہ / دور',
        currentRecipient: 'موجودہ باری یافتہ',
        noRecipientYet: 'ابھی پرچی نہیں نکلی',
        progressLabel: 'وصولی کی پیشرفت',
      },
      committeeForm: {
        addTitle: 'نئی کمیٹی (BC) بنائیں',
        editTitle: 'کمیٹی کی تفصیلات میں ترمیم',
        nameLabel: 'کمیٹی کا نام',
        namePlaceholder: 'مثلاً گھر کمیٹی 2026 / آفس BC',
        monthlyAmountLabel: 'ماہانہ قسط (PKR)',
        memberCountLabel: 'ممبرز کی تعداد',
        startDateLabel: 'شروع ہونے کی تاریخ',
        durationLabel: 'مدت (مہینے)',
        frequencyLabel: 'ادائیگی کی ترتیب',
        collectionDayLabel: 'وصولی کا دن (1 تا 31)',
        collectionDayHint: 'ہر ماہ اس تاریخ تک قسط واجب الادا ہوگی۔',
        descriptionLabel: 'تفصیل / اصول (اختیاری)',
        descriptionPlaceholder: 'مثلاً ہر ماہ 5 تاریخ کو وصولی اور رات 8 بجے پرچی',
        statusLabel: 'کمیٹی کی حالت',
        autoPreviewHeading: 'متوقع مجموعی رقم کا جائزہ',
        saveBtn: 'کمیٹی بنائیں',
        updateBtn: 'تبدیلیاں محفوظ کریں',
      },
      memberForm: {
        addBtn: 'ممبر شامل کریں',
        addTitle: 'نیا ممبر شامل کریں',
        editTitle: 'ممبر کی تفصیلات میں ترمیم',
        nameLabel: 'ممبر کا نام',
        namePlaceholder: 'مثلاً سلمان طارق',
        phoneLabel: 'فون / واٹس ایپ نمبر',
        phonePlaceholder: 'مثلاً 0300-1234567',
        addressLabel: 'پتہ (اختیاری)',
        addressPlaceholder: 'مثلاً گلبرگ، لاہور',
        memberNumberLabel: 'ممبر نمبر #',
        joiningDateLabel: 'شمولیت کی تاریخ',
        turnNumberLabel: 'مقررہ باری / پرچی نمبر (اختیاری)',
        turnOptionalPlaceholder: 'بعد میں قرعہ اندازی کے لیے خالی چھوڑیں',
        emptyTitle: 'ابھی کوئی ممبر شامل نہیں',
        emptyBody:
          'اس کمیٹی کے تمام ممبرز کی ماہانہ اقساط خودکار بنانے کے لیے ممبرز شامل کریں۔',
        saveBtn: 'ممبر شامل کریں اور شیڈول بنائیں',
        updateBtn: 'ممبر اپ ڈیٹ کریں',
        removeBtn: 'ہٹائیں',
        confirmRemoveTitle: 'ممبر کو کمیٹی سے ہٹائیں؟',
        confirmRemoveSimpleBody:
          'اس ممبر کی کوئی ادائیگی یا پرچی درج نہیں۔ ہٹانے سے اس کی غیر ادا شدہ اقساط صاف ہو جائیں گی۔',
        confirmRemoveHistoryWarning:
          'حفاظتی انتباہ: اس ممبر کی ادائیگیاں یا پرچی ہسٹری موجود ہے۔ ہٹانے پر اس کا تمام ریکارڈ کمیٹی سے حذف ہو جائے گا۔',
        confirmForceRemoveBtn: 'تصدیق کریں اور ہٹائیں',
        paymentsRecordedLabel: 'درج ادائیگیاں',
        drawsRecordedLabel: 'درج پرچیاں',
      },
      installmentsUI: {
        collectPaymentBtn: 'قسط وصول کریں',
        filterByMember: 'ممبر',
        allMembersOption: 'تمام ممبرز',
        filterByStatus: 'حالت',
        cycleLabel: 'دور',
        dueLabel: 'آخری تاریخ',
        expectedLabel: 'مقررہ',
        paidLabel: 'وصول',
        remainingLabel: 'باقی',
        methodLabel: 'طریقہ',
        emptyBody: 'اس فلٹر کے مطابق کوئی قسط نہیں ملی۔',
        paymentModalTitle: 'کمیٹی کی قسط وصول کریں',
        selectMemberLabel: 'ممبر منتخب کریں',
        selectInstallmentLabel: 'قسط / مہینہ منتخب کریں',
        amountLabel: 'وصولی کی رقم (PKR)',
        fillRemainingBtn: 'مکمل باقی رقم',
        dateLabel: 'ادائیگی کی تاریخ',
        paymentMethodLabel: 'ادائیگی کا طریقہ',
        noteLabel: 'نوٹ (اختیاری)',
        notePlaceholder: 'مثلاً جیز کیش یا نقد وصول',
        savePaymentBtn: 'وصولی محفوظ کریں',
        paymentHistoryHeading: 'حالیہ وصولیوں کی ہسٹری',
        noPaymentsYet: 'ابھی تک کوئی قسط وصول نہیں کی گئی۔',
        removePaymentTitle: 'ادائیگی کا اندراج ہٹائیں؟',
        removePaymentBody:
          'یہ ادائیگی ہٹانے سے رقم دوبارہ قسط کے بقایا میں شامل ہو جائے گی۔',
      },
      drawsUI: {
        manualAssignTitle: 'دستی باری مقرر کریں',
        randomDrawTitle: 'خودکار قرعہ اندازی (پرچی)',
        randomDrawBtn: 'قرعہ اندازی چلائیں',
        manualAssignBtn: 'باری مقرر کریں',
        selectMemberLabel: 'اہل ممبر منتخب کریں',
        selectTurnLabel: 'باری / مہینہ نمبر #',
        payoutDateLabel: 'ادائیگی کی تاریخ',
        payoutAmountLabel: 'کمیٹی کی کل رقم (PKR)',
        markCompletedLabel: 'رقم کی ادائیگی مکمل نشان زد کریں',
        notesLabel: 'تفصیل / نوٹ (اختیاری)',
        notesPlaceholder: 'مثلاً نقد یا بینک ٹرانسفر کے ذریعے ادا',
        eligibleCountLabel: 'باقی اہل ممبرز',
        noEligibleMsg: 'تمام ممبرز کو باری / پرچی پہلے ہی مل چکی ہے۔',
        confirmModalTitle: 'پرچی / باری کی تصدیق کریں',
        confirmRandomTitle: 'قرعہ اندازی کا نتیجہ تیار ہے',
        confirmModalHint:
          'محفوظ کرنے سے پہلے تفصیل چیک کر لیں۔ محفوظ شدہ پرچی ریکارڈ خودکار تبدیل نہیں ہوتا۔',
        winnerLabel: 'منتخب ممبر',
        turnLabel: 'مقررہ باری',
        payoutLabel: 'کمیٹی رقم',
        redrawBtn: 'دوبارہ پرچی نکالیں',
        confirmSaveDrawBtn: 'تصدیق کریں اور محفوظ کریں',
        historyHeading: 'پرچی / قرعہ اندازی کی ہسٹری',
        noDrawsYet: 'ابھی تک کوئی پرچی محفوظ نہیں کی گئی۔',
        completedBadge: 'ادائیگی مکمل',
        scheduledBadge: 'باری طے شدہ',
        modeRandomBadge: 'قرعہ اندازی',
        modeManualBadge: 'دستی',
        markPayoutDoneBtn: 'ادائیگی مکمل کریں',
        wheelTitle: 'کمیٹی قرعہ اندازی وہیل',
        wheelSubtitle: 'وہیل پر تمام اہل ممبرز کے نام شامل ہیں۔ باری نکالنے کے لیے وہیل گھمائیں۔',
        spinWheelBtn: 'قرعہ اندازی وہیل گھمائیں',
        spinningBtn: 'وہیل گھوم رہا ہے...',
        spinAgainBtn: 'دوبارہ گھمائیں',
        wheelPointerLabel: 'موجودہ نام',
        wheelStoppedOnLabel: 'وہیل یہاں رکا',
        saveWheelWinnerBtn: 'نتیجہ تصدیق و محفوظ کریں',
        wheelHubSpin: 'گھمائیں',
      },
      reportsUI: {
        committeeReportTitle: 'کمیٹی خلاصہ اور پی ڈی ایف رپورٹ',
        committeeReportSubtitle:
          'ممبرز، ماہانہ وصولی، پرچی ہسٹری اور باقی اقساط کے ساتھ مکمل رپورٹ دیکھیں، محفوظ کریں یا شیئر کریں۔',
        previewCommitteePdfBtn: 'کمیٹی PDF رپورٹ دیکھیں اور محفوظ کریں',
        memberStatementBtn: 'اسٹیٹمنٹ / PDF',
        whatsappReminderBtn: 'واٹس ایپ',
        memberStatementModalTitle: 'ممبر کمیٹی اسٹیٹمنٹ',
        memberStatementModalSubtitle:
          'وصول شدہ اقساط، باقی بقایا، باری کی حالت اور PDF شیئرنگ چیک کریں۔',
        pdfPreviewTab: 'A4 PDF پیش نظارہ',
        detailsTab: 'اقساط اور ادائیگیاں',
        filenameLabel: 'PDF فائل کا نام',
        choosePathAndSaveBtn: 'فولڈر چنیں اور محفوظ کریں',
        downloadPdfBtn: 'PDF ڈاؤن لوڈ',
        sharePdfBtn: 'PDF شیئر کریں',
        whatsappSharePdfBtn: 'واٹس ایپ پر PDF شیئر کریں',
        whatsappShareHint:
          'یہ آپ کے فون کی شیئر شیٹ میں PDF منسلک کر کے کھولتا ہے تاکہ آپ واٹس ایپ منتخب کر کے بھیج سکیں۔',
        exportPathHint:
          'محفوظ کرنے سے پہلے آپ فون کا کوئی بھی فولڈر (Documents، Downloads، SD کارڈ) منتخب کر سکتے ہیں۔',
        generatingPdf: 'PDF تیار ہو رہی ہے...',
        exportSuccess: 'PDF تیار ہے:',
        exportSavedLocation: 'محفوظ مقام:',
        exportCancelled: 'محفوظ کرنا منسوخ کیا گیا۔',
        shareCancelled: 'شیئر کرنا منسوخ کیا گیا۔',
        exportError: 'PDF رپورٹ تیار یا شیئر کرنے میں مسئلہ پیش آیا۔',
        openPdfBtn: 'محفوظ شدہ PDF کھولیں',
        noPdfViewerFound: 'فائل محفوظ ہو گئی، لیکن PDF کھولنے والی ایپ نہیں ملی۔',
        prevPageAria: 'پچھلا صفحہ',
        nextPageAria: 'اگلا صفحہ',
        zoomFitLabel: 'چوڑائی کے مطابق',
        zoomActualLabel: '140% زوم',
        reminderTitle: 'کمیٹی واٹس ایپ ریمائنڈر',
        reminderSubtitle: 'واٹس ایپ کھولنے سے پہلے پیغام کا جائزہ لیں یا ترمیم کریں۔',
        reminderMessageLabel: 'ریمائنڈر پیغام (قابلِ ترمیم)',
        resetTemplateBtn: 'اصل عبارت بحال کریں',
        openWhatsappBtn: 'واٹس ایپ میں کھولیں',
        shareOtherAppsBtn: 'دیگر ایپس سے شیئر',
        copyBtn: 'پیغام کاپی کریں',
        copiedFeedback: 'کاپی ہو گیا!',
        phoneTargetLabel: 'موصول کنندہ نمبر',
        noPhoneSavedNote:
          'اس ممبر کا فون نمبر محفوظ نہیں — واٹس ایپ میں آپ خود چیٹ منتخب کر سکتے ہیں۔',
        confirmSendHint:
          'یہ پیغام واٹس ایپ میں کھولتا ہے تاکہ آپ خود تصدیق کر کے Send دبا سکیں۔',
        pdf: {
          memberStatementTitle: 'ممبر کمیٹی اسٹیٹمنٹ',
          committeeReportTitle: 'کمیٹی (BC) مکمل رپورٹ',
          subtitle: 'EasyDay کمیٹی (BC) مینجمنٹ سسٹم',
          committeeLabel: 'کمیٹی',
          memberLabel: 'ممبر',
          phoneLabel: 'فون',
          turnStatusLabel: 'باری / پرچی',
          generatedLabel: 'تیار کردہ تاریخ',
          statusLabel: 'حالت',
          frequencyLabel: 'ترتیب',
          collectionDayLabel: 'وصولی کا دن',
          startDateLabel: 'شروع کی تاریخ',
          durationLabel: 'مدت',
          expectedMonthlyLabel: 'متوقع ماہانہ وصولی',
          expectedTotalLabel: 'متوقع کل رقم',
          collectedLabel: 'کل وصول شدہ',
          remainingLabel: 'باقی وصولی',
          memberExpectedLabel: 'مقررہ کل اقساط',
          memberPaidLabel: 'اب تک ادا شدہ',
          memberOutstandingLabel: 'باقی واجب الادا',
          installmentsHeading: 'اقساط کا شیڈول',
          paymentHistoryHeading: 'ادائیگیوں کی مکمل ہسٹری',
          membersHeading: 'ممبرز کا خلاصہ',
          monthlySummaryHeading: 'ماہانہ / دور وار وصولی کا خلاصہ',
          drawsHeading: 'پرچی / قرعہ اندازی کی ہسٹری',
          outstandingHeading: 'باقی اور تاخیر شدہ اقساط',
          cycleCol: 'دور',
          dueDateCol: 'آخری تاریخ',
          expectedCol: 'مقررہ',
          paidCol: 'وصول',
          remainingCol: 'باقی',
          statusCol: 'حالت',
          dateCol: 'ادائیگی تاریخ',
          methodCol: 'طریقہ',
          amountCol: 'رقم',
          noteCol: 'نوٹ',
          memberCol: 'ممبر',
          turnCol: 'باری',
          winnerCol: 'باری یافتہ',
          payoutCol: 'ادائیگی رقم',
          noRowsMsg: 'اس حصے میں ابھی کوئی ریکارڈ موجود نہیں۔',
          footerLeft: 'EasyDay · کمیٹی (BC) مالیاتی رپورٹ',
          pageLabel: 'صفحہ',
          ofLabel: 'از',
        },
      },
      confirmDeleteCommitteeTitle: 'کمیٹی حذف کریں؟',
      confirmDeleteCommitteeBody:
        'اس کمیٹی کو حذف کرنے سے اس کے تمام ممبرز، اقساط، وصولیاں اور پرچی ریکارڈ مستقل طور پر ختم ہو جائیں گے۔',
      cancelBtn: 'منسوخ کریں',
      deleteBtn: 'حذف کریں',
      closeBtn: 'بند کریں',
      errors: {
        INVALID_COMMITTEE_NAME: 'براہ کرم کمیٹی کا درست نام درج کریں۔',
        INVALID_INSTALLMENT_AMOUNT: 'ماہانہ قسط صفر سے زیادہ ہونی چاہیے۔',
        INVALID_MEMBER_COUNT:
          'ممبرز کی تعداد کم از کم 2 اور موجودہ شامل ممبرز سے کم نہیں ہونی چاہیے۔',
        INVALID_DURATION: 'مدت کم از کم 1 مہینہ ہونی چاہیے۔',
        INVALID_COLLECTION_DAY: 'وصولی کا دن 1 سے 31 کے درمیان ہونا چاہیے۔',
        INVALID_DATE: 'براہ کرم درست تاریخ منتخب کریں۔',
        COMMITTEE_NOT_FOUND: 'منتخب کمیٹی نہیں ملی۔',
        COMMITTEE_FULL:
          'اس کمیٹی میں ممبرز کی مقررہ تعداد مکمل ہو چکی ہے۔ مزید شامل کرنے کے لیے کمیٹی میں ترمیم کر کے تعداد بڑھائیں۔',
        INVALID_MEMBER_NAME: 'براہ کرم ممبر کا نام درج کریں۔',
        INVALID_MEMBER_NUMBER: 'ممبر نمبر مثبت مکمل عدد ہونا چاہیے۔',
        INVALID_TURN_NUMBER: 'باری / پرچی نمبر مثبت مکمل عدد ہونا چاہیے۔',
        DUPLICATE_MEMBER_NUMBER: 'یہ ممبر نمبر اس کمیٹی میں پہلے سے موجود ہے۔',
        DUPLICATE_MEMBER_PHONE: 'اس فون نمبر کا ممبر اس کمیٹی میں پہلے سے موجود ہے۔',
        DUPLICATE_MEMBER_NAME: 'اس نام کا ممبر اس کمیٹی میں پہلے سے موجود ہے۔',
        DUPLICATE_TURN_NUMBER: 'یہ باری نمبر اس کمیٹی میں پہلے سے تفویض ہے۔',
        MEMBER_NOT_FOUND: 'یہ ممبر کمیٹی میں موجود نہیں ہے۔',
        MEMBER_HAS_HISTORY:
          'اس ممبر کی ادائیگیاں یا پرچی ہسٹری موجود ہے۔ ہٹانے کے لیے واضح تصدیق درکار ہے۔',
        INSTALLMENT_NOT_FOUND: 'منتخب قسط نہیں ملی۔',
        INVALID_PAYMENT_AMOUNT: 'براہ کرم صفر سے بڑی درست رقم درج کریں۔',
        PAYMENT_EXCEEDS_REMAINING: 'وصولی کی رقم قسط کے باقی بقایا سے زیادہ نہیں ہو سکتی۔',
        DUPLICATE_PAYMENT_SUBMISSION:
          'دوہرا اندراج روک دیا گیا۔ یہی ادائیگی ابھی درج کی جا چکی ہے۔',
        PAYMENT_NOT_FOUND: 'ادائیگی کا ریکارڈ نہیں ملا۔',
        DRAW_MEMBER_ALREADY_ASSIGNED:
          'اس ممبر کو اس کمیٹی میں پہلے ہی باری / پرچی مل چکی ہے۔',
        DRAW_TURN_ALREADY_TAKEN: 'یہ باری نمبر اس کمیٹی میں پہلے سے تفویض ہے۔',
        NO_ELIGIBLE_MEMBERS: 'قرعہ اندازی کے لیے کوئی باقی اہل ممبر موجود نہیں۔',
        INVALID_PAYOUT_AMOUNT: 'ادائیگی کی رقم صفر سے زیادہ ہونی چاہیے۔',
        DRAW_NOT_FOUND: 'پرچی کا ریکارڈ نہیں ملا۔',
      },
    },
  },
};
