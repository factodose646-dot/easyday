import { Language } from '../types';

export interface AdminTranslationBundle {
  portalTitle: string;
  portalSubtitle: string;
  backToApp: string;
  signOut: string;
  refresh: string;
  signedInAs: string;
  verifyingAccess: string;
  login: {
    badge: string;
    heading: string;
    subheading: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    submitBtn: string;
    signingInBtn: string;
    securityNote: string;
    missingEmail: string;
    missingPassword: string;
    invalidEmail: string;
  };
  unauthorized: {
    heading: string;
    body: string;
    uidLabel: string;
    copyUidBtn: string;
    copiedUidBtn: string;
    ruleHint: string;
    switchAccountBtn: string;
  };
  tabs: {
    overview: string;
    globalAds: string;
    announcement: string;
  };
  overview: {
    heading: string;
    subheading: string;
    totalAds: string;
    liveAds: string;
    imageAds: string;
    videoAds: string;
    draftOrInactiveAds: string;
    announcementStatus: string;
    liveSuffix: string;
    publishedLabel: string;
    inactiveLabel: string;
    notConfiguredLabel: string;
    quickActionsTitle: string;
    manageGlobalAds: string;
    manageAnnouncement: string;
    securityChecklistTitle: string;
    securityChecklistBody: string;
  };
  ads: {
    sectionTitle: string;
    sectionSubtitle: string;
    addAdBtn: string;
    editAdTitle: string;
    emptyAds: string;
    mediaTypeImage: string;
    mediaTypeVideo: string;
    statusActive: string;
    statusInactive: string;
    statusPublished: string;
    statusUnpublished: string;
    statusLiveOnApp: string;
    activateBtn: string;
    deactivateBtn: string;
    publishBtn: string;
    unpublishBtn: string;
    editBtn: string;
    deleteBtn: string;
    createdLabel: string;
    updatedLabel: string;
    fields: {
      title: string;
      titlePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      mediaType: string;
      mediaUrl: string;
      mediaUrlPlaceholderImage: string;
      mediaUrlPlaceholderVideo: string;
      activeLabel: string;
      activeHint: string;
      publishedLabel: string;
      publishedHint: string;
    };
    savePublishBtn: string;
    saveBtn: string;
    savingBtn: string;
    cancelBtn: string;
    confirmDeleteTitle: string;
    confirmDeleteBody: string;
    confirmDeleteBtn: string;
    deletingBtn: string;
  };
  announcement: {
    heading: string;
    subheading: string;
    titleLabel: string;
    titlePlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    activeLabel: string;
    activeHint: string;
    savePublishBtn: string;
    deactivateBtn: string;
    previewLabel: string;
    statusLive: string;
    statusHidden: string;
  };
  feedback: {
    savedSuccess: string;
    deletedSuccess: string;
    statusUpdated: string;
    announcementUpdated: string;
    offlineWarning: string;
  };
}

