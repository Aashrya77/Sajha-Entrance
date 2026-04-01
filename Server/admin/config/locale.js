import { createRequire } from "module";

const require = createRequire(import.meta.url);
const adminJsEnTranslations = require("../../node_modules/adminjs/lib/locale/en/translation.json");

const adminNavigationLabels = Object.freeze({
  Administration: "Administration",
  Content: "Content",
  Students: "Students",
  Classes: "Classes",
  Payments: "Payments",
  "Exam Results": "Exam Results",
  "Book Orders": "Book Orders",
  Inquiries: "Inquiries",
});

const adminResourceLabels = Object.freeze({
  AdminUser: "Admin Users",
  AdminActivity: "Admin Activity",
  AdminNotification: "Notifications",
  Blog: "Blogs",
  Notice: "Notices",
  Advertisement: "Advertisements",
  College: "Colleges",
  UniversityFile: "Universities",
  LandingAd: "Landing Ads",
  MockTestFile: "Mock Tests",
  MockTestAttempt: "Mock Test Attempts",
  Course: "Courses",
  Newsletter: "Newsletter Subscribers",
  Contact: "Contact Messages",
  Popup: "Popups",
  Student: "Students",
  OnlineClass: "Online Classes",
  RecordedClass: "Recorded Classes",
  StudentResult: "Student Results",
  Payment: "Payments",
  BookOrder: "Book Orders",
  Inquiry: "Inquiries",
});

const enAdminTranslations = {
  ...adminJsEnTranslations,
  components: {
    ...(adminJsEnTranslations.components || {}),
    Login: {
      ...((adminJsEnTranslations.components || {}).Login || {}),
      welcomeHeader: "Welcome back",
      welcomeMessage: "Use your admin credentials to continue to the Sajha Entrance dashboard.",
      properties: {
        ...((((adminJsEnTranslations.components || {}).Login || {}).properties) || {}),
        email: "Work email",
        password: "Password",
      },
      loginButton: "Continue to dashboard",
    },
  },
  labels: {
    ...(adminJsEnTranslations.labels || {}),
    ...adminNavigationLabels,
    ...adminResourceLabels,
  },
  resources: {
    ...(adminJsEnTranslations.resources || {}),
    AdminNotification: {
      actions: {
        markAsRead: "Mark as read",
      },
    },
  },
};

const adminLocale = {
  language: "en",
  availableLanguages: ["en"],
  localeDetection: false,
  withBackend: false,
  partialBundledLanguages: false,
  resources: {
    en: {
      translation: enAdminTranslations,
    },
  },
  translations: {
    en: enAdminTranslations,
  },
};

export { adminLocale, adminResourceLabels, enAdminTranslations };
