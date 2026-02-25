import React, { useState, useEffect } from "react";
import { ApiClient } from "adminjs";

const api = new ApiClient();

const COLORS = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#4895ef", "#560bad", "#b5179e"];
const STATUS_COLORS = { completed: "#06d6a0", pending: "#ffd166", failed: "#ef476f", refunded: "#118ab2", canceled: "#adb5bd" };

const cardStyle = {
  background: "#fff",
  borderRadius: 12,
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  flex: "1 1 200px",
  minWidth: 200,
};

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...cardStyle, borderLeft: `4px solid ${color}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{value != null ? value : "\u2014"}</div>
      </div>
      <div style={{ fontSize: 32, opacity: 0.25 }}>{icon}</div>
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1f2937", margin: "32px 0 16px" }}>{children}</h2>
);

const ChartCard = ({ title, children, wide }) => (
  <div style={{ ...cardStyle, flex: wide ? "1 1 100%" : "1 1 420px", minWidth: wide ? "100%" : 420, maxWidth: wide ? "100%" : 640 }}>
    <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>{text}</div>
);

const SimpleBarChart = ({ data, labelKey, valueKey, height }) => {
  if (!data || data.length === 0) return <EmptyState text="No data" />;
  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  const barWidth = Math.max(30, Math.floor((100 / data.length) * 0.6));
  const gap = Math.floor((100 / data.length) * 0.4);
  const h = height || 220;
  const chartH = h - 40;
  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${data.length * (barWidth + gap) + gap} ${h}`} style={{ overflow: "visible" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line key={frac} x1={0} y1={chartH - chartH * frac} x2={data.length * (barWidth + gap) + gap} y2={chartH - chartH * frac} stroke="#f3f4f6" strokeWidth={1} />
        ))}
        {data.map((item, i) => {
          const barH = (item[valueKey] / maxVal) * chartH;
          const x = gap + i * (barWidth + gap);
          return (
            <g key={i}>
              <rect x={x} y={chartH - barH} width={barWidth} height={barH} rx={4} fill={COLORS[i % COLORS.length]} />
              <text x={x + barWidth / 2} y={chartH - barH - 6} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600}>{item[valueKey]}</text>
              <text x={x + barWidth / 2} y={h - 4} textAnchor="middle" fontSize={10} fill="#6b7280">{item[labelKey]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SimpleDonut = ({ data, labelKey, valueKey, colorMap, size }) => {
  if (!data || data.length === 0) return <EmptyState text="No data" />;
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  if (total === 0) return <EmptyState text="No data" />;
  const r = (size || 200) / 2;
  const cx = r;
  const cy = r;
  const outerR = r - 10;
  const innerR = outerR * 0.55;
  let cumAngle = -Math.PI / 2;
  const slices = data.map((item, i) => {
    const frac = item[valueKey] / total;
    const startAngle = cumAngle;
    const endAngle = cumAngle + frac * 2 * Math.PI;
    cumAngle = endAngle;
    const largeArc = frac > 0.5 ? 1 : 0;
    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);
    const color = (colorMap && colorMap[item[labelKey]]) || COLORS[i % COLORS.length];
    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");
    return { d, color, label: item[labelKey], value: item[valueKey], pct: Math.round(frac * 100) };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={r * 2} height={r * 2}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#111827">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#6b7280">Total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: "#374151" }}>{s.label}: <b>{s.value}</b> ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimpleLineChart = ({ data, labelKey, valueKey, height }) => {
  if (!data || data.length === 0) return <EmptyState text="No data" />;
  const h = height || 220;
  const chartH = h - 40;
  const w = Math.max(data.length * 80, 400);
  const maxVal = Math.max(...data.map((d) => d[valueKey]), 1);
  const padX = 10;
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
  const points = data.map((item, i) => ({
    x: padX + i * stepX,
    y: chartH - (item[valueKey] / maxVal) * chartH,
    label: item[labelKey],
    value: item[valueKey],
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = pathD + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line key={frac} x1={0} y1={chartH - chartH * frac} x2={w} y2={chartH - chartH * frac} stroke="#f3f4f6" strokeWidth={1} />
        ))}
        <path d={areaD} fill="rgba(67,97,238,0.08)" />
        <path d={pathD} fill="none" stroke="#4361ee" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#4361ee" strokeWidth={2} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={11} fontWeight={600} fill="#374151">{p.value}</text>
            <text x={p.x} y={h - 4} textAnchor="middle" fontSize={10} fill="#6b7280">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ fontSize: 16, color: "#6b7280" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        Failed to load dashboard data. Check server logs.
      </div>
    );
  }

  const {
    counts = {},
    studentsByCourse = [],
    paymentsByStatus = [],
    registrationsTrend = [],
    resultStats = [],
    revenueTotal = 0,
    recentPayments = [],
    recentContacts = [],
    upcomingClasses = [],
  } = data;

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1280, margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Welcome back! Here is an overview of your platform.</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 20 }}>
        <StatCard label="Students" value={counts.students} icon="S" color="#4361ee" />
        <StatCard label="Paid Students" value={counts.paidStudents} icon="P" color="#06d6a0" />
        <StatCard label="Revenue" value={revenueTotal != null ? `Rs. ${revenueTotal.toLocaleString()}` : "\u2014"} icon="R" color="#f59e0b" />
        <StatCard label="Courses" value={counts.courses} icon="C" color="#8b5cf6" />
        <StatCard label="Blogs" value={counts.blogs} icon="B" color="#ec4899" />
        <StatCard label="Colleges" value={counts.colleges} icon="G" color="#14b8a6" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
        <StatCard label="Contacts" value={counts.contacts} icon="M" color="#f97316" />
        <StatCard label="Newsletter Subs" value={counts.newsletters} icon="N" color="#6366f1" />
        <StatCard label="Online Classes" value={counts.onlineClasses} icon="O" color="#0ea5e9" />
        <StatCard label="Recorded Classes" value={counts.recordedClasses} icon="V" color="#a855f7" />
        <StatCard label="Notices" value={counts.notices} icon="!" color="#ef4444" />
        <StatCard label="Exam Results" value={counts.results} icon="E" color="#10b981" />
      </div>

      <SectionTitle>Analytics</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <ChartCard title="Students by Course">
          <SimpleBarChart data={studentsByCourse} labelKey="_id" valueKey="count" height={240} />
        </ChartCard>

        <ChartCard title="Payment Status">
          <SimpleDonut data={paymentsByStatus} labelKey="_id" valueKey="count" colorMap={STATUS_COLORS} size={180} />
        </ChartCard>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
        <ChartCard title="Student Registrations (Last 6 Months)" wide>
          <SimpleLineChart data={registrationsTrend} labelKey="month" valueKey="count" height={240} />
        </ChartCard>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
        <ChartCard title="Exam Results (Pass vs Fail)">
          <SimpleDonut data={resultStats} labelKey="_id" valueKey="count" colorMap={{ Pass: "#06d6a0", Fail: "#ef476f" }} size={180} />
        </ChartCard>

        <ChartCard title="Upcoming Online Classes">
          {upcomingClasses.length > 0 ? (
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Title</th>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Course</th>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingClasses.map((cls, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 4px" }}>{cls.classTitle}</td>
                      <td style={{ padding: "8px 4px" }}>
                        <span style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{cls.course}</span>
                      </td>
                      <td style={{ padding: "8px 4px", color: "#6b7280" }}>{new Date(cls.classDateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No upcoming classes" />
          )}
        </ChartCard>
      </div>

      <SectionTitle>Recent Activity</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <ChartCard title="Recent Payments">
          {recentPayments.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Student</th>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Course</th>
                    <th style={{ textAlign: "right", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Amount</th>
                    <th style={{ textAlign: "center", padding: "8px 4px", color: "#6b7280", fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 4px", fontWeight: 500 }}>{p.studentName}</td>
                      <td style={{ padding: "8px 4px" }}>{p.courseTitle}</td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>Rs. {p.totalAmount}</td>
                      <td style={{ padding: "8px 4px", textAlign: "center" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: p.status === "completed" ? "#d1fae5" : p.status === "pending" ? "#fef3c7" : "#fee2e2",
                          color: p.status === "completed" ? "#065f46" : p.status === "pending" ? "#92400e" : "#991b1b",
                        }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No payments yet" />
          )}
        </ChartCard>

        <ChartCard title="Recent Contact Messages">
          {recentContacts.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {recentContacts.map((c, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < recentContacts.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(c.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{c.email} - {c.course}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{c.message && c.message.length > 120 ? c.message.substring(0, 120) + "..." : c.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No contact messages yet" />
          )}
        </ChartCard>
      </div>

      <div style={{ marginTop: 40, paddingBottom: 20, textAlign: "center", fontSize: 12, color: "#d1d5db" }}>
        Sajha Entrance Admin Dashboard
      </div>
    </div>
  );
};

export default Dashboard;
