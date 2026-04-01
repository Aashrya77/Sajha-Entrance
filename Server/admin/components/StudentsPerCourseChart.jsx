import React, { useEffect, useState } from "react";
import { dashboardTheme } from "../config/theme.js";

const BRAND = dashboardTheme.brand;
const BRAND_LIGHT = "#FFB080";
const BRAND_DARK = dashboardTheme.brandStrong;

const chartStyles = `
.spc-chart {
  font-family: ${dashboardTheme.fontFamily};
}

.spc-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(255, 116, 34, 0.14);
  background:
    radial-gradient(circle at top right, rgba(255, 176, 128, 0.32), transparent 36%),
    linear-gradient(180deg, rgba(255, 250, 247, 1) 0%, rgba(255, 255, 255, 1) 100%);
  box-shadow: 0 24px 48px rgba(255, 116, 34, 0.08);
}

.spc-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.spc-summary-label {
  color: var(--spc-brand-dark);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.spc-summary-copy {
  margin-top: 8px;
  color: ${dashboardTheme.ink};
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.spc-summary-detail {
  margin-top: 6px;
  color: ${dashboardTheme.muted};
  font-size: 13px;
  line-height: 1.6;
}

.spc-kpis {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.spc-chip {
  min-width: 108px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 116, 34, 0.14);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.spc-chip-label {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spc-chip-value {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.2;
}

.spc-chip-meta {
  display: block;
  margin-top: 4px;
  color: var(--spc-brand-dark);
  font-size: 12px;
  font-weight: 700;
}

.spc-axis {
  display: grid;
  grid-template-columns: minmax(112px, 140px) minmax(0, 1fr) 74px;
  gap: 16px;
  align-items: center;
}

.spc-axis-scale {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}

.spc-axis-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 116, 34, 0.12) 0%,
    rgba(255, 116, 34, 0.12) 49.6%,
    rgba(15, 23, 42, 0.08) 49.6%,
    rgba(15, 23, 42, 0.08) 50.4%,
    rgba(255, 116, 34, 0.12) 50.4%,
    rgba(255, 116, 34, 0.12) 100%
  );
}

.spc-axis span {
  position: relative;
  padding: 0 8px;
  background: linear-gradient(180deg, rgba(255, 250, 247, 1) 0%, rgba(255, 255, 255, 1) 100%);
}

.spc-axis-caption {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.spc-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spc-row {
  display: grid;
  grid-template-columns: minmax(112px, 140px) minmax(0, 1fr) 74px;
  gap: 16px;
  align-items: center;
  padding: 14px 12px;
  border-radius: 20px;
  border: 1px solid transparent;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
  outline: none;
}

.spc-row:hover,
.spc-row:focus-visible,
.spc-row.is-active {
  transform: translateY(-1px);
  border-color: rgba(255, 116, 34, 0.16);
  background: linear-gradient(180deg, rgba(255, 116, 34, 0.06) 0%, rgba(255, 116, 34, 0.02) 100%);
  box-shadow: 0 16px 34px rgba(255, 116, 34, 0.08);
}

.spc-label {
  min-width: 0;
}

.spc-course {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spc-subtext {
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.spc-track-wrap {
  position: relative;
  padding: 20px 0 8px;
}

.spc-track {
  position: relative;
  height: 16px;
  border-radius: 999px;
  overflow: visible;
  background: linear-gradient(90deg, rgba(255, 116, 34, 0.08) 0%, rgba(255, 176, 128, 0.18) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 0 0 1px rgba(255, 116, 34, 0.08);
}

.spc-track::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      transparent 49.5%,
      rgba(15, 23, 42, 0.06) 49.5%,
      rgba(15, 23, 42, 0.06) 50.5%,
      transparent 50.5%,
      transparent 100%
    );
  pointer-events: none;
}

.spc-bar {
  position: relative;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--spc-brand) 0%, var(--spc-brand-light) 58%, var(--spc-brand-dark) 100%);
  box-shadow: 0 12px 26px rgba(255, 116, 34, 0.22);
  transition:
    width 720ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.spc-bar::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 100%);
}

.spc-row.is-active .spc-bar,
.spc-row:hover .spc-bar,
.spc-row:focus-visible .spc-bar {
  transform: scaleY(1.08);
  box-shadow:
    0 18px 32px rgba(255, 116, 34, 0.28),
    0 0 0 4px rgba(255, 116, 34, 0.10);
  filter: saturate(1.04);
}

.spc-value-pill {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 116, 34, 0.18);
  background: rgba(255, 255, 255, 0.98);
  color: var(--spc-brand-dark);
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
  transition:
    left 720ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 180ms ease,
    box-shadow 180ms ease;
}

.spc-row.is-active .spc-value-pill,
.spc-row:hover .spc-value-pill,
.spc-row:focus-visible .spc-value-pill {
  transform: translate(-50%, -50%) scale(1.03);
  box-shadow: 0 16px 34px rgba(255, 116, 34, 0.16);
}

.spc-tooltip {
  position: absolute;
  top: -54px;
  min-width: 172px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.96);
  color: #ffffff;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.22);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 8px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.spc-tooltip::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: rgba(15, 23, 42, 0.96);
  transform: translateX(-50%) rotate(45deg);
}

.spc-row.is-active .spc-tooltip,
.spc-row:hover .spc-tooltip,
.spc-row:focus-visible .spc-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.spc-tooltip-title {
  margin-bottom: 8px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
}

.spc-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 600;
}

.spc-tooltip-row + .spc-tooltip-row {
  margin-top: 4px;
}

.spc-tooltip-row strong {
  color: #ffffff;
  font-weight: 800;
}

.spc-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  white-space: nowrap;
}

.spc-stats strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.spc-stats span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.spc-empty {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 24px;
  border: 1px dashed rgba(255, 116, 34, 0.18);
  background: linear-gradient(180deg, rgba(255, 250, 247, 1) 0%, rgba(255, 255, 255, 1) 100%);
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 880px) {
  .spc-axis {
    display: none;
  }

  .spc-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .spc-track-wrap {
    padding-top: 8px;
  }

  .spc-stats {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .spc-tooltip {
    display: none;
  }

  .spc-value-pill {
    top: -10px;
    transform: translate(-50%, 0);
  }

  .spc-row.is-active .spc-value-pill,
  .spc-row:hover .spc-value-pill,
  .spc-row:focus-visible .spc-value-pill {
    transform: translate(-50%, 0) scale(1.03);
  }
}

@media (max-width: 560px) {
  .spc-shell {
    padding: 16px;
  }

  .spc-summary-copy {
    font-size: 18px;
  }

  .spc-kpis {
    width: 100%;
    justify-content: stretch;
  }

  .spc-chip {
    flex: 1 1 100%;
  }
}
`;

