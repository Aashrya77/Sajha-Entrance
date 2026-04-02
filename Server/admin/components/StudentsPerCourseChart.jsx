import React from "react";
import { dashboardTheme } from "../config/theme.js";

const BRAND = dashboardTheme.brand;
const BRAND_LIGHT = "#FFB080";
const BRAND_DARK = dashboardTheme.brandStrong;

const numberFormatter = new Intl.NumberFormat("en-US");

const formatCount = (value) => numberFormatter.format(value || 0);

const formatShare = (value, total) => {
  if (!total) {
    return "0%";
  }

  const share = Math.round(((value || 0) / total) * 1000) / 10;
  return `${share}%`;
};

const formatAverage = (value) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

const normalizeLabel = (value) => {
  const label = typeof value === "string" ? value.trim() : value;
  return label ? `${label}` : "Unassigned";
};

const getNiceStep = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const residual = value / magnitude;

  if (residual <= 1) {
    return 1 * magnitude;
  }

  if (residual <= 2) {
    return 2 * magnitude;
  }

  if (residual <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
};

const getAxisConfig = (maxValue, segments = 4) => {
  const step = Math.max(1, Math.ceil(getNiceStep(maxValue / segments)));
  const axisMax = Math.max(step * segments, maxValue);

  return {
    axisMax,
    ticks: Array.from({ length: segments + 1 }, (_, index) => index * step),
  };
};

export default function StudentsPerCourseChart({
  data = [],
  labelKey = "_id",
  valueKey = "count",
  brandColor = BRAND,
  brandLight = BRAND_LIGHT,
  brandDark = BRAND_DARK,
}) {
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
        <div className="spc-empty">No course distribution available.</div>
      </div>
    );
  }

  const totalStudents = rows.reduce((sum, item) => sum + item.value, 0);
  const topCourse = rows[0];
  const averageStudents = rows.length ? totalStudents / rows.length : 0;
  const maxValue = Math.max(...rows.map((item) => item.value), 1);
  const { axisMax, ticks } = getAxisConfig(maxValue);
  const courseLabel = rows.length === 1 ? "course" : "courses";

  return (
    <div
      className="spc-chart"
      style={{
        "--spc-brand": brandColor,
        "--spc-brand-light": brandLight,
        "--spc-brand-dark": brandDark,
      }}
    >
      <div className="spc-card">
        <div className="spc-header">
          <div className="spc-headline">
            <div className="spc-eyebrow">Enrollment overview</div>
            <div className="spc-headline__value">
              {formatCount(totalStudents)} students across {rows.length} {courseLabel}
            </div>
            <p className="spc-headline__meta">
              Horizontal bars keep course names readable while making the enrollment
              distribution easier to compare at a glance.
            </p>
          </div>

          <div className="spc-summary">
            <div className="spc-summary-card">
              <span className="spc-summary-card__label">Total students</span>
              <strong className="spc-summary-card__value">{formatCount(totalStudents)}</strong>
              <span className="spc-summary-card__meta">Across all active courses</span>
            </div>

            <div className="spc-summary-card">
              <span className="spc-summary-card__label">Top course</span>
              <strong className="spc-summary-card__value" title={topCourse.label}>
                {topCourse.label}
              </strong>
              <span className="spc-summary-card__meta">
                {formatShare(topCourse.value, totalStudents)} of enrollments
              </span>
            </div>

            <div className="spc-summary-card">
              <span className="spc-summary-card__label">Average per course</span>
              <strong className="spc-summary-card__value">{formatAverage(averageStudents)}</strong>
              <span className="spc-summary-card__meta">Students per program</span>
            </div>
          </div>
        </div>

        <div className="spc-axis" aria-hidden="true">
          <div className="spc-axis__label">Courses</div>
          <div className="spc-axis__scale">
            {ticks.map((tick, index) => (
              <span
                key={`${tick}-${index}`}
                className={`spc-axis__tick${
                  index === 0
                    ? " spc-axis__tick--start"
                    : index === ticks.length - 1
                      ? " spc-axis__tick--end"
                      : ""
                }`}
              >
                {formatCount(tick)}
              </span>
            ))}
          </div>
          <div className="spc-axis__value">Students</div>
        </div>

        <div className="spc-bars" role="list" aria-label="Students per course">
          {rows.map((item, index) => {
            const width = axisMax ? (item.value / axisMax) * 100 : 0;
            const shareLabel = formatShare(item.value, totalStudents);
            const rowClassName = [
              "spc-row",
              index === 0 ? "spc-row--top" : "",
              item.value <= 0 ? "spc-row--zero" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={`${item.label}-${index}`}
                className={rowClassName}
                role="listitem"
                tabIndex={0}
                title={`${item.label}: ${formatCount(item.value)} students (${shareLabel})`}
                aria-label={`${item.label}: ${formatCount(item.value)} students, ${shareLabel} of total`}
              >
                <div className="spc-row__course">
                  <div className="spc-row__name" title={item.label}>
                    {item.label}
                  </div>
                  <div className="spc-row__meta">{shareLabel} of total enrollments</div>
                </div>

                <div className="spc-row__plot">
                  <div className="spc-row__track">
                    <div
                      className="spc-row__fill"
                      style={{
                        "--spc-bar-width": `${width}%`,
                        "--spc-row-delay": `${Math.min(index * 55, 240)}ms`,
                      }}
                    />
                  </div>
                </div>

                <div className="spc-row__value">{formatCount(item.value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
