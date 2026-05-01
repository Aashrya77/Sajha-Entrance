import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildAdminPath } from "./paths.js";
import { adminBrandMeta, adminTheme } from "./theme.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");

const appPublicDirectory = path.join(workspaceRoot, "App", "public");
const logoRelativeFile = path.join("img", "adminlogo.png");
const logoSourceFile = path.join(appPublicDirectory, logoRelativeFile);
const publicMountPath = buildAdminPath("/brand-assets");
const fallbackLogoUrl = buildAdminPath("/brand-logo.svg");
const resolvedLogoUrl = fs.existsSync(logoSourceFile)
  ? `${publicMountPath}/${logoRelativeFile.replace(/\\/g, "/")}`
  : fallbackLogoUrl;

const adminBrandAssets = {
  appPublicDirectory,
  publicMountPath,
  logoRelativeFile,
  logoSourceFile,
  logoUrl: resolvedLogoUrl,
  fallbackLogoUrl,
  faviconUrl: buildAdminPath("/favicon.svg"),
  themeStylesheetUrl: buildAdminPath("/admin-theme.css"),
  dashboardStylesheetUrl: buildAdminPath("/Dashboard.css"),
};

const adminBranding = {
  companyName: adminBrandMeta.companyName,
  logo: adminBrandAssets.logoUrl,
  favicon: adminBrandAssets.faviconUrl,
  withMadeWithLove: false,
  theme: adminTheme,
};

const adminAssets = {
  styles: [
    adminBrandAssets.themeStylesheetUrl,
    adminBrandAssets.dashboardStylesheetUrl,
  ],
};

export { adminAssets, adminBrandAssets, adminBranding };
