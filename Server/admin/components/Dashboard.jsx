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

const fmtNum = (value) => numberFormatter.format(value || 0);
const fmtMoney = (value) => `Rs. ${numberFormatter.format(Math.round(value || 0))}`;
const fmtMoneyCompact = (value) => `Rs. ${compactNumberFormatter.format(value || 0)}`;
const fmtPct = (value) => `${value > 0 ? "+" : ""}${(value || 0).toFixed(1)}%`;
const fmtShare = (value, total) => {
  if (!total) {
    return "0%";
  }

  const percentage = ((value || 0) / total) * 100;
  return percentage >= 10
    ? `${Math.round(percentage)}%`
    : `${percentage.toFixed(1).replace(/\.0$/, "")}%`;
};
const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not available";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const getTrendSnapshot = (data, valueKey) => {
  const points = Array.isArray(data)
    ? data.map((item) => ({
        label: item?.month || "",
        value: Number(item?.[valueKey]) || 0,
      }))
    : [];

  const latest = points[points.length - 1] || null;
  const peak = points.reduce(
    (currentPeak, point) => (!currentPeak || point.value > currentPeak.value ? point : currentPeak),
    null
  );
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const average = points.length ? total / points.length : 0;

  return {
    latest,
    peak,
    total,
    average,
    periods: points.length,
  };
};

const cx = (...classes) => classes.filter(Boolean).join(" ");
const getToneClassName = (tone = "brand") => `dashboard-tone-${tone}`;
const getAlignClassName = (align = "left") =>
  align === "right" ? "dashboard-align-right" : "dashboard-align-left";

const Empty = ({ label }) => <div className="dashboard-empty">{label}</div>;

const Pill = ({ tone = "brand", children }) => (
  <span className={cx("dashboard-pill", getToneClassName(tone))}>{children}</span>
);

const HeroStat = ({ label, value, tone = "brand", detail }) => (
  <div className={cx("dashboard-hero-stat", getToneClassName(tone))}>
    <div className="dashboard-hero-stat__label">{label}</div>
    <div className="dashboard-hero-stat__value">{value}</div>
    <div className="dashboard-hero-stat__detail">{detail}</div>
  </div>
);

const Panel = ({ title, detail, action, children, className, bodyClassName }) => (
  <section className={cx("dashboard-card", "dashboard-panel", className)}>
    <div className="dashboard-panel__header">
      <div>
        <h3 className="dashboard-panel__title">{title}</h3>
        {detail ? <p className="dashboard-panel__detail">{detail}</p> : null}
      </div>
      {action ? <div className="dashboard-panel__action">{action}</div> : null}
    </div>
    <div className={cx("dashboard-panel__body", bodyClassName)}>{children}</div>
  </section>
);