const numberFormatter = new Intl.NumberFormat("en-US");

const formatCount = (value) => numberFormatter.format(value || 0);

const formatShare = (value, total) => {
  if (!total) return "0%";
  const share = Math.round(((value || 0) / total) * 1000) / 10;
  return `${share}%`;
};

const formatAverage = (value) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

const normalizeLabel = (value) => {
  const label = typeof value === "string" ? value.trim() : value;
  return label ? `${label}` : "Unassigned";
};

export default function StudentsPerCourseChart({
  data = [],
  labelKey = "_id",
  valueKey = "count",
  brandColor = BRAND,
  brandLight = BRAND_LIGHT,
  brandDark = BRAND_DARK,
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);

    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      const frame = window.requestAnimationFrame(() => {
        setIsReady(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, [data, labelKey, valueKey]);

  const rows = (Array.isArray(data) ? data : [])
    .map((item) => ({
      label: normalizeLabel(item?.[labelKey]),
      value: Number(item?.[valueKey]) || 0,
    }))
    .sort((left, right) => right.value - left.value);

  if (!rows.length) {
    return (
      <div
        className="spc-chart"
        style={{
          "--spc-brand": brandColor,
          "--spc-brand-light": brandLight,
          "--spc-brand-dark": brandDark,
        }}
      >
        <style>{chartStyles}</style>
        <div className="spc-empty">No course distribution available.</div>
      </div>
    );
  }

  const totalStudents = rows.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...rows.map((item) => item.value), 1);
  const topCourse = rows[0];
  const averageStudents = rows.length ? totalStudents / rows.length : 0;

  return (
    <div
      className="spc-chart"
      style={{
        "--spc-brand": brandColor,
        "--spc-brand-light": brandLight,
        "--spc-brand-dark": brandDark,
      }}
    >
      <style>{chartStyles}</style>

      <div className="spc-shell">
        <div className="spc-summary">
          <div>
            <div className="spc-summary-label">Enrollment Snapshot</div>
            <div className="spc-summary-copy">{formatCount(totalStudents)} students across {rows.length} active courses</div>
            <div className="spc-summary-detail">A clean view of how enrollment is distributed so admins can spot top-performing programs at a glance.</div>
          </div>

          <div className="spc-kpis">
            <div className="spc-chip">
              <span className="spc-chip-label">Top Course</span>
              <span className="spc-chip-value">{topCourse.label}</span>
              <span className="spc-chip-meta">{formatShare(topCourse.value, totalStudents)} of total</span>
            </div>

            <div className="spc-chip">
              <span className="spc-chip-label">Total Students</span>
              <span className="spc-chip-value">{formatCount(totalStudents)}</span>
              <span className="spc-chip-meta">Live dashboard count</span>
            </div>

            <div className="spc-chip">
              <span className="spc-chip-label">Avg / Course</span>
              <span className="spc-chip-value">{formatAverage(averageStudents)}</span>
              <span className="spc-chip-meta">Students per program</span>
            </div>
          </div>
        </div>

        <div className="spc-axis" aria-hidden="true">
          <div />
          <div className="spc-axis-scale">
            <div className="spc-axis-line" />
            <span>0</span>
            <span>50%</span>
            <span>{formatCount(maxValue)}</span>
          </div>
          <div className="spc-axis-caption">scale</div>
        </div>

        <div className="spc-rows" role="list" aria-label="Students per course">
          {rows.map((item, index) => {
            const rawWidth = maxValue ? (item.value / maxValue) * 100 : 0;
            const width = item.value > 0 ? Math.max(rawWidth, 10) : 0;
            const bubbleLeft = Math.max(Math.min(rawWidth || width, 95), 10);
            const tooltipLeft = Math.max(Math.min(rawWidth || width, 84), 18);
            const shareLabel = formatShare(item.value, totalStudents);

            return (
              <div
                key={`${item.label}-${index}`}
                className={`spc-row${activeIndex === index ? " is-active" : ""}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${item.label}: ${formatCount(item.value)} students, ${shareLabel} of total`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(-1)}
              >
                <div className="spc-label">
                  <div className="spc-course">{item.label}</div>
                  <div className="spc-subtext">{shareLabel} of total enrollments</div>
                </div>

                <div className="spc-track-wrap">
                  <div className="spc-tooltip" style={{ left: `${tooltipLeft}%` }}>
                    <div className="spc-tooltip-title">{item.label}</div>
                    <div className="spc-tooltip-row">
                      <span>Students</span>
                      <strong>{formatCount(item.value)}</strong>
                    </div>
                    <div className="spc-tooltip-row">
                      <span>Share</span>
                      <strong>{shareLabel}</strong>
                    </div>
                  </div>

                  <div className="spc-track">
                    <div
                      className="spc-bar"
                      style={{
                        width: isReady ? `${width}%` : "0%",
                        transitionDelay: `${index * 70}ms`,
                      }}
                    />

                    <div
                      className="spc-value-pill"
                      style={{
                        left: isReady ? `${bubbleLeft}%` : "0%",
                        transitionDelay: `${index * 70}ms`,
                      }}
                    >
                      {formatCount(item.value)}
                    </div>
                  </div>
                </div>

                <div className="spc-stats">
                  <strong>{formatCount(item.value)}</strong>
                  <span>{shareLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