export const ADMIN_TRANSLATIONS: Record<Language, AdminTranslationBundle> = {
  en: {
    portalTitle: 'ZAIDI STORE Admin',
    portalSubtitle: 'EasyDay Global Ads & Announcement Console',
    backToApp: 'Back to EasyDay',
    signOut: 'Sign Out',
    refresh: 'Refresh',
    signedInAs: 'Signed in as',
    verifyingAccess: 'Verifying administrator authorization...',
    login: {
      badge: 'Protected Admin Console',
      heading: 'Administrator Sign In',
      subheading:
        'Sign in with an authorized Firebase administrator account for project easyday-13712.',
      emailLabel: 'Admin Email',
      emailPlaceholder: 'admin@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitBtn: 'Sign In to Admin Panel',
      signingInBtn: 'Signing in...',
      securityNote:
        'Access is restricted by a trusted UID allowlist in Firestore and enforced by Firestore Security Rules.',
      missingEmail: 'Please enter an email address.',
      missingPassword: 'Please enter your password.',
      invalidEmail: 'Please enter a valid email address.',
    },
    unauthorized: {
      heading: 'Administrator Authorization Required',
      body: 'Your account signed in with Firebase Authentication, but this UID is not in the authorized admins allowlist.',
      uidLabel: 'Authenticated UID',
      copyUidBtn: 'Copy UID',
      copiedUidBtn: 'Copied',
      ruleHint:
        'To authorize this account, create document admins/{uid} in Firebase Console with active: true and publish the admin Firestore Security Rules.',
      switchAccountBtn: 'Sign Out & Switch Account',
    },
    tabs: {
      overview: 'Dashboard',
      globalAds: 'Global Ads',
      announcement: 'Announcement',
    },
    overview: {
      heading: 'Admin Dashboard',
      subheading:
        'Manage global in-app advertisements (`globalAds`) and live app announcements (`settings/announcement`).',
      totalAds: 'Total Global Ads',
      liveAds: 'Live Eligible Ads',
      imageAds: 'Image Ads',
      videoAds: 'Video Ads',
      draftOrInactiveAds: 'Inactive / Unpublished',
      announcementStatus: 'Announcement Status',
      liveSuffix: 'live on EasyDay',
      publishedLabel: 'Published',
      inactiveLabel: 'Inactive',
      notConfiguredLabel: 'Not Published',
      quickActionsTitle: 'Management Sections',
      manageGlobalAds: 'Open Global Ads Manager',
      manageAnnouncement: 'Manage App Announcement',
      securityChecklistTitle: 'Active Security Enforcement',
      securityChecklistBody:
        'Only authenticated admins in admins/{uid} can manage globalAds and announcements. Public app users only read active and published ads via validated HTTPS URLs.',
    },
    ads: {
      sectionTitle: 'Global Ads Manager',
      sectionSubtitle:
        'Create and manage full-screen and occasional in-app image or video advertisements.',
      addAdBtn: 'Create Advertisement',
      editAdTitle: 'Edit Advertisement',
      emptyAds:
        'No advertisements created yet. Tap Create Advertisement to publish your first in-app ad.',
      mediaTypeImage: 'Image',
      mediaTypeVideo: 'Video',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusPublished: 'Published',
      statusUnpublished: 'Unpublished',
      statusLiveOnApp: 'Eligible on App',
      activateBtn: 'Activate',
      deactivateBtn: 'Deactivate',
      publishBtn: 'Publish',
      unpublishBtn: 'Unpublish',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      createdLabel: 'Created',
      updatedLabel: 'Updated',
      fields: {
        title: 'Advertisement Title',
        titlePlaceholder: 'e.g. Special Summer Announcement',
        description: 'Advertisement Description',
        descriptionPlaceholder:
          'Concise message displayed with your advertisement media...',
        mediaType: 'Media Type',
        mediaUrl: 'HTTPS Media URL',
        mediaUrlPlaceholderImage: 'https://example.com/ad-banner.png',
        mediaUrlPlaceholderVideo: 'https://example.com/ad-clip.mp4',
        activeLabel: 'Active',
        activeHint: 'Must be active to allow serving on EasyDay.',
        publishedLabel: 'Published',
        publishedHint: 'Only active and published ads appear to EasyDay users.',
      },
      savePublishBtn: 'Save & Publish Ad',
      saveBtn: 'Save Advertisement',
      savingBtn: 'Saving...',
      cancelBtn: 'Cancel',
      confirmDeleteTitle: 'Confirm Advertisement Deletion',
      confirmDeleteBody:
        'This advertisement will be permanently deleted from Firestore globalAds. This action cannot be undone.',
      confirmDeleteBtn: 'Delete Permanently',
      deletingBtn: 'Deleting...',
    },
    announcement: {
      heading: 'App Announcement',
      subheading:
        'Updates settings/announcement displayed on the EasyDay Home screen.',
      titleLabel: 'Announcement Title',
      titlePlaceholder: 'e.g. EasyDay Workspace Update',
      messageLabel: 'Announcement Message',
      messagePlaceholder: 'Write a clear announcement for EasyDay users...',
      activeLabel: 'Published (Active)',
      activeHint: 'When enabled, this announcement appears on the EasyDay Home screen.',
      savePublishBtn: 'Save & Update Announcement',
      deactivateBtn: 'Deactivate Announcement',
      previewLabel: 'Home Screen Preview',
      statusLive: 'Live on EasyDay',
      statusHidden: 'Hidden (Inactive)',
    },
    feedback: {
      savedSuccess: 'Saved successfully to Firestore.',
      deletedSuccess: 'Advertisement deleted successfully.',
      statusUpdated: 'Advertisement status updated.',
      announcementUpdated: 'Announcement updated.',
      offlineWarning: 'You appear to be offline. Connect to save changes.',
    },
  },
  ur: {
    portalTitle: 'ZAIDI STORE ایڈمن',
    portalSubtitle: 'EasyDay گلوبل اشتہارات اور اعلانات کنسول',
    backToApp: 'EasyDay پر واپس جائیں',
    signOut: 'سائن آؤٹ',
    refresh: 'ریفریش',
    signedInAs: 'لاگ ان اکاؤنٹ',
    verifyingAccess: 'ایڈمنسٹریٹر کی اجازت کی تصدیق ہو رہی ہے...',
    login: {
      badge: 'محفوظ ایڈمن کنسول',
      heading: 'ایڈمنسٹریٹر سائن ان',
      subheading:
        'پروجیکٹ easyday-13712 کے مجاز Firebase ایڈمن اکاؤنٹ سے لاگ ان کریں۔',
      emailLabel: 'ایڈمن ای میل',
      emailPlaceholder: 'admin@example.com',
      passwordLabel: 'پاس ورڈ',
      passwordPlaceholder: 'اپنا پاس ورڈ درج کریں',
      showPassword: 'پاس ورڈ دکھائیں',
      hidePassword: 'پاس ورڈ چھپائیں',
      submitBtn: 'ایڈمن پینل میں سائن ان کریں',
      signingInBtn: 'سائن ان ہو رہا ہے...',
      securityNote:
        'رسائی Firestore میں موجود مستند UID لسٹ اور سیکیورٹی رولز کے ذریعے محفوظ ہے۔',
      missingEmail: 'براہ کرم ای میل پتہ درج کریں۔',
      missingPassword: 'براہ کرم اپنا پاس ورڈ درج کریں۔',
      invalidEmail: 'براہ کرم درست ای میل پتہ درج کریں۔',
    },
    unauthorized: {
      heading: 'ایڈمنسٹریٹر کی اجازت درکار ہے',
      body: 'آپ کا اکاؤنٹ Firebase Authentication میں لاگ ان ہے، لیکن یہ UID مجاز ایڈمن لسٹ میں شامل نہیں ہے۔',
      uidLabel: 'موجودہ UID',
      copyUidBtn: 'UID کاپی کریں',
      copiedUidBtn: 'کاپی ہو گیا',
      ruleHint:
        'اجازت دینے کے لیے Firebase Console میں admins/{uid} دستاویز active: true کے ساتھ بنائیں اور ایڈمن سیکیورٹی رولز شائع کریں۔',
      switchAccountBtn: 'سائن آؤٹ کریں اور دوسرا اکاؤنٹ استعمال کریں',
    },
    tabs: {
      overview: 'ڈیش بورڈ',
      globalAds: 'گلوبل اشتہارات',
      announcement: 'اعلان',
    },
    overview: {
      heading: 'ایڈمن ڈیش بورڈ',
      subheading:
        'ایپ کے گلوبل اشتہارات (globalAds) اور اعلانات (settings/announcement) منظم کریں۔',
      totalAds: 'کل اشتہارات',
      liveAds: 'ایپ پر فعال اشتہارات',
      imageAds: 'تصویری اشتہارات',
      videoAds: 'ویڈیو اشتہارات',
      draftOrInactiveAds: 'غیر فعال / غیر شائع شدہ',
      announcementStatus: 'اعلان کی حیثیت',
      liveSuffix: 'EasyDay پر لائیو',
      publishedLabel: 'شائع شدہ',
      inactiveLabel: 'غیر فعال',
      notConfiguredLabel: 'شائع نہیں',
      quickActionsTitle: 'انتظامی حصے',
      manageGlobalAds: 'گلوبل اشتہارات مینیجر کھولیں',
      manageAnnouncement: 'ایپ کا اعلان منظم کریں',
      securityChecklistTitle: 'فعال سیکیورٹی تحفظ',
      securityChecklistBody:
        'صرف admins/{uid} میں موجود مستند ایڈمنز ہی اشتہارات شائع کر سکتے ہیں۔ عام صارفین صرف فعال اور شائع شدہ اشتہارات ہی دیکھ سکتے ہیں۔',
    },
    ads: {
      sectionTitle: 'گلوبل اشتہارات مینیجر',
      sectionSubtitle:
        'فل اسکرین اور وقفے وقفے سے دکھائی دینے والے تصویری اور ویڈیو اشتہارات بنائیں اور منظم کریں۔',
      addAdBtn: 'نیا اشتہار بنائیں',
      editAdTitle: 'اشتہار میں ترمیم کریں',
      emptyAds:
        'ابھی کوئی اشتہار موجود نہیں ہے۔ پہلا اشتہار شائع کرنے کے لیے اوپر بٹن دبائیں۔',
      mediaTypeImage: 'تصویر (Image)',
      mediaTypeVideo: 'ویڈیو (Video)',
      statusActive: 'فعال',
      statusInactive: 'غیر فعال',
      statusPublished: 'شائع شدہ',
      statusUnpublished: 'غیر شائع شدہ',
      statusLiveOnApp: 'ایپ پر لائیو',
      activateBtn: 'فعال کریں',
      deactivateBtn: 'غیر فعال کریں',
      publishBtn: 'شائع کریں',
      unpublishBtn: 'اشاعت بند کریں',
      editBtn: 'ترمیم',
      deleteBtn: 'حذف کریں',
      createdLabel: 'تخلیق',
      updatedLabel: 'اپ ڈیٹ',
      fields: {
        title: 'اشتہار کا عنوان',
        titlePlaceholder: 'مثلاً خصوصی موسم گرما پیغام',
        description: 'اشتہار کی تفصیل',
        descriptionPlaceholder:
          'اشتہار کے ساتھ دکھانے کے لیے واضح مختصر تفصیل لکھیں...',
        mediaType: 'میڈیا کی قسم',
        mediaUrl: 'HTTPS میڈیا لنک',
        mediaUrlPlaceholderImage: 'https://example.com/ad-banner.png',
        mediaUrlPlaceholderVideo: 'https://example.com/ad-clip.mp4',
        activeLabel: 'فعال (Active)',
        activeHint: 'ایپ پر دکھانے کے لیے اشتہار کا فعال ہونا ضروری ہے۔',
        publishedLabel: 'شائع شدہ (Published)',
        publishedHint: 'صرف فعال اور شائع شدہ اشتہارات ہی صارفین کو نظر آتے ہیں۔',
      },
      savePublishBtn: 'محفوظ اور شائع کریں',
      saveBtn: 'اشتہار محفوظ کریں',
      savingBtn: 'محفوظ ہو رہا ہے...',
      cancelBtn: 'منسوخ کریں',
      confirmDeleteTitle: 'اشتہار حذف کرنے کی تصدیق',
      confirmDeleteBody:
        'یہ اشتہار Firestore سے مستقل طور پر حذف ہو جائے گا۔ اسے واپس نہیں لایا جا سکے گا۔',
      confirmDeleteBtn: 'مستقل حذف کریں',
      deletingBtn: 'حذف ہو رہا ہے...',
    },
    announcement: {
      heading: 'ایپ کا اعلان',
      subheading:
        'یہ settings/announcement کو اپ ڈیٹ کرتا ہے جو EasyDay ہوم اسکرین پر دکھائی دیتا ہے۔',
      titleLabel: 'اعلان کا عنوان',
      titlePlaceholder: 'مثلاً EasyDay نئی اپ ڈیٹ دستیاب ہے',
      messageLabel: 'اعلان کا پیغام',
      messagePlaceholder: 'EasyDay صارفین کے لیے اہم پیغام تحریر کریں...',
      activeLabel: 'شائع شدہ (فعال)',
      activeHint: 'فعال ہونے پر یہ اعلان EasyDay ہوم اسکرین پر دکھائی دے گا۔',
      savePublishBtn: 'اعلان محفوظ اور اپ ڈیٹ کریں',
      deactivateBtn: 'اعلان غیر فعال کریں',
      previewLabel: 'ہوم اسکرین پیش نظارہ',
      statusLive: 'EasyDay پر لائیو',
      statusHidden: 'پوشیدہ (غیر فعال)',
    },
    feedback: {
      savedSuccess: 'Firestore میں کامیابی سے محفوظ ہو گیا۔',
      deletedSuccess: 'اشتہار کامیابی سے حذف کر دیا گیا۔',
      statusUpdated: 'اشتہار کا اسٹیٹس اپ ڈیٹ ہو گیا۔',
      announcementUpdated: 'اعلان اپ ڈیٹ ہو گیا۔',
      offlineWarning: 'آپ آف لائن ہیں۔ تبدیلیاں محفوظ کرنے کے لیے انٹرنیٹ سے منسلک ہوں۔',
    },
  },
};