const AreaTrendChart = ({
  data,
  valueKey,
  labelKey,
  palette,
  formatValue,
  formatTick,
  formatAxisValue = formatValue,
  variant = "area",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(Math.max((data?.length || 1) - 1, 0));
  }, [data, valueKey, labelKey]);

  if (!data?.length) {
    return <Empty label="No trend data available." />;
  }

  const width = Math.max(760, data.length * 124);
  const height = 336;
  const chartTop = 28;
  const chartBottom = 258;
  const leftPad = 76;
  const rightPad = 28;
  const drawableHeight = chartBottom - chartTop;
  const max = Math.max(...data.map((item) => item[valueKey] || 0), 1);
  const step = data.length > 1 ? (width - leftPad - rightPad) / (data.length - 1) : 0;
  const gradientId = `trend-fill-${valueKey}-${palette.line.replace("#", "")}`;
  const glowId = `trend-glow-${valueKey}-${palette.line.replace("#", "")}`;
  const points = data.map((item, index) => ({
    x: leftPad + index * step,
    y: chartBottom - ((item[valueKey] || 0) / max) * drawableHeight,
    label: item[labelKey],
    value: item[valueKey] || 0,
  }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;
  const yFractions = [1, 0.75, 0.5, 0.25, 0];
  const safeActiveIndex = clamp(activeIndex, 0, points.length - 1);
  const activePoint = points[safeActiveIndex];
  const tooltipWidth = 170;
  const tooltipHeight = 60;
  const showArea = variant !== "line";
  const strokeWidth = variant === "line" ? 5 : 4;
  const tooltipX = activePoint
    ? clamp(activePoint.x - tooltipWidth / 2, leftPad, width - rightPad - tooltipWidth)
    : leftPad;

  return (
    <div
      className="dashboard-trend-chart"
      onMouseLeave={() => setActiveIndex(points.length - 1)}
    >
      <svg width={width} height={height} className="dashboard-trend-chart__svg">
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

        {yFractions.map((fraction) => {
          const y = chartBottom - drawableHeight * fraction;

          return (
            <g key={fraction}>
              <line
                x1={leftPad}
                y1={y}
                x2={width - rightPad}
                y2={y}
                stroke={dashboardTheme.borderSoft}
                strokeDasharray="4 8"
              />
              <text
                x={leftPad - 14}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight="700"
                fill={dashboardTheme.mutedSoft}
              >
                {formatAxisValue(max * fraction)}
              </text>
            </g>
          );
        })}

        {showArea ? <path d={area} fill={`url(#${gradientId})`} /> : null}
        <path
          d={line}
          fill="none"
          stroke={palette.line}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />

        {activePoint ? (
          <line
            x1={activePoint.x}
            y1={chartTop}
            x2={activePoint.x}
            y2={chartBottom}
            stroke={palette.line}
            strokeOpacity="0.18"
            strokeDasharray="5 8"
          />
        ) : null}

        {points.map((point, index) => {
          const isActive = index === safeActiveIndex;
          return (
            <g
              key={`${point.label}-${index}`}
              className="dashboard-trend-chart__point"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              tabIndex={0}
            >
              <circle cx={point.x} cy={point.y} r="18" fill="transparent" />
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? "7" : "5"}
                fill={dashboardTheme.white}
                stroke={palette.line}
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={height - 16}
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

        {activePoint ? (
          <g transform={`translate(${tooltipX}, 16)`}>
            <rect
              width={tooltipWidth}
              height={tooltipHeight}
              rx="16"
              fill="rgba(15, 23, 42, 0.96)"
            />
            <text x="16" y="24" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.72)">
              {activePoint.label}
            </text>
            <text x="16" y="43" fontSize="20" fontWeight="800" fill={dashboardTheme.white}>
              {formatValue(activePoint.value)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
};

const TrendSummary = ({ tone = "brand", primaryLabel, primaryValue, primaryMeta, stats }) => (
  <div className={cx("dashboard-trend-overview", getToneClassName(tone))}>
    <div className="dashboard-trend-overview__primary">
      <div className="dashboard-trend-overview__eyebrow">{primaryLabel}</div>
      <div className="dashboard-trend-overview__value">{primaryValue}</div>
      <div className="dashboard-trend-overview__meta">{primaryMeta}</div>
    </div>

    <div className="dashboard-trend-overview__stats">
      {stats.map((stat) => (
        <div key={stat.label} className="dashboard-trend-stat">
          <div className="dashboard-trend-stat__label">{stat.label}</div>
          <div className="dashboard-trend-stat__value">{stat.value}</div>
          <div className="dashboard-trend-stat__meta">{stat.meta}</div>
        </div>
      ))}
    </div>
  </div>
);

const MetricList = ({ items }) => (
  <div className="dashboard-metric-list">
    {items.map((item) => (
      <div key={item.label} className="dashboard-metric-list__item">
        <div className="dashboard-metric-list__label">{item.label}</div>
        <div className="dashboard-metric-list__value">{item.value}</div>
        <div className="dashboard-metric-list__meta">{item.meta}</div>
      </div>
    ))}
  </div>
);

const MetricCard = ({ label, value, delta, detail, trend, tone = "brand" }) => (
  <div className={cx("dashboard-card", "dashboard-metric-card", getToneClassName(tone))}>
    <div className="dashboard-metric-card__accent" />

    <div className="dashboard-metric-card__header">
      <div>
        <div className="dashboard-metric-card__label">{label}</div>
        <div className="dashboard-metric-card__value">{value}</div>
      </div>
      {typeof delta === "number" ? <Pill tone={getDeltaTone(delta)}>{fmtPct(delta)}</Pill> : null}
    </div>

    <div className="dashboard-metric-card__detail">{detail}</div>

    {trend}
  </div>
);

const PaymentStatusChart = ({ data, labelKey, valueKey }) => {
  if (!data?.length) {
    return <Empty label="No payment status data available." />;
  }

  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  if (!total) {
    return <Empty label="No payment status data available." />;
  }

  const prepared = data
    .map((item) => {
      const tone = getPaymentTone(item[labelKey]);
      const toneStyles = getToneStyles(tone);
      const value = item[valueKey] || 0;

      return {
        label: item[labelKey],
        value,
        color: toneStyles.fg,
        pct: Math.round((value / total) * 100),
        shareLabel: fmtShare(value, total),
        tone,
      };
    })
    .sort((left, right) => right.value - left.value);

  return (
    <div className="dashboard-status-chart">
      <div className="dashboard-status-chart__summary">
        <div>
          <div className="dashboard-status-chart__eyebrow">Transaction mix</div>
          <div className="dashboard-status-chart__total">{fmtNum(total)}</div>
          <div className="dashboard-status-chart__meta">
            All payment outcomes combined in one readable distribution bar.
          </div>
        </div>
        <Pill tone="neutral">{prepared.length} statuses</Pill>
      </div>

      <div
        className="dashboard-status-chart__stack"
        role="img"
        aria-label={prepared
          .map((slice) => `${slice.label}: ${slice.value} (${slice.shareLabel})`)
          .join(", ")}
      >
        {prepared.map((slice) => (
          <div
            key={slice.label}
            className={cx("dashboard-status-chart__segment", getToneClassName(slice.tone))}
            style={{ "--dashboard-segment-grow": Math.max(slice.value, 1) }}
            title={`${slice.label}: ${slice.value} (${slice.shareLabel})`}
          >
            <span className="dashboard-status-chart__segment-fill" />
          </div>
        ))}
      </div>

      <div className="dashboard-status-chart__legend">
        {prepared.map((slice) => (
          <div key={slice.label} className="dashboard-status-chart__legend-item">
            <div className="dashboard-status-chart__legend-main">
              <span
                className={cx("dashboard-status-chart__legend-dot", getToneClassName(slice.tone))}
                aria-hidden="true"
              />
              <span className="dashboard-status-chart__legend-name">{slice.label}</span>
            </div>

            <div className="dashboard-status-chart__legend-bar">
              <div
                className={cx("dashboard-status-chart__legend-fill", getToneClassName(slice.tone))}
                style={{ width: slice.shareLabel }}
              />
            </div>

            <div className="dashboard-status-chart__legend-values">
              <strong>{fmtNum(slice.value)}</strong>
              <span>{slice.shareLabel}</span>
            </div>
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
    <div className="dashboard-scroll-x">
      <table className="dashboard-table">
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                className={cx("dashboard-table__head", getAlignClassName(col.align))}
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
                  className={cx("dashboard-table__cell", getAlignClassName(col.align))}
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

const Notices = ({ items }) => {
  if (!items?.length) {
    return <Empty label="No notifications to show." />;
  }

  return (
    <div className="dashboard-notices">
      {items.map((item, index) => {
        const tone = getNotificationTone(item.type);

        return (
          <div
            key={`${item._id || index}`}
            className={cx(
              "dashboard-notice",
              item.isRead
                ? "dashboard-notice--read"
                : cx("dashboard-notice--unread", getToneClassName(tone))
            )}
          >
            <div className="dashboard-notice__header">
              <div className="dashboard-notice__title">{item.title}</div>
              <Pill tone={tone}>{item.isRead ? "Read" : "Unread"}</Pill>
            </div>
            <div className="dashboard-notice__message">{item.message}</div>
            <div className="dashboard-notice__time">{fmtDate(item.createdAt)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .getDashboard()
      .then((response) => mounted && setData(response.data))
      .catch(() => {
        mounted && setData({ error: "Failed to load dashboard data." });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-state dashboard-state--loading">
        Loading your premium workspace...
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="dashboard-state dashboard-state--error">
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
    notifications = [],
    unreadNotifications = 0,
    upcomingClasses = [],
  } = data;

  const revenuePalette = getRevenuePalette(growth.revenue);
  const registrationPalette = {
    line: dashboardTheme.brand,
    fill: "rgba(255, 116, 34, 0.14)",
  };
  const registrationsSnapshot = getTrendSnapshot(registrationsTrend, "count");
  const revenueSnapshot = getTrendSnapshot(revenueTrend, "total");
  const activeAccessPercentage = counts.adminUsers
    ? ((counts.activeAdminUsers || 0) / counts.adminUsers) * 100
    : 0;

  return (
    <div className="dashboard-root">
      <div className="dashboard-card dashboard-hero dashboard-hero--premium">
        <div className="dashboard-hero__grid">
          <div>
            <div className="dashboard-flex dashboard-flex-wrap dashboard-gap-sm dashboard-hero__pills">
              <Pill tone="brand">{adminBrandMeta.consoleName}</Pill>
              <Pill tone={unreadNotifications > 0 ? "warning" : "neutral"}>
                {unreadNotifications} unread notifications
              </Pill>
              <Pill tone="success">{counts.activeAdminUsers || 0} active team members</Pill>
            </div>

            <h1 className="dashboard-hero__title">
              Professional admin visibility aligned to the Sajha Entrance brand.
            </h1>

            <p className="dashboard-hero__copy">
              Monitor enrollments, revenue, team health, and high-priority alerts from one polished
              console built for daily admin work.
            </p>
          </div>

          <div className="dashboard-hero__stats">
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

      <div className="dashboard-grid dashboard-grid--metrics">
        <MetricCard
          label="Total students"
          value={fmtNum(counts.students)}
          delta={growth.students}
          detail="Month-over-month registration movement based on student account creation."
          tone="brand"
          trend={
            <MetricList
              items={[
                {
                  label: "Latest month",
                  value: fmtNum(registrationsSnapshot.latest?.value),
                  meta: registrationsSnapshot.latest?.label || "No recent month",
                },
                {
                  label: "6-month total",
                  value: fmtNum(registrationsSnapshot.total),
                  meta: "Tracked in the trend section",
                },
              ]}
            />
          }
        />

        <MetricCard
          label="Revenue"
          value={fmtMoney(revenueTotal)}
          delta={growth.revenue}
          detail="Completed payments only, with the latest six-month movement reflected in the trend."
          tone={revenuePalette.tone}
          trend={
            <MetricList
              items={[
                {
                  label: "Latest month",
                  value: fmtMoneyCompact(revenueSnapshot.latest?.value),
                  meta: revenueSnapshot.latest?.label || "No recent month",
                },
                {
                  label: "6-month total",
                  value: fmtMoneyCompact(revenueSnapshot.total),
                  meta: "Completed revenue only",
                },
              ]}
            />
          }
        />

        <MetricCard
          label="Courses"
          value={fmtNum(counts.courses)}
          detail="Programs currently available across Sajha Entrance pathways."
          tone="info"
          trend={
            <MetricList
              items={[
                {
                  label: "Content posts",
                  value: fmtNum(counts.blogs),
                  meta: "Published blog inventory",
                },
                {
                  label: "Colleges tracked",
                  value: fmtNum(counts.colleges),
                  meta: "Partner institution count",
                },
              ]}
            />
          }
        />

        <MetricCard
          label="Active vs inactive users"
          value={`${counts.activeAdminUsers || 0} / ${counts.inactiveAdminUsers || 0}`}
          detail="Team access health across all admin members with role-based privileges."
          tone="neutral"
          trend={
            <div className="dashboard-progress-card">
              <div className="dashboard-progress-card__header">
                <span>Active access</span>
                <span>{Math.round(activeAccessPercentage)}%</span>
              </div>
              <progress className="dashboard-progress" max="100" value={activeAccessPercentage} />
            </div>
          }
        />
      </div>

      <div className="dashboard-stack dashboard-stack--trends">
        <Panel
          title="Student registrations"
          detail="Six-month trend of account creation across the student pipeline."
          action={<Pill tone="brand">Enrollment trend</Pill>}
          className={cx("dashboard-panel--trend", getToneClassName("brand"))}
          bodyClassName="dashboard-panel__body--chart"
        >
          <TrendSummary
            tone="brand"
            primaryLabel="Latest month"
            primaryValue={fmtNum(registrationsSnapshot.latest?.value)}
            primaryMeta={registrationsSnapshot.latest?.label || "No trend data available yet"}
            stats={[
              {
                label: "Peak month",
                value: fmtNum(registrationsSnapshot.peak?.value),
                meta: registrationsSnapshot.peak?.label || "Not available",
              },
              {
                label: "Monthly average",
                value: fmtNum(Math.round(registrationsSnapshot.average || 0)),
                meta: `${registrationsSnapshot.periods || 0} months reviewed`,
              },
              {
                label: "Period total",
                value: fmtNum(registrationsSnapshot.total),
                meta: "New student accounts",
              },
            ]}
          />
          <AreaTrendChart
            data={registrationsTrend}
            valueKey="count"
            labelKey="month"
            palette={registrationPalette}
            formatValue={(value) => fmtNum(value)}
            formatAxisValue={(value) => fmtNum(Math.round(value))}
            formatTick={(label) => label.split(" ")[0]}
            variant="area"
          />
        </Panel>

        <Panel
          title="Revenue flow"
          detail="Income movement across completed transactions. Positive momentum uses green, while declines turn red."
          action={<Pill tone={revenuePalette.tone}>Income trend</Pill>}
          className={cx("dashboard-panel--trend", getToneClassName(revenuePalette.tone))}
          bodyClassName="dashboard-panel__body--chart"
        >
          <TrendSummary
            tone={revenuePalette.tone}
            primaryLabel="Latest month"
            primaryValue={fmtMoneyCompact(revenueSnapshot.latest?.value)}
            primaryMeta={revenueSnapshot.latest?.label || "No trend data available yet"}
            stats={[
              {
                label: "Peak month",
                value: fmtMoneyCompact(revenueSnapshot.peak?.value),
                meta: revenueSnapshot.peak?.label || "Not available",
              },
              {
                label: "Monthly average",
                value: fmtMoneyCompact(revenueSnapshot.average || 0),
                meta: `${revenueSnapshot.periods || 0} months reviewed`,
              },
              {
                label: "Period total",
                value: fmtMoneyCompact(revenueSnapshot.total),
                meta: "Completed transactions only",
              },
            ]}
          />
          <AreaTrendChart
            data={revenueTrend}
            valueKey="total"
            labelKey="month"
            palette={revenuePalette}
            formatValue={(value) => fmtMoneyCompact(value)}
            formatAxisValue={(value) => fmtMoneyCompact(value)}
            formatTick={(label) => label.split(" ")[0]}
            variant="line"
          />
        </Panel>
      </div>

      <div className="dashboard-grid dashboard-grid--distribution">
        <Panel
          title="Students per course"
          detail="Shows enrollment distribution across courses with readable horizontal bars, clear student counts, and a polished analytics presentation."
          action={<Pill tone="info">Enrollment distribution</Pill>}
          className="dashboard-panel--comparison"
        >
          <StudentsPerCourseChart data={studentsByCourse} labelKey="_id" valueKey="count" />
        </Panel>

        <div className="dashboard-stack dashboard-stack--analysis-rail">
          <Panel
            title="Payment status"
            detail="This segmented horizontal bar is easier to compare at a glance than a donut when admins need to read exact status mix."
            action={<Pill tone="neutral">Segmented distribution</Pill>}
            className="dashboard-panel--compact-chart"
          >
            <PaymentStatusChart data={paymentsByStatus} labelKey="_id" valueKey="count" />
          </Panel>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--operations">
        <Panel
          title="Notifications"
          detail="Recent admin alerts and items that still need attention."
          action={
            <Pill tone={unreadNotifications > 0 ? "warning" : "neutral"}>
              {unreadNotifications} unread
            </Pill>
          }
          className="dashboard-panel--notifications"
        >
          <Notices items={notifications} />
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
                  <div className="dashboard-table__stack">
                    <div className="dashboard-table__title">{row.studentName}</div>
                    <div className="dashboard-table__meta">{row.courseTitle}</div>
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
                  <div className="dashboard-table__stack">
                    <div className="dashboard-table__title">{row.classTitle}</div>
                    <div className="dashboard-table__meta">{row.subject}</div>
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

      <div className="dashboard-grid dashboard-grid--summary">
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
          <div key={label} className="dashboard-card dashboard-summary-card">
            <div className="dashboard-summary-card__label">{label}</div>
            <div className="dashboard-summary-card__value">{fmtNum(value)}</div>
            <div className="dashboard-summary-card__detail">{description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
