import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { adminBrandMeta, adminTheme } from "./theme.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");

const appPublicDirectory = path.join(workspaceRoot, "App", "public");
const logoRelativeFile = path.join("img", "adminlogo.png");
const logoSourceFile = path.join(appPublicDirectory, logoRelativeFile);
const publicMountPath = "/admin/brand-assets";
const fallbackLogoUrl = "/admin/brand-logo.svg";
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
  faviconUrl: "/admin/favicon.svg",
  themeStylesheetUrl: "/admin/admin-theme.css",
};

const adminBranding = {
  companyName: adminBrandMeta.companyName,
  logo: adminBrandAssets.logoUrl,
  favicon: adminBrandAssets.faviconUrl,
  withMadeWithLove: false,
  theme: adminTheme,
};

const adminAssets = {
  styles: [adminBrandAssets.themeStylesheetUrl],
};

export { adminAssets, adminBrandAssets, adminBranding };
