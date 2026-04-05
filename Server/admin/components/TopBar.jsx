import React from "react";
import { Box, Icon, Text } from "@adminjs/design-system";
import { LoggedIn, Version, ViewHelpers } from "adminjs";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { adminBrandMeta, dashboardTheme, getToneStyles } from "../config/theme.js";

const h = new ViewHelpers();

const shell = {
  borderRadius: dashboardTheme.radius.lg,
  border: `1px solid ${dashboardTheme.borderSoft}`,
  background: "rgba(255, 255, 255, 0.78)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.78)",
};

export default function TopBar({ toggleSidebar }) {
  const session = useSelector((state) => state.session);
  const paths = useSelector((state) => state.paths);
  const versions = useSelector((state) => state.versions);
  const branding = useSelector((state) => state.branding);
  const brandTone = getToneStyles("brand");
  const hasLogo = Boolean(branding?.logo);

  return (
    <Box
      data-css="topbar"
      className="sajha-admin-topbar"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        gap: 12,
        padding: "14px 18px",
        minHeight: 78,
      }}
    >
      <Box
        py="lg"
        px={["default", "lg"]}
        onClick={toggleSidebar}
        display={["block", "block", "block", "block", "none"]}
        className="sajha-admin-topbar__menu"
        style={{
          cursor: "pointer",
          borderRadius: dashboardTheme.radius.md,
          color: dashboardTheme.ink,
        }}
      >
        <Icon icon="Menu" size={24} />
      </Box>

      <Link
        to={h.dashboardUrl()}
        className="sajha-admin-topbar__brand"
        style={{
          textDecoration: "none",
          color: "inherit",
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        <Box
          className="sajha-admin-topbar__brandCard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "8px 0",
            minWidth: 0,
          }}
        >
          {hasLogo ? (
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                minWidth: 0,
                flexShrink: 0,
              }}
            >
              <img
                src={branding.logo}
                alt={branding.companyName}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/admin/brand-logo.svg";
                }}
                style={{
                  width: "auto",
                  maxWidth: 164,
                  height: "auto",
                  maxHeight: 42,
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
                width: 42,
                height: 42,
                borderRadius: 14,
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

          <Box style={{ minWidth: 0 }}>
            <Box
              className="sajha-admin-topbar__brandTitle"
              style={{
                color: dashboardTheme.ink,
                fontSize: 15,
                fontWeight: 800,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {hasLogo ? (branding?.companyName || adminBrandMeta.companyName) : adminBrandMeta.consoleName}
            </Box>
            <Text
              className="sajha-admin-topbar__brandSubtitle"
              style={{
                marginTop: 4,
                color: dashboardTheme.muted,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {adminBrandMeta.consoleSubtitle}
            </Text>
          </Box>
        </Box>
      </Link>

      <Box
        className="sajha-admin-topbar__actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginLeft: "auto",
          flexShrink: 0,
        }}
      >
        <Box
          display={["none", "none", "none", "block", "block"]}
          style={{
            padding: "10px 12px",
            borderRadius: dashboardTheme.radius.pill,
            border: `1px solid ${brandTone.border}`,
            background: brandTone.bg,
            color: brandTone.fg,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          Secure Workspace
        </Box>

        <Box
          display={["none", "none", "block", "block", "block"]}
          style={{
            ...shell,
            padding: "10px 12px",
          }}
        >
          <Version versions={versions} />
        </Box>

        {session?.email ? <LoggedIn session={session} paths={paths} /> : null}
      </Box>
    </Box>
  );
}
