import React from "react";
import { Box, Text } from "@adminjs/design-system";
import { ViewHelpers } from "adminjs";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { adminBrandMeta, dashboardTheme, getToneStyles } from "../config/theme.js";

const h = new ViewHelpers();

export default function SidebarBranding() {
  const branding = useSelector((state) => state.branding);
  const brandTone = getToneStyles("brand");
  const hasLogo = Boolean(branding?.logo);

  return (
    <Link
      to={h.dashboardUrl()}
      data-css="sidebar-logo"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        padding: "24px 22px 18px",
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
          padding: "16px 16px",
          borderRadius: dashboardTheme.radius.xl,
          border: `1px solid ${dashboardTheme.borderSoft}`,
          background:
            "radial-gradient(circle at top right, rgba(255, 116, 34, 0.12), transparent 38%), rgba(255,255,255,0.92)",
          boxShadow: dashboardTheme.shadow.card,
        }}
      >
        {hasLogo ? (
          <Box
            style={{
              width: "100%",
              minHeight: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "6px 2px 2px",
            }}
          >
            <img
              src={branding.logo}
              alt={adminBrandMeta.logoAlt}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/admin/brand-logo.svg";
              }}
              style={{
                width: "auto",
                maxWidth: "100%",
                height: "auto",
                maxHeight: 56,
                objectFit: "contain",
                objectPosition: "left center",
                display: "block",
                flexShrink: 0,
              }}
            />
          </Box>
        ) : (
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(135deg, ${dashboardTheme.brand} 0%, ${dashboardTheme.brandStrong} 100%)`,
              color: dashboardTheme.white,
              fontSize: 18,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            S
          </Box>
        )}

        <Box style={{ minWidth: 0, width: "100%" }}>
          <Box
            style={{
              color: dashboardTheme.ink,
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.2,
              whiteSpace: hasLogo ? "normal" : "nowrap",
              overflow: "hidden",
              textOverflow: hasLogo ? "clip" : "ellipsis",
            }}
          >
            {branding?.companyName || adminBrandMeta.companyName}
          </Box>
          <Text
            style={{
              marginTop: 5,
              color: dashboardTheme.muted,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {adminBrandMeta.consoleLabel}
          </Text>
          <Box
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 9px",
              borderRadius: dashboardTheme.radius.pill,
              border: `1px solid ${brandTone.border}`,
              background: brandTone.bg,
              color: brandTone.fg,
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            Premium Console
          </Box>
        </Box>
      </Box>
    </Link>
  );
}
