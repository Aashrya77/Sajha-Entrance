import React, { useEffect, useState } from "react";
import { ApiClient } from "adminjs";
import StudentsPerCourseChart from "./StudentsPerCourseChart";
import {
  adminBrandMeta,
  dashboardTheme,
  getDeltaTone,
  getNotificationTone,
  getPaymentTone,
  getRevenuePalette,
  getToneStyles,
} from "../config/theme.js";

const api = new ApiClient();

const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shellCard = {
  background: dashboardTheme.white,
  border: `1px solid ${dashboardTheme.border}`,
  borderRadius: dashboardTheme.radius.xl,
  boxShadow: dashboardTheme.shadow.card,
};

const fmtNum = (value) => numberFormatter.format(value || 0);
const fmtMoney = (value) => `Rs. ${numberFormatter.format(Math.round(value || 0))}`;
const fmtMoneyCompact = (value) => `Rs. ${compactNumberFormatter.format(value || 0)}`;
const fmtPct = (value) => `${value > 0 ? "+" : ""}${(value || 0).toFixed(1)}%`;
const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";

const Empty = ({ label }) => (
  <div
    style={{
      minHeight: 170,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: dashboardTheme.muted,
      fontSize: 14,
      fontWeight: 600,
      borderRadius: dashboardTheme.radius.lg,
      border: `1px dashed ${dashboardTheme.border}`,
      background: dashboardTheme.white,
    }}
  >
    {label}
  </div>
);

const Pill = ({ tone = "brand", children }) => {
  const styles = getToneStyles(tone);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: styles.bg,
        color: styles.fg,
        border: `1px solid ${styles.border}`,
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
};

