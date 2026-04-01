export const adminBrandMeta = {
  companyName: "Sajha Entrance",
  consoleLabel: "Admin Console",
  consoleName: "Sajha Entrance Admin Console",
  consoleSubtitle: "Admissions, growth, and operations workspace",
  logoAlt: "Sajha Entrance admin logo",
};

export const adminPalette = {
  brand: "#FF7422",
  brandStrong: "#D95A12",
  brandSoft: "#FFF1E8",
  brandMuted: "#FFD7BF",
  neutral950: "#0F172A",
  neutral900: "#172033",
  neutral800: "#334155",
  neutral700: "#475569",
  neutral600: "#64748B",
  neutral500: "#94A3B8",
  neutral400: "#CBD5E1",
  neutral300: "#E2E8F0",
  neutral200: "#EEF2F7",
  neutral100: "#F8FAFC",
  white: "#FFFFFF",
  canvas: "#F5F7FB",
  info: "#0F4C81",
  infoStrong: "#0B3A63",
  infoSoft: "#E5F0FA",
  success: "#16A34A",
  successStrong: "#15803D",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningStrong: "#B45309",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerStrong: "#B91C1C",
  dangerSoft: "#FEE2E2",
};

export const adminStatusTones = {
  brand: {
    bg: adminPalette.brandSoft,
    fg: adminPalette.brandStrong,
    border: "rgba(255, 116, 34, 0.16)",
  },
  success: {
    bg: adminPalette.successSoft,
    fg: adminPalette.successStrong,
    border: "rgba(22, 163, 74, 0.16)",
  },
  warning: {
    bg: adminPalette.warningSoft,
    fg: adminPalette.warningStrong,
    border: "rgba(217, 119, 6, 0.16)",
  },
  danger: {
    bg: adminPalette.dangerSoft,
    fg: adminPalette.dangerStrong,
    border: "rgba(220, 38, 38, 0.16)",
  },
  info: {
    bg: adminPalette.infoSoft,
    fg: adminPalette.infoStrong,
    border: "rgba(15, 76, 129, 0.16)",
  },
  neutral: {
    bg: adminPalette.neutral100,
    fg: adminPalette.neutral800,
    border: "rgba(148, 163, 184, 0.16)",
  },
};

export const adminShadows = {
  card: "0 18px 44px rgba(15, 23, 42, 0.06)",
  cardHover: "0 22px 52px rgba(15, 23, 42, 0.10)",
  hero: "0 26px 70px rgba(15, 23, 42, 0.10)",
  login: "0 28px 64px rgba(15, 23, 42, 0.16)",
  drawer: "-8px 0 28px rgba(15, 23, 42, 0.12)",
  focus: "0 0 0 4px rgba(255, 116, 34, 0.14)",
  successFocus: "0 0 0 4px rgba(22, 163, 74, 0.14)",
};

export const adminRadii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const adminTheme = {
  font: "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  colors: {
    primary100: adminPalette.brand,
    primary80: "#FF8E4E",
    primary60: "#FFAA7A",
    primary40: "#FFD5BD",
    primary20: "#FFF1E8",
    accent: adminPalette.brand,
    text: adminPalette.neutral950,
    grey100: adminPalette.neutral950,
    grey80: adminPalette.neutral800,
    grey60: adminPalette.neutral600,
    grey40: adminPalette.neutral400,
    grey20: adminPalette.neutral200,
    border: adminPalette.neutral300,
    separator: adminPalette.neutral300,
    bg: adminPalette.canvas,
    sidebar: adminPalette.white,
    container: adminPalette.white,
    filterBg: adminPalette.white,
    success: adminPalette.success,
    successDark: adminPalette.successStrong,
    successLight: adminPalette.successSoft,
    warning: adminPalette.warning,
    warningDark: adminPalette.warningStrong,
    warningLight: adminPalette.warningSoft,
    error: adminPalette.danger,
    errorDark: adminPalette.dangerStrong,
    errorLight: adminPalette.dangerSoft,
    info: adminPalette.info,
    infoDark: adminPalette.infoStrong,
    infoLight: adminPalette.infoSoft,
    love: adminPalette.brand,
    inputBorder: adminPalette.neutral400,
    highlight: adminPalette.brandSoft,
  },
  fontSizes: {
    default: "14px",
    lg: "16px",
    xl: "18px",
    h4: "24px",
    h3: "30px",
    h2: "36px",
    h1: "44px",
  },
  lineHeights: {
    default: "20px",
    lg: "26px",
    xl: "34px",
    xxl: "42px",
  },
  fontWeights: {
    normal: 400,
    bold: 700,
    bolder: 800,
    lighter: 500,
  },
  sizes: {
    sidebarWidth: "308px",
    navbarHeight: "78px",
  },
  space: {
    lg: "18px",
    xl: "26px",
    xxl: "36px",
    x3: "52px",
  },
  shadows: {
    card: adminShadows.card,
    cardHover: adminShadows.cardHover,
    login: adminShadows.login,
    drawer: adminShadows.drawer,
    inputFocus: adminShadows.focus,
    buttonFocus: adminShadows.focus,
  },
  borderWidths: {
    default: "1px",
  },
};

export const dashboardTheme = {
  brand: adminPalette.brand,
  brandStrong: adminPalette.brandStrong,
  brandSoft: adminPalette.brandSoft,
  canvas: adminPalette.canvas,
  white: adminPalette.white,
  ink: adminPalette.neutral950,
  inkSoft: adminPalette.neutral800,
  muted: adminPalette.neutral600,
  mutedSoft: adminPalette.neutral500,
  border: adminPalette.neutral300,
  borderSoft: adminPalette.neutral200,
  info: adminPalette.info,
  infoSoft: adminPalette.infoSoft,
  success: adminPalette.success,
  successSoft: adminPalette.successSoft,
  warning: adminPalette.warning,
  warningSoft: adminPalette.warningSoft,
  danger: adminPalette.danger,
  dangerSoft: adminPalette.dangerSoft,
  radius: adminRadii,
  shadow: adminShadows,
  fontFamily: adminTheme.font,
};

export const paymentStatusToneMap = {
  completed: "success",
  pending: "warning",
  failed: "danger",
  refunded: "brand",
  canceled: "neutral",
};

export const notificationToneMap = {
  success: "success",
  warning: "warning",
  error: "danger",
  info: "info",
};

export const metricToneMap = {
  students: "brand",
  revenue: "success",
  courses: "info",
  admin: "neutral",
};

export const getToneStyles = (tone = "brand") =>
  adminStatusTones[tone] || adminStatusTones.brand;

export const getDeltaTone = (value = 0) =>
  value >= 0 ? "success" : "danger";

export const getRevenuePalette = (value = 0) =>
  value >= 0
    ? {
        tone: "success",
        line: adminPalette.success,
        fill: "rgba(22, 163, 74, 0.14)",
        glow: "rgba(22, 163, 74, 0.22)",
      }
    : {
        tone: "danger",
        line: adminPalette.danger,
        fill: "rgba(220, 38, 38, 0.14)",
        glow: "rgba(220, 38, 38, 0.20)",
      };

export const getPaymentTone = (status = "") =>
  paymentStatusToneMap[`${status}`.toLowerCase()] || "neutral";

export const getNotificationTone = (type = "") =>
  notificationToneMap[`${type}`.toLowerCase()] || "info";