const HeroStat = ({ label, value, tone = "brand", detail }) => {
  const styles = getToneStyles(tone);

  return (
    <div
      style={{
        padding: 18,
        borderRadius: dashboardTheme.radius.lg,
        background: "rgba(255,255,255,0.78)",
        border: `1px solid ${styles.border}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
      }}
    >
      <div
        style={{
          color: styles.fg,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 28,
          fontWeight: 800,
          color: dashboardTheme.ink,
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          color: dashboardTheme.muted,
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const Panel = ({ title, detail, action, children }) => (
  <div style={{ ...shellCard, padding: 24 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "flex-start",
        marginBottom: 18,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: dashboardTheme.ink,
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {title}
        </h3>
        {detail ? (
          <p
            style={{
              margin: "7px 0 0",
              color: dashboardTheme.muted,
              fontSize: 13,
              lineHeight: 1.65,
              maxWidth: 560,
            }}
          >
            {detail}
          </p>
        ) : null}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const MiniTrend = ({ data, keyName, palette }) => {
  if (!data?.length) {
    return (
      <div style={{ color: dashboardTheme.muted, fontSize: 12, fontWeight: 600 }}>
        No trend yet
      </div>
    );
  }

  const width = 176;
  const height = 58;
  const max = Math.max(...data.map((item) => item[keyName] || 0), 1);
  const step = data.length > 1 ? (width - 10) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    x: 5 + index * step,
    y: height - 6 - ((item[keyName] || 0) / max) * (height - 14),
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${height - 4} L ${points[0].x} ${height - 4} Z`;

  return (
    <svg width={width} height={height} role="img" aria-hidden="true">
      <path d={area} fill={palette.fill} />
      <path d={line} fill="none" stroke={palette.line} strokeWidth="3" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill={dashboardTheme.white}
          stroke={palette.line}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

const AreaTrendChart = ({
  data,
  valueKey,
  labelKey,
  palette,
  formatValue,
  formatTick,
}) => {
  if (!data?.length) {
    return <Empty label="No trend data available." />;
  }

  const width = Math.max(560, data.length * 98);
  const height = 280;
  const chartHeight = 208;
  const max = Math.max(...data.map((item) => item[valueKey] || 0), 1);
  const step = data.length > 1 ? (width - 64) / (data.length - 1) : 0;
  const gradientId = `trend-fill-${valueKey}-${palette.line.replace("#", "")}`;
  const glowId = `trend-glow-${valueKey}-${palette.line.replace("#", "")}`;
  const points = data.map((item, index) => ({
    x: 32 + index * step,
    y: chartHeight - ((item[valueKey] || 0) / max) * (chartHeight - 28),
    label: item[labelKey],
    value: item[valueKey] || 0,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.line} stopOpacity="0.22" />
            <stop offset="100%" stopColor={palette.line} stopOpacity="0.02" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            y1={chartHeight - chartHeight * fraction}
            x2={width}
            y2={chartHeight - chartHeight * fraction}
            stroke={dashboardTheme.borderSoft}
            strokeDasharray="4 8"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={palette.line}
          strokeWidth="4"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />

        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          return (
            <g key={`${point.label}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isLast ? "6" : "5"}
                fill={dashboardTheme.white}
                stroke={palette.line}
                strokeWidth="3"
              />
              {isLast ? (
                <text
                  x={point.x}
                  y={point.y - 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={dashboardTheme.ink}
                >
                  {formatValue(point.value)}
                </text>
              ) : null}
              <text
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={dashboardTheme.muted}
              >
                {formatTick(point.label)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const MetricCard = ({ label, value, delta, detail, trend, tone = "brand" }) => {
  const styles = getToneStyles(tone);

  return (
    <div
      style={{
        ...shellCard,
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background:
          "radial-gradient(circle at top right, rgba(255,255,255,0.72), transparent 26%), rgba(255,255,255,0.96)",
      }}
    >
      <div
        style={{
          width: 46,
          height: 6,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${styles.fg} 0%, ${dashboardTheme.brand} 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: dashboardTheme.muted,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div
            style={{
              marginTop: 10,
              color: dashboardTheme.ink,
              fontSize: 34,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {value}
          </div>
        </div>
        {typeof delta === "number" ? <Pill tone={getDeltaTone(delta)}>{fmtPct(delta)}</Pill> : null}
      </div>

      <div
        style={{
          color: dashboardTheme.muted,
          fontSize: 14,
          lineHeight: 1.65,
        }}
      >
        {detail}
      </div>

      {trend}
    </div>
  );
};

const Donut = ({ data, labelKey, valueKey }) => {
  if (!data?.length) {
    return <Empty label="No payment status data available." />;
  }

  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (!total) {
    return <Empty label="No payment status data available." />;
  }

  const prepared = data.map((item) => {
    const tone = getToneStyles(getPaymentTone(item[labelKey]));
    return {
      label: item[labelKey],
      value: item[valueKey] || 0,
      color: tone.fg,
      pct: Math.round(((item[valueKey] || 0) / total) * 100),
    };
  });

  const radius = 82;
  const innerRadius = 58;
  const center = 92;
  let angle = -Math.PI / 2;

  const slices = prepared.map((item) => {
    const fraction = item.value / total;
    const startAngle = angle;
    const endAngle = angle + fraction * Math.PI * 2;
    angle = endAngle;
    const largeArc = fraction > 0.5 ? 1 : 0;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    return {
      ...item,
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
    };
  });

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <svg width="184" height="184">
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} />
        ))}
        <text x={center} y={center - 4} textAnchor="middle" fontSize="24" fontWeight="800" fill={dashboardTheme.ink}>
          {total}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" fontSize="12" fontWeight="700" fill={dashboardTheme.muted}>
          Transactions
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 220px" }}>
        {slices.map((slice) => (
          <div
            key={slice.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              padding: "10px 0",
              borderBottom: `1px solid ${dashboardTheme.borderSoft}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: dashboardTheme.ink, fontWeight: 700 }}>
                {slice.label}
              </span>
            </div>
            <span style={{ color: dashboardTheme.muted, fontSize: 13, fontWeight: 700 }}>
              {slice.value} ({slice.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Table = ({ rows, cols, empty }) => {
  if (!rows?.length) {
    return <Empty label={empty} />;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || "left",
                  paddingBottom: 12,
                  borderBottom: `1px solid ${dashboardTheme.border}`,
                  color: dashboardTheme.muted,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row._id || rowIndex}>
              {cols.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "14px 0",
                    borderBottom:
                      rowIndex === rows.length - 1
                        ? "none"
                        : `1px solid ${dashboardTheme.borderSoft}`,
                    textAlign: col.align || "left",
                    verticalAlign: "top",
                    fontSize: 14,
                    color: dashboardTheme.ink,
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Timeline = ({ items }) => {
  if (!items?.length) {
    return <Empty label="No activity found for this filter." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item, index) => (
        <div
          key={`${item._id || index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "16px 1fr",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: dashboardTheme.brand,
                marginTop: 4,
                boxShadow: "0 0 0 4px rgba(255, 116, 34, 0.12)",
              }}
            />
            {index < items.length - 1 ? (
              <div
                style={{
                  width: 2,
                  flex: 1,
                  background: "linear-gradient(180deg, rgba(255,116,34,0.22) 0%, rgba(148,163,184,0.12) 100%)",
                  marginTop: 6,
                }}
              />
            ) : null}
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: dashboardTheme.radius.lg,
              background: dashboardTheme.white,
              border: `1px solid ${dashboardTheme.borderSoft}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: dashboardTheme.ink, fontWeight: 800 }}>
                {item.message}
              </div>
              <div style={{ color: dashboardTheme.muted, fontSize: 12, fontWeight: 700 }}>
                {fmtDate(item.createdAt)}
              </div>
            </div>
            <div
              style={{
                marginTop: 7,
                color: dashboardTheme.muted,
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {(item.actorName || "System")} • {item.resource} • {item.action}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Notices = ({ items }) => {
  if (!items?.length) {
    return <Empty label="No notifications to show." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, index) => {
        const tone = getNotificationTone(item.type);
        return (
          <div
            key={`${item._id || index}`}
            style={{
              padding: 16,
              border: `1px solid ${item.isRead ? dashboardTheme.borderSoft : getToneStyles(tone).border}`,
              borderRadius: dashboardTheme.radius.lg,
              background: item.isRead ? dashboardTheme.white : getToneStyles(tone).bg,
              boxShadow: item.isRead ? "none" : "inset 0 1px 0 rgba(255,255,255,0.72)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: dashboardTheme.ink, fontWeight: 800 }}>
                {item.title}
              </div>
              <Pill tone={tone}>{item.isRead ? "Read" : "Unread"}</Pill>
            </div>
            <div
              style={{
                marginTop: 8,
                color: dashboardTheme.muted,
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              {item.message}
            </div>
            <div
              style={{
                marginTop: 10,
                color: dashboardTheme.muted,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {fmtDate(item.createdAt)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .getDashboard({ params: selectedUserId ? { userId: selectedUserId } : {} })
      .then((response) => mounted && setData(response.data))
      .catch(() => {
        mounted && setData({ error: "Failed to load dashboard data." });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [selectedUserId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "65vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: dashboardTheme.muted,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Loading your premium workspace...
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div style={{ padding: 40, color: dashboardTheme.danger, fontWeight: 700 }}>
        {data?.error || "Unable to load dashboard."}
      </div>
    );
  }

  const {
    counts = {},
    growth = {},
    studentsByCourse = [],
    paymentsByStatus = [],
    registrationsTrend = [],
    revenueTrend = [],
    revenueTotal = 0,
    recentPayments = [],
    recentActivity = [],
    notifications = [],
    unreadNotifications = 0,
    teamMembers = [],
    upcomingClasses = [],
  } = data;

  const revenuePalette = getRevenuePalette(growth.revenue);
  const registrationPalette = {
    line: dashboardTheme.brand,
    fill: "rgba(255, 116, 34, 0.14)",
  };

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1520,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div
        style={{
          ...shellCard,
          padding: "32px 34px",
          background:
            "radial-gradient(circle at top right, rgba(255,116,34,0.16), transparent 26%), radial-gradient(circle at bottom left, rgba(22,163,74,0.10), transparent 22%), linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,248,243,1) 100%)",
          boxShadow: dashboardTheme.shadow.hero,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
              <Pill tone="brand">{adminBrandMeta.consoleName}</Pill>
              <Pill tone={unreadNotifications > 0 ? "warning" : "neutral"}>
                {unreadNotifications} unread notifications
              </Pill>
              <Pill tone="success">{counts.activeAdminUsers || 0} active team members</Pill>
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 42,
                lineHeight: 1.02,
                fontWeight: 800,
                color: dashboardTheme.ink,
                maxWidth: 720,
              }}
            >
              Professional admin visibility aligned to the Sajha Entrance brand.
            </h1>

            <p
              style={{
                margin: "16px 0 0",
                color: dashboardTheme.muted,
                fontSize: 15,
                lineHeight: 1.8,
                maxWidth: 760,
              }}
            >
              Monitor enrollments, revenue, operational activity, and team health from one polished console built for daily admin work.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 12,
            }}
          >
            <HeroStat
              label="Revenue"
              value={fmtMoneyCompact(revenueTotal)}
              tone={revenuePalette.tone}
              detail={growth.revenue >= 0 ? "Positive income momentum" : "Revenue below last month"}
            />
            <HeroStat
              label="Paid Students"
              value={fmtNum(counts.paidStudents)}
              tone="success"
              detail="Students with completed payment status"
            />
            <HeroStat
              label="Admin Team"
              value={fmtNum(counts.adminUsers)}
              tone="info"
              detail="Users with workspace access"
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 18,
        }}
      >
        <MetricCard
          label="Total students"
          value={fmtNum(counts.students)}
          delta={growth.students}
          detail="Month-over-month registration movement based on student account creation."
          tone="brand"
          trend={<MiniTrend data={registrationsTrend} keyName="count" palette={registrationPalette} />}
        />

        <MetricCard
          label="Revenue"
          value={fmtMoney(revenueTotal)}
          delta={growth.revenue}
          detail="Completed payments only, with the latest six-month movement reflected in the trend."
          tone={revenuePalette.tone}
          trend={<MiniTrend data={revenueTrend} keyName="total" palette={revenuePalette} />}
        />

        <MetricCard
          label="Courses"
          value={fmtNum(counts.courses)}
          detail="Programs currently available across Sajha Entrance pathways."
          tone="info"
          trend={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill tone="info">{fmtNum(counts.blogs)} content posts</Pill>
              <Pill tone="brand">{fmtNum(counts.colleges)} colleges</Pill>
            </div>
          }
        />

        <MetricCard
          label="Active vs inactive users"
          value={`${counts.activeAdminUsers || 0} / ${counts.inactiveAdminUsers || 0}`}
          detail="Team access health across all admin members with role-based privileges."
          tone="neutral"
          trend={
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: dashboardTheme.muted,
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                <span>Active access</span>
                <span>
                  {counts.adminUsers
                    ? Math.round(((counts.activeAdminUsers || 0) / counts.adminUsers) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div
                style={{
                  height: 12,
                  borderRadius: 999,
                  background: dashboardTheme.borderSoft,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      counts.adminUsers
                        ? ((counts.activeAdminUsers || 0) / counts.adminUsers) * 100
                        : 0
                    }%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${dashboardTheme.success} 0%, ${dashboardTheme.brand} 100%)`,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 18,
        }}
      >
        <Panel title="Student registrations" detail="Six-month trend of account creation across the student pipeline.">
          <AreaTrendChart
            data={registrationsTrend}
            valueKey="count"
            labelKey="month"
            palette={registrationPalette}
            formatValue={(value) => fmtNum(value)}
            formatTick={(label) => label.split(" ")[0]}
          />
        </Panel>

        <Panel
          title="Revenue flow"
          detail="Income movement across completed transactions. Positive momentum uses green, while declines turn red."
        >
          <AreaTrendChart
            data={revenueTrend}
            valueKey="total"
            labelKey="month"
            palette={revenuePalette}
            formatValue={(value) => fmtMoneyCompact(value)}
            formatTick={(label) => label.split(" ")[0]}
          />
        </Panel>

        <Panel title="Notifications" detail="Unread and recent system events that need attention.">
          <Notices items={notifications} />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 18,
        }}
      >
        <Panel title="Students per course" detail="Enrollment distribution by course, ordered by size.">
          <StudentsPerCourseChart data={studentsByCourse} labelKey="_id" valueKey="count" />
        </Panel>

        <Panel title="Payment status" detail="Live distribution of transaction outcomes across the payment pipeline.">
          <Donut data={paymentsByStatus} labelKey="_id" valueKey="count" />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 18,
        }}
      >
        <Panel
          title="Recent activity"
          detail="Member-wise audit trail with timestamps and action context."
          action={
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              style={{
                minWidth: 220,
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${dashboardTheme.border}`,
                background: dashboardTheme.white,
                color: dashboardTheme.ink,
                fontWeight: 700,
              }}
            >
              <option value="">All members</option>
              {teamMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.fullName} - {member.role}
                </option>
              ))}
            </select>
          }
        >
          <Timeline items={recentActivity} />
        </Panel>

        <Panel title="Recent payments" detail="Latest transaction updates from the payment pipeline.">
          <Table
            rows={recentPayments}
            empty="No recent payments found."
            cols={[
              {
                key: "studentName",
                label: "Student",
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 800 }}>{row.studentName}</div>
                    <div style={{ fontSize: 12, color: dashboardTheme.muted }}>
                      {row.courseTitle}
                    </div>
                  </div>
                ),
              },
              {
                key: "totalAmount",
                label: "Amount",
                align: "right",
                render: (row) => fmtMoney(row.totalAmount),
              },
              {
                key: "status",
                label: "Status",
                align: "right",
                render: (row) => <Pill tone={getPaymentTone(row.status)}>{row.status}</Pill>,
              },
            ]}
          />
        </Panel>

        <Panel title="Upcoming classes" detail="Next live sessions the team should keep an eye on.">
          <Table
            rows={upcomingClasses}
            empty="No upcoming classes scheduled."
            cols={[
              {
                key: "classTitle",
                label: "Session",
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 800 }}>{row.classTitle}</div>
                    <div style={{ fontSize: 12, color: dashboardTheme.muted }}>
                      {row.subject}
                    </div>
                  </div>
                ),
              },
              {
                key: "course",
                label: "Course",
                render: (row) => <Pill tone="brand">{row.course}</Pill>,
              },
              {
                key: "classDateTime",
                label: "Time",
                align: "right",
                render: (row) => fmtDate(row.classDateTime),
              },
            ]}
          />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
          gap: 18,
        }}
      >
        {[
          ["Colleges", counts.colleges, "Partner institutions currently active"],
          ["Universities", counts.universities, "Higher education destinations tracked"],
          ["Blogs", counts.blogs, "Content pieces ready for students"],
          ["Notices", counts.notices, "Announcement items in the system"],
          ["Recorded Classes", counts.recordedClasses, "On-demand learning assets currently stored"],
          ["Upcoming Classes", counts.onlineClasses, "Scheduled live sessions on the platform"],
          ["Contacts", counts.contacts, "Lead submissions from the public site"],
          ["Newsletters", counts.newsletters, "Subscribed email records in the CRM"],
        ].map(([label, value, description]) => (
          <div key={label} style={{ ...shellCard, padding: "20px 22px" }}>
            <div
              style={{
                color: dashboardTheme.muted,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 800,
                color: dashboardTheme.ink,
                lineHeight: 1.05,
              }}
            >
              {fmtNum(value)}
            </div>
            <div
              style={{
                marginTop: 8,
                color: dashboardTheme.muted,
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              {description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
