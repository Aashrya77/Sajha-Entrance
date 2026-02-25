(function (React, adminjs) {
  'use strict';

  function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

  var React__default = /*#__PURE__*/_interopDefault(React);

  const api = new adminjs.ApiClient();
  const COLORS = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0", "#4895ef", "#560bad", "#b5179e"];
  const STATUS_COLORS = {
    completed: "#06d6a0",
    pending: "#ffd166",
    failed: "#ef476f",
    refunded: "#118ab2",
    canceled: "#adb5bd"
  };
  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    flex: "1 1 200px",
    minWidth: 200
  };
  const StatCard = ({
    label,
    value,
    icon,
    color
  }) => /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      ...cardStyle,
      borderLeft: `4px solid ${color}`
    }
  }, /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React__default.default.createElement("div", null, /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      fontSize: 13,
      color: "#6b7280",
      fontWeight: 500,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    }
  }, label), /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 700,
      color: "#111827"
    }
  }, value != null ? value : "\u2014")), /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      fontSize: 32,
      opacity: 0.25
    }
  }, icon)));
  const SectionTitle = ({
    children
  }) => /*#__PURE__*/React__default.default.createElement("h2", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      color: "#1f2937",
      margin: "32px 0 16px"
    }
  }, children);
  const ChartCard = ({
    title,
    children,
    wide
  }) => /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      ...cardStyle,
      flex: wide ? "1 1 100%" : "1 1 420px",
      minWidth: wide ? "100%" : 420,
      maxWidth: wide ? "100%" : 640
    }
  }, /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 16
    }
  }, title), children);
  const EmptyState = ({
    text
  }) => /*#__PURE__*/React__default.default.createElement("div", {
    style: {
      color: "#9ca3af",
      textAlign: "center",
      padding: 40
    }
  }, text);
  const SimpleBarChart = ({
    data,
    labelKey,
    valueKey,
    height
  }) => {
    if (!data || data.length === 0) return /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No data"
    });
    const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
    const barWidth = Math.max(30, Math.floor(100 / data.length * 0.6));
    const gap = Math.floor(100 / data.length * 0.4);
    const h = height || 220;
    const chartH = h - 40;
    return /*#__PURE__*/React__default.default.createElement("div", null, /*#__PURE__*/React__default.default.createElement("svg", {
      width: "100%",
      height: h,
      viewBox: `0 0 ${data.length * (barWidth + gap) + gap} ${h}`,
      style: {
        overflow: "visible"
      }
    }, [0, 0.25, 0.5, 0.75, 1].map(frac => /*#__PURE__*/React__default.default.createElement("line", {
      key: frac,
      x1: 0,
      y1: chartH - chartH * frac,
      x2: data.length * (barWidth + gap) + gap,
      y2: chartH - chartH * frac,
      stroke: "#f3f4f6",
      strokeWidth: 1
    })), data.map((item, i) => {
      const barH = item[valueKey] / maxVal * chartH;
      const x = gap + i * (barWidth + gap);
      return /*#__PURE__*/React__default.default.createElement("g", {
        key: i
      }, /*#__PURE__*/React__default.default.createElement("rect", {
        x: x,
        y: chartH - barH,
        width: barWidth,
        height: barH,
        rx: 4,
        fill: COLORS[i % COLORS.length]
      }), /*#__PURE__*/React__default.default.createElement("text", {
        x: x + barWidth / 2,
        y: chartH - barH - 6,
        textAnchor: "middle",
        fontSize: 11,
        fill: "#374151",
        fontWeight: 600
      }, item[valueKey]), /*#__PURE__*/React__default.default.createElement("text", {
        x: x + barWidth / 2,
        y: h - 4,
        textAnchor: "middle",
        fontSize: 10,
        fill: "#6b7280"
      }, item[labelKey]));
    })));
  };
  const SimpleDonut = ({
    data,
    labelKey,
    valueKey,
    colorMap,
    size
  }) => {
    if (!data || data.length === 0) return /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No data"
    });
    const total = data.reduce((s, d) => s + d[valueKey], 0);
    if (total === 0) return /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No data"
    });
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
      const color = colorMap && colorMap[item[labelKey]] || COLORS[i % COLORS.length];
      const d = [`M ${x1o} ${y1o}`, `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`, `L ${x1i} ${y1i}`, `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`, "Z"].join(" ");
      return {
        d,
        color,
        label: item[labelKey],
        value: item[valueKey],
        pct: Math.round(frac * 100)
      };
    });
    return /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React__default.default.createElement("svg", {
      width: r * 2,
      height: r * 2
    }, slices.map((s, i) => /*#__PURE__*/React__default.default.createElement("path", {
      key: i,
      d: s.d,
      fill: s.color
    })), /*#__PURE__*/React__default.default.createElement("text", {
      x: cx,
      y: cy - 6,
      textAnchor: "middle",
      fontSize: 22,
      fontWeight: 700,
      fill: "#111827"
    }, total), /*#__PURE__*/React__default.default.createElement("text", {
      x: cx,
      y: cy + 14,
      textAnchor: "middle",
      fontSize: 11,
      fill: "#6b7280"
    }, "Total")), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, slices.map((s, i) => /*#__PURE__*/React__default.default.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13
      }
    }, /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 3,
        background: s.color,
        flexShrink: 0
      }
    }), /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        color: "#374151"
      }
    }, s.label, ": ", /*#__PURE__*/React__default.default.createElement("b", null, s.value), " (", s.pct, "%)")))));
  };
  const SimpleLineChart = ({
    data,
    labelKey,
    valueKey,
    height
  }) => {
    if (!data || data.length === 0) return /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No data"
    });
    const h = height || 220;
    const chartH = h - 40;
    const w = Math.max(data.length * 80, 400);
    const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
    const padX = 10;
    const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
    const points = data.map((item, i) => ({
      x: padX + i * stepX,
      y: chartH - item[valueKey] / maxVal * chartH,
      label: item[labelKey],
      value: item[valueKey]
    }));
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = pathD + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;
    return /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        overflowX: "auto"
      }
    }, /*#__PURE__*/React__default.default.createElement("svg", {
      width: w,
      height: h,
      style: {
        display: "block"
      }
    }, [0, 0.25, 0.5, 0.75, 1].map(frac => /*#__PURE__*/React__default.default.createElement("line", {
      key: frac,
      x1: 0,
      y1: chartH - chartH * frac,
      x2: w,
      y2: chartH - chartH * frac,
      stroke: "#f3f4f6",
      strokeWidth: 1
    })), /*#__PURE__*/React__default.default.createElement("path", {
      d: areaD,
      fill: "rgba(67,97,238,0.08)"
    }), /*#__PURE__*/React__default.default.createElement("path", {
      d: pathD,
      fill: "none",
      stroke: "#4361ee",
      strokeWidth: 2.5,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), points.map((p, i) => /*#__PURE__*/React__default.default.createElement("g", {
      key: i
    }, /*#__PURE__*/React__default.default.createElement("circle", {
      cx: p.x,
      cy: p.y,
      r: 4,
      fill: "#fff",
      stroke: "#4361ee",
      strokeWidth: 2
    }), /*#__PURE__*/React__default.default.createElement("text", {
      x: p.x,
      y: p.y - 10,
      textAnchor: "middle",
      fontSize: 11,
      fontWeight: 600,
      fill: "#374151"
    }, p.value), /*#__PURE__*/React__default.default.createElement("text", {
      x: p.x,
      y: h - 4,
      textAnchor: "middle",
      fontSize: 10,
      fill: "#6b7280"
    }, p.label)))));
  };
  const Dashboard = () => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
      api.getDashboard().then(res => {
        setData(res.data);
      }).catch(err => console.error("Dashboard fetch error:", err)).finally(() => setLoading(false));
    }, []);
    if (loading) {
      return /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh"
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          fontSize: 16,
          color: "#6b7280"
        }
      }, "Loading dashboard..."));
    }
    if (!data) {
      return /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          padding: 40,
          textAlign: "center",
          color: "#ef4444"
        }
      }, "Failed to load dashboard data. Check server logs.");
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
      upcomingClasses = []
    } = data;
    return /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        padding: "24px 32px",
        maxWidth: 1280,
        margin: "0 auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }
    }, /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React__default.default.createElement("h1", {
      style: {
        fontSize: 26,
        fontWeight: 700,
        color: "#111827",
        margin: 0
      }
    }, "Dashboard"), /*#__PURE__*/React__default.default.createElement("p", {
      style: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4
      }
    }, "Welcome back! Here is an overview of your platform.")), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 20
      }
    }, /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Students",
      value: counts.students,
      icon: "S",
      color: "#4361ee"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Paid Students",
      value: counts.paidStudents,
      icon: "P",
      color: "#06d6a0"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Revenue",
      value: revenueTotal != null ? `Rs. ${revenueTotal.toLocaleString()}` : "\u2014",
      icon: "R",
      color: "#f59e0b"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Courses",
      value: counts.courses,
      icon: "C",
      color: "#8b5cf6"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Blogs",
      value: counts.blogs,
      icon: "B",
      color: "#ec4899"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Colleges",
      value: counts.colleges,
      icon: "G",
      color: "#14b8a6"
    })), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 16
      }
    }, /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Contacts",
      value: counts.contacts,
      icon: "M",
      color: "#f97316"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Newsletter Subs",
      value: counts.newsletters,
      icon: "N",
      color: "#6366f1"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Online Classes",
      value: counts.onlineClasses,
      icon: "O",
      color: "#0ea5e9"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Recorded Classes",
      value: counts.recordedClasses,
      icon: "V",
      color: "#a855f7"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Notices",
      value: counts.notices,
      icon: "!",
      color: "#ef4444"
    }), /*#__PURE__*/React__default.default.createElement(StatCard, {
      label: "Exam Results",
      value: counts.results,
      icon: "E",
      color: "#10b981"
    })), /*#__PURE__*/React__default.default.createElement(SectionTitle, null, "Analytics"), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16
      }
    }, /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Students by Course"
    }, /*#__PURE__*/React__default.default.createElement(SimpleBarChart, {
      data: studentsByCourse,
      labelKey: "_id",
      valueKey: "count",
      height: 240
    })), /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Payment Status"
    }, /*#__PURE__*/React__default.default.createElement(SimpleDonut, {
      data: paymentsByStatus,
      labelKey: "_id",
      valueKey: "count",
      colorMap: STATUS_COLORS,
      size: 180
    }))), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 16
      }
    }, /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Student Registrations (Last 6 Months)",
      wide: true
    }, /*#__PURE__*/React__default.default.createElement(SimpleLineChart, {
      data: registrationsTrend,
      labelKey: "month",
      valueKey: "count",
      height: 240
    }))), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 16
      }
    }, /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Exam Results (Pass vs Fail)"
    }, /*#__PURE__*/React__default.default.createElement(SimpleDonut, {
      data: resultStats,
      labelKey: "_id",
      valueKey: "count",
      colorMap: {
        Pass: "#06d6a0",
        Fail: "#ef476f"
      },
      size: 180
    })), /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Upcoming Online Classes"
    }, upcomingClasses.length > 0 ? /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        maxHeight: 260,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React__default.default.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13
      }
    }, /*#__PURE__*/React__default.default.createElement("thead", null, /*#__PURE__*/React__default.default.createElement("tr", {
      style: {
        borderBottom: "2px solid #e5e7eb"
      }
    }, /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "left",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Title"), /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "left",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Course"), /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "left",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Date"))), /*#__PURE__*/React__default.default.createElement("tbody", null, upcomingClasses.map((cls, i) => /*#__PURE__*/React__default.default.createElement("tr", {
      key: i,
      style: {
        borderBottom: "1px solid #f3f4f6"
      }
    }, /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px"
      }
    }, cls.classTitle), /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px"
      }
    }, /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        background: "#ede9fe",
        color: "#7c3aed",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600
      }
    }, cls.course)), /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px",
        color: "#6b7280"
      }
    }, new Date(cls.classDateTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }))))))) : /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No upcoming classes"
    }))), /*#__PURE__*/React__default.default.createElement(SectionTitle, null, "Recent Activity"), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16
      }
    }, /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Recent Payments"
    }, recentPayments.length > 0 ? /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        maxHeight: 300,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React__default.default.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13
      }
    }, /*#__PURE__*/React__default.default.createElement("thead", null, /*#__PURE__*/React__default.default.createElement("tr", {
      style: {
        borderBottom: "2px solid #e5e7eb"
      }
    }, /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "left",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Student"), /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "left",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Course"), /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "right",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Amount"), /*#__PURE__*/React__default.default.createElement("th", {
      style: {
        textAlign: "center",
        padding: "8px 4px",
        color: "#6b7280",
        fontWeight: 600
      }
    }, "Status"))), /*#__PURE__*/React__default.default.createElement("tbody", null, recentPayments.map((p, i) => /*#__PURE__*/React__default.default.createElement("tr", {
      key: i,
      style: {
        borderBottom: "1px solid #f3f4f6"
      }
    }, /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px",
        fontWeight: 500
      }
    }, p.studentName), /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px"
      }
    }, p.courseTitle), /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px",
        textAlign: "right"
      }
    }, "Rs. ", p.totalAmount), /*#__PURE__*/React__default.default.createElement("td", {
      style: {
        padding: "8px 4px",
        textAlign: "center"
      }
    }, /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: p.status === "completed" ? "#d1fae5" : p.status === "pending" ? "#fef3c7" : "#fee2e2",
        color: p.status === "completed" ? "#065f46" : p.status === "pending" ? "#92400e" : "#991b1b"
      }
    }, p.status))))))) : /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No payments yet"
    })), /*#__PURE__*/React__default.default.createElement(ChartCard, {
      title: "Recent Contact Messages"
    }, recentContacts.length > 0 ? /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        maxHeight: 300,
        overflowY: "auto"
      }
    }, recentContacts.map((c, i) => /*#__PURE__*/React__default.default.createElement("div", {
      key: i,
      style: {
        padding: "12px 0",
        borderBottom: i < recentContacts.length - 1 ? "1px solid #f3f4f6" : "none"
      }
    }, /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
      }
    }, /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        fontWeight: 600,
        fontSize: 13,
        color: "#111827"
      }
    }, c.name), /*#__PURE__*/React__default.default.createElement("span", {
      style: {
        fontSize: 11,
        color: "#9ca3af"
      }
    }, new Date(c.submittedAt).toLocaleDateString())), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 2
      }
    }, c.email, " - ", c.course), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        fontSize: 13,
        color: "#374151",
        lineHeight: 1.4
      }
    }, c.message && c.message.length > 120 ? c.message.substring(0, 120) + "..." : c.message)))) : /*#__PURE__*/React__default.default.createElement(EmptyState, {
      text: "No contact messages yet"
    }))), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        marginTop: 40,
        paddingBottom: 20,
        textAlign: "center",
        fontSize: 12,
        color: "#d1d5db"
      }
    }, "Sajha Entrance Admin Dashboard"));
  };

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.Dashboard = Dashboard;

})(React, AdminJS);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9hZG1pbi9jb21wb25lbnRzL0Rhc2hib2FyZC5qc3giLCJlbnRyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0IHsgQXBpQ2xpZW50IH0gZnJvbSBcImFkbWluanNcIjtcblxuY29uc3QgYXBpID0gbmV3IEFwaUNsaWVudCgpO1xuXG5jb25zdCBDT0xPUlMgPSBbXCIjNDM2MWVlXCIsIFwiIzNhMGNhM1wiLCBcIiM3MjA5YjdcIiwgXCIjZjcyNTg1XCIsIFwiIzRjYzlmMFwiLCBcIiM0ODk1ZWZcIiwgXCIjNTYwYmFkXCIsIFwiI2I1MTc5ZVwiXTtcbmNvbnN0IFNUQVRVU19DT0xPUlMgPSB7IGNvbXBsZXRlZDogXCIjMDZkNmEwXCIsIHBlbmRpbmc6IFwiI2ZmZDE2NlwiLCBmYWlsZWQ6IFwiI2VmNDc2ZlwiLCByZWZ1bmRlZDogXCIjMTE4YWIyXCIsIGNhbmNlbGVkOiBcIiNhZGI1YmRcIiB9O1xuXG5jb25zdCBjYXJkU3R5bGUgPSB7XG4gIGJhY2tncm91bmQ6IFwiI2ZmZlwiLFxuICBib3JkZXJSYWRpdXM6IDEyLFxuICBwYWRkaW5nOiBcIjI0cHhcIixcbiAgYm94U2hhZG93OiBcIjAgMXB4IDNweCByZ2JhKDAsMCwwLDAuMDgpLCAwIDFweCAycHggcmdiYSgwLDAsMCwwLjA2KVwiLFxuICBmbGV4OiBcIjEgMSAyMDBweFwiLFxuICBtaW5XaWR0aDogMjAwLFxufTtcblxuY29uc3QgU3RhdENhcmQgPSAoeyBsYWJlbCwgdmFsdWUsIGljb24sIGNvbG9yIH0pID0+IChcbiAgPGRpdiBzdHlsZT17eyAuLi5jYXJkU3R5bGUsIGJvcmRlckxlZnQ6IGA0cHggc29saWQgJHtjb2xvcn1gIH19PlxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogXCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OiBcInNwYWNlLWJldHdlZW5cIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiB9fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFNpemU6IDEzLCBjb2xvcjogXCIjNmI3MjgwXCIsIGZvbnRXZWlnaHQ6IDUwMCwgbWFyZ2luQm90dG9tOiA0LCB0ZXh0VHJhbnNmb3JtOiBcInVwcGVyY2FzZVwiLCBsZXR0ZXJTcGFjaW5nOiBcIjAuMDVlbVwiIH19PntsYWJlbH08L2Rpdj5cbiAgICAgICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogMjgsIGZvbnRXZWlnaHQ6IDcwMCwgY29sb3I6IFwiIzExMTgyN1wiIH19Pnt2YWx1ZSAhPSBudWxsID8gdmFsdWUgOiBcIlxcdTIwMTRcIn08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogMzIsIG9wYWNpdHk6IDAuMjUgfX0+e2ljb259PC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuKTtcblxuY29uc3QgU2VjdGlvblRpdGxlID0gKHsgY2hpbGRyZW4gfSkgPT4gKFxuICA8aDIgc3R5bGU9e3sgZm9udFNpemU6IDE4LCBmb250V2VpZ2h0OiA2MDAsIGNvbG9yOiBcIiMxZjI5MzdcIiwgbWFyZ2luOiBcIjMycHggMCAxNnB4XCIgfX0+e2NoaWxkcmVufTwvaDI+XG4pO1xuXG5jb25zdCBDaGFydENhcmQgPSAoeyB0aXRsZSwgY2hpbGRyZW4sIHdpZGUgfSkgPT4gKFxuICA8ZGl2IHN0eWxlPXt7IC4uLmNhcmRTdHlsZSwgZmxleDogd2lkZSA/IFwiMSAxIDEwMCVcIiA6IFwiMSAxIDQyMHB4XCIsIG1pbldpZHRoOiB3aWRlID8gXCIxMDAlXCIgOiA0MjAsIG1heFdpZHRoOiB3aWRlID8gXCIxMDAlXCIgOiA2NDAgfX0+XG4gICAgPGRpdiBzdHlsZT17eyBmb250U2l6ZTogMTUsIGZvbnRXZWlnaHQ6IDYwMCwgY29sb3I6IFwiIzM3NDE1MVwiLCBtYXJnaW5Cb3R0b206IDE2IH19Pnt0aXRsZX08L2Rpdj5cbiAgICB7Y2hpbGRyZW59XG4gIDwvZGl2PlxuKTtcblxuY29uc3QgRW1wdHlTdGF0ZSA9ICh7IHRleHQgfSkgPT4gKFxuICA8ZGl2IHN0eWxlPXt7IGNvbG9yOiBcIiM5Y2EzYWZcIiwgdGV4dEFsaWduOiBcImNlbnRlclwiLCBwYWRkaW5nOiA0MCB9fT57dGV4dH08L2Rpdj5cbik7XG5cbmNvbnN0IFNpbXBsZUJhckNoYXJ0ID0gKHsgZGF0YSwgbGFiZWxLZXksIHZhbHVlS2V5LCBoZWlnaHQgfSkgPT4ge1xuICBpZiAoIWRhdGEgfHwgZGF0YS5sZW5ndGggPT09IDApIHJldHVybiA8RW1wdHlTdGF0ZSB0ZXh0PVwiTm8gZGF0YVwiIC8+O1xuICBjb25zdCBtYXhWYWwgPSBNYXRoLm1heCguLi5kYXRhLm1hcCgoZCkgPT4gZFt2YWx1ZUtleV0pLCAxKTtcbiAgY29uc3QgYmFyV2lkdGggPSBNYXRoLm1heCgzMCwgTWF0aC5mbG9vcigoMTAwIC8gZGF0YS5sZW5ndGgpICogMC42KSk7XG4gIGNvbnN0IGdhcCA9IE1hdGguZmxvb3IoKDEwMCAvIGRhdGEubGVuZ3RoKSAqIDAuNCk7XG4gIGNvbnN0IGggPSBoZWlnaHQgfHwgMjIwO1xuICBjb25zdCBjaGFydEggPSBoIC0gNDA7XG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxzdmcgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXtofSB2aWV3Qm94PXtgMCAwICR7ZGF0YS5sZW5ndGggKiAoYmFyV2lkdGggKyBnYXApICsgZ2FwfSAke2h9YH0gc3R5bGU9e3sgb3ZlcmZsb3c6IFwidmlzaWJsZVwiIH19PlxuICAgICAgICB7WzAsIDAuMjUsIDAuNSwgMC43NSwgMV0ubWFwKChmcmFjKSA9PiAoXG4gICAgICAgICAgPGxpbmUga2V5PXtmcmFjfSB4MT17MH0geTE9e2NoYXJ0SCAtIGNoYXJ0SCAqIGZyYWN9IHgyPXtkYXRhLmxlbmd0aCAqIChiYXJXaWR0aCArIGdhcCkgKyBnYXB9IHkyPXtjaGFydEggLSBjaGFydEggKiBmcmFjfSBzdHJva2U9XCIjZjNmNGY2XCIgc3Ryb2tlV2lkdGg9ezF9IC8+XG4gICAgICAgICkpfVxuICAgICAgICB7ZGF0YS5tYXAoKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICBjb25zdCBiYXJIID0gKGl0ZW1bdmFsdWVLZXldIC8gbWF4VmFsKSAqIGNoYXJ0SDtcbiAgICAgICAgICBjb25zdCB4ID0gZ2FwICsgaSAqIChiYXJXaWR0aCArIGdhcCk7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxnIGtleT17aX0+XG4gICAgICAgICAgICAgIDxyZWN0IHg9e3h9IHk9e2NoYXJ0SCAtIGJhckh9IHdpZHRoPXtiYXJXaWR0aH0gaGVpZ2h0PXtiYXJIfSByeD17NH0gZmlsbD17Q09MT1JTW2kgJSBDT0xPUlMubGVuZ3RoXX0gLz5cbiAgICAgICAgICAgICAgPHRleHQgeD17eCArIGJhcldpZHRoIC8gMn0geT17Y2hhcnRIIC0gYmFySCAtIDZ9IHRleHRBbmNob3I9XCJtaWRkbGVcIiBmb250U2l6ZT17MTF9IGZpbGw9XCIjMzc0MTUxXCIgZm9udFdlaWdodD17NjAwfT57aXRlbVt2YWx1ZUtleV19PC90ZXh0PlxuICAgICAgICAgICAgICA8dGV4dCB4PXt4ICsgYmFyV2lkdGggLyAyfSB5PXtoIC0gNH0gdGV4dEFuY2hvcj1cIm1pZGRsZVwiIGZvbnRTaXplPXsxMH0gZmlsbD1cIiM2YjcyODBcIj57aXRlbVtsYWJlbEtleV19PC90ZXh0PlxuICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICk7XG4gICAgICAgIH0pfVxuICAgICAgPC9zdmc+XG4gICAgPC9kaXY+XG4gICk7XG59O1xuXG5jb25zdCBTaW1wbGVEb251dCA9ICh7IGRhdGEsIGxhYmVsS2V5LCB2YWx1ZUtleSwgY29sb3JNYXAsIHNpemUgfSkgPT4ge1xuICBpZiAoIWRhdGEgfHwgZGF0YS5sZW5ndGggPT09IDApIHJldHVybiA8RW1wdHlTdGF0ZSB0ZXh0PVwiTm8gZGF0YVwiIC8+O1xuICBjb25zdCB0b3RhbCA9IGRhdGEucmVkdWNlKChzLCBkKSA9PiBzICsgZFt2YWx1ZUtleV0sIDApO1xuICBpZiAodG90YWwgPT09IDApIHJldHVybiA8RW1wdHlTdGF0ZSB0ZXh0PVwiTm8gZGF0YVwiIC8+O1xuICBjb25zdCByID0gKHNpemUgfHwgMjAwKSAvIDI7XG4gIGNvbnN0IGN4ID0gcjtcbiAgY29uc3QgY3kgPSByO1xuICBjb25zdCBvdXRlclIgPSByIC0gMTA7XG4gIGNvbnN0IGlubmVyUiA9IG91dGVyUiAqIDAuNTU7XG4gIGxldCBjdW1BbmdsZSA9IC1NYXRoLlBJIC8gMjtcbiAgY29uc3Qgc2xpY2VzID0gZGF0YS5tYXAoKGl0ZW0sIGkpID0+IHtcbiAgICBjb25zdCBmcmFjID0gaXRlbVt2YWx1ZUtleV0gLyB0b3RhbDtcbiAgICBjb25zdCBzdGFydEFuZ2xlID0gY3VtQW5nbGU7XG4gICAgY29uc3QgZW5kQW5nbGUgPSBjdW1BbmdsZSArIGZyYWMgKiAyICogTWF0aC5QSTtcbiAgICBjdW1BbmdsZSA9IGVuZEFuZ2xlO1xuICAgIGNvbnN0IGxhcmdlQXJjID0gZnJhYyA+IDAuNSA/IDEgOiAwO1xuICAgIGNvbnN0IHgxbyA9IGN4ICsgb3V0ZXJSICogTWF0aC5jb3Moc3RhcnRBbmdsZSk7XG4gICAgY29uc3QgeTFvID0gY3kgKyBvdXRlclIgKiBNYXRoLnNpbihzdGFydEFuZ2xlKTtcbiAgICBjb25zdCB4Mm8gPSBjeCArIG91dGVyUiAqIE1hdGguY29zKGVuZEFuZ2xlKTtcbiAgICBjb25zdCB5Mm8gPSBjeSArIG91dGVyUiAqIE1hdGguc2luKGVuZEFuZ2xlKTtcbiAgICBjb25zdCB4MWkgPSBjeCArIGlubmVyUiAqIE1hdGguY29zKGVuZEFuZ2xlKTtcbiAgICBjb25zdCB5MWkgPSBjeSArIGlubmVyUiAqIE1hdGguc2luKGVuZEFuZ2xlKTtcbiAgICBjb25zdCB4MmkgPSBjeCArIGlubmVyUiAqIE1hdGguY29zKHN0YXJ0QW5nbGUpO1xuICAgIGNvbnN0IHkyaSA9IGN5ICsgaW5uZXJSICogTWF0aC5zaW4oc3RhcnRBbmdsZSk7XG4gICAgY29uc3QgY29sb3IgPSAoY29sb3JNYXAgJiYgY29sb3JNYXBbaXRlbVtsYWJlbEtleV1dKSB8fCBDT0xPUlNbaSAlIENPTE9SUy5sZW5ndGhdO1xuICAgIGNvbnN0IGQgPSBbXG4gICAgICBgTSAke3gxb30gJHt5MW99YCxcbiAgICAgIGBBICR7b3V0ZXJSfSAke291dGVyUn0gMCAke2xhcmdlQXJjfSAxICR7eDJvfSAke3kyb31gLFxuICAgICAgYEwgJHt4MWl9ICR7eTFpfWAsXG4gICAgICBgQSAke2lubmVyUn0gJHtpbm5lclJ9IDAgJHtsYXJnZUFyY30gMCAke3gyaX0gJHt5Mml9YCxcbiAgICAgIFwiWlwiLFxuICAgIF0uam9pbihcIiBcIik7XG4gICAgcmV0dXJuIHsgZCwgY29sb3IsIGxhYmVsOiBpdGVtW2xhYmVsS2V5XSwgdmFsdWU6IGl0ZW1bdmFsdWVLZXldLCBwY3Q6IE1hdGgucm91bmQoZnJhYyAqIDEwMCkgfTtcbiAgfSk7XG4gIHJldHVybiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgZ2FwOiAyNCwgZmxleFdyYXA6IFwid3JhcFwiIH19PlxuICAgICAgPHN2ZyB3aWR0aD17ciAqIDJ9IGhlaWdodD17ciAqIDJ9PlxuICAgICAgICB7c2xpY2VzLm1hcCgocywgaSkgPT4gKFxuICAgICAgICAgIDxwYXRoIGtleT17aX0gZD17cy5kfSBmaWxsPXtzLmNvbG9yfSAvPlxuICAgICAgICApKX1cbiAgICAgICAgPHRleHQgeD17Y3h9IHk9e2N5IC0gNn0gdGV4dEFuY2hvcj1cIm1pZGRsZVwiIGZvbnRTaXplPXsyMn0gZm9udFdlaWdodD17NzAwfSBmaWxsPVwiIzExMTgyN1wiPnt0b3RhbH08L3RleHQ+XG4gICAgICAgIDx0ZXh0IHg9e2N4fSB5PXtjeSArIDE0fSB0ZXh0QW5jaG9yPVwibWlkZGxlXCIgZm9udFNpemU9ezExfSBmaWxsPVwiIzZiNzI4MFwiPlRvdGFsPC90ZXh0PlxuICAgICAgPC9zdmc+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4RGlyZWN0aW9uOiBcImNvbHVtblwiLCBnYXA6IDYgfX0+XG4gICAgICAgIHtzbGljZXMubWFwKChzLCBpKSA9PiAoXG4gICAgICAgICAgPGRpdiBrZXk9e2l9IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBnYXA6IDgsIGZvbnRTaXplOiAxMyB9fT5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgd2lkdGg6IDEyLCBoZWlnaHQ6IDEyLCBib3JkZXJSYWRpdXM6IDMsIGJhY2tncm91bmQ6IHMuY29sb3IsIGZsZXhTaHJpbms6IDAgfX0gLz5cbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGNvbG9yOiBcIiMzNzQxNTFcIiB9fT57cy5sYWJlbH06IDxiPntzLnZhbHVlfTwvYj4gKHtzLnBjdH0lKTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IFNpbXBsZUxpbmVDaGFydCA9ICh7IGRhdGEsIGxhYmVsS2V5LCB2YWx1ZUtleSwgaGVpZ2h0IH0pID0+IHtcbiAgaWYgKCFkYXRhIHx8IGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gPEVtcHR5U3RhdGUgdGV4dD1cIk5vIGRhdGFcIiAvPjtcbiAgY29uc3QgaCA9IGhlaWdodCB8fCAyMjA7XG4gIGNvbnN0IGNoYXJ0SCA9IGggLSA0MDtcbiAgY29uc3QgdyA9IE1hdGgubWF4KGRhdGEubGVuZ3RoICogODAsIDQwMCk7XG4gIGNvbnN0IG1heFZhbCA9IE1hdGgubWF4KC4uLmRhdGEubWFwKChkKSA9PiBkW3ZhbHVlS2V5XSksIDEpO1xuICBjb25zdCBwYWRYID0gMTA7XG4gIGNvbnN0IHN0ZXBYID0gKHcgLSBwYWRYICogMikgLyBNYXRoLm1heChkYXRhLmxlbmd0aCAtIDEsIDEpO1xuICBjb25zdCBwb2ludHMgPSBkYXRhLm1hcCgoaXRlbSwgaSkgPT4gKHtcbiAgICB4OiBwYWRYICsgaSAqIHN0ZXBYLFxuICAgIHk6IGNoYXJ0SCAtIChpdGVtW3ZhbHVlS2V5XSAvIG1heFZhbCkgKiBjaGFydEgsXG4gICAgbGFiZWw6IGl0ZW1bbGFiZWxLZXldLFxuICAgIHZhbHVlOiBpdGVtW3ZhbHVlS2V5XSxcbiAgfSkpO1xuICBjb25zdCBwYXRoRCA9IHBvaW50cy5tYXAoKHAsIGkpID0+IGAke2kgPT09IDAgPyBcIk1cIiA6IFwiTFwifSAke3AueH0gJHtwLnl9YCkuam9pbihcIiBcIik7XG4gIGNvbnN0IGFyZWFEID0gcGF0aEQgKyBgIEwgJHtwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdLnh9ICR7Y2hhcnRIfSBMICR7cG9pbnRzWzBdLnh9ICR7Y2hhcnRIfSBaYDtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93WDogXCJhdXRvXCIgfX0+XG4gICAgICA8c3ZnIHdpZHRoPXt3fSBoZWlnaHQ9e2h9IHN0eWxlPXt7IGRpc3BsYXk6IFwiYmxvY2tcIiB9fT5cbiAgICAgICAge1swLCAwLjI1LCAwLjUsIDAuNzUsIDFdLm1hcCgoZnJhYykgPT4gKFxuICAgICAgICAgIDxsaW5lIGtleT17ZnJhY30geDE9ezB9IHkxPXtjaGFydEggLSBjaGFydEggKiBmcmFjfSB4Mj17d30geTI9e2NoYXJ0SCAtIGNoYXJ0SCAqIGZyYWN9IHN0cm9rZT1cIiNmM2Y0ZjZcIiBzdHJva2VXaWR0aD17MX0gLz5cbiAgICAgICAgKSl9XG4gICAgICAgIDxwYXRoIGQ9e2FyZWFEfSBmaWxsPVwicmdiYSg2Nyw5NywyMzgsMC4wOClcIiAvPlxuICAgICAgICA8cGF0aCBkPXtwYXRoRH0gZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIjNDM2MWVlXCIgc3Ryb2tlV2lkdGg9ezIuNX0gc3Ryb2tlTGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZUxpbmVjYXA9XCJyb3VuZFwiIC8+XG4gICAgICAgIHtwb2ludHMubWFwKChwLCBpKSA9PiAoXG4gICAgICAgICAgPGcga2V5PXtpfT5cbiAgICAgICAgICAgIDxjaXJjbGUgY3g9e3AueH0gY3k9e3AueX0gcj17NH0gZmlsbD1cIiNmZmZcIiBzdHJva2U9XCIjNDM2MWVlXCIgc3Ryb2tlV2lkdGg9ezJ9IC8+XG4gICAgICAgICAgICA8dGV4dCB4PXtwLnh9IHk9e3AueSAtIDEwfSB0ZXh0QW5jaG9yPVwibWlkZGxlXCIgZm9udFNpemU9ezExfSBmb250V2VpZ2h0PXs2MDB9IGZpbGw9XCIjMzc0MTUxXCI+e3AudmFsdWV9PC90ZXh0PlxuICAgICAgICAgICAgPHRleHQgeD17cC54fSB5PXtoIC0gNH0gdGV4dEFuY2hvcj1cIm1pZGRsZVwiIGZvbnRTaXplPXsxMH0gZmlsbD1cIiM2YjcyODBcIj57cC5sYWJlbH08L3RleHQ+XG4gICAgICAgICAgPC9nPlxuICAgICAgICApKX1cbiAgICAgIDwvc3ZnPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuY29uc3QgRGFzaGJvYXJkID0gKCkgPT4ge1xuICBjb25zdCBbZGF0YSwgc2V0RGF0YV0gPSB1c2VTdGF0ZShudWxsKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhcGlcbiAgICAgIC5nZXREYXNoYm9hcmQoKVxuICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICBzZXREYXRhKHJlcy5kYXRhKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcihcIkRhc2hib2FyZCBmZXRjaCBlcnJvcjpcIiwgZXJyKSlcbiAgICAgIC5maW5hbGx5KCgpID0+IHNldExvYWRpbmcoZmFsc2UpKTtcbiAgfSwgW10pO1xuXG4gIGlmIChsb2FkaW5nKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogXCJmbGV4XCIsIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBoZWlnaHQ6IFwiNjB2aFwiIH19PlxuICAgICAgICA8ZGl2IHN0eWxlPXt7IGZvbnRTaXplOiAxNiwgY29sb3I6IFwiIzZiNzI4MFwiIH19PkxvYWRpbmcgZGFzaGJvYXJkLi4uPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgaWYgKCFkYXRhKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgc3R5bGU9e3sgcGFkZGluZzogNDAsIHRleHRBbGlnbjogXCJjZW50ZXJcIiwgY29sb3I6IFwiI2VmNDQ0NFwiIH19PlxuICAgICAgICBGYWlsZWQgdG8gbG9hZCBkYXNoYm9hcmQgZGF0YS4gQ2hlY2sgc2VydmVyIGxvZ3MuXG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIGNvdW50cyA9IHt9LFxuICAgIHN0dWRlbnRzQnlDb3Vyc2UgPSBbXSxcbiAgICBwYXltZW50c0J5U3RhdHVzID0gW10sXG4gICAgcmVnaXN0cmF0aW9uc1RyZW5kID0gW10sXG4gICAgcmVzdWx0U3RhdHMgPSBbXSxcbiAgICByZXZlbnVlVG90YWwgPSAwLFxuICAgIHJlY2VudFBheW1lbnRzID0gW10sXG4gICAgcmVjZW50Q29udGFjdHMgPSBbXSxcbiAgICB1cGNvbWluZ0NsYXNzZXMgPSBbXSxcbiAgfSA9IGRhdGE7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6IFwiMjRweCAzMnB4XCIsIG1heFdpZHRoOiAxMjgwLCBtYXJnaW46IFwiMCBhdXRvXCIsIGZvbnRGYW1pbHk6IFwiLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBSb2JvdG8sIHNhbnMtc2VyaWZcIiB9fT5cbiAgICAgIDxkaXYgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiA4IH19PlxuICAgICAgICA8aDEgc3R5bGU9e3sgZm9udFNpemU6IDI2LCBmb250V2VpZ2h0OiA3MDAsIGNvbG9yOiBcIiMxMTE4MjdcIiwgbWFyZ2luOiAwIH19PkRhc2hib2FyZDwvaDE+XG4gICAgICAgIDxwIHN0eWxlPXt7IGZvbnRTaXplOiAxNCwgY29sb3I6IFwiIzZiNzI4MFwiLCBtYXJnaW5Ub3A6IDQgfX0+V2VsY29tZSBiYWNrISBIZXJlIGlzIGFuIG92ZXJ2aWV3IG9mIHlvdXIgcGxhdGZvcm0uPC9wPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogXCJmbGV4XCIsIGZsZXhXcmFwOiBcIndyYXBcIiwgZ2FwOiAxNiwgbWFyZ2luVG9wOiAyMCB9fT5cbiAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwiU3R1ZGVudHNcIiB2YWx1ZT17Y291bnRzLnN0dWRlbnRzfSBpY29uPVwiU1wiIGNvbG9yPVwiIzQzNjFlZVwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIlBhaWQgU3R1ZGVudHNcIiB2YWx1ZT17Y291bnRzLnBhaWRTdHVkZW50c30gaWNvbj1cIlBcIiBjb2xvcj1cIiMwNmQ2YTBcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJSZXZlbnVlXCIgdmFsdWU9e3JldmVudWVUb3RhbCAhPSBudWxsID8gYFJzLiAke3JldmVudWVUb3RhbC50b0xvY2FsZVN0cmluZygpfWAgOiBcIlxcdTIwMTRcIn0gaWNvbj1cIlJcIiBjb2xvcj1cIiNmNTllMGJcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJDb3Vyc2VzXCIgdmFsdWU9e2NvdW50cy5jb3Vyc2VzfSBpY29uPVwiQ1wiIGNvbG9yPVwiIzhiNWNmNlwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIkJsb2dzXCIgdmFsdWU9e2NvdW50cy5ibG9nc30gaWNvbj1cIkJcIiBjb2xvcj1cIiNlYzQ4OTlcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJDb2xsZWdlc1wiIHZhbHVlPXtjb3VudHMuY29sbGVnZXN9IGljb249XCJHXCIgY29sb3I9XCIjMTRiOGE2XCIgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4V3JhcDogXCJ3cmFwXCIsIGdhcDogMTYsIG1hcmdpblRvcDogMTYgfX0+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIkNvbnRhY3RzXCIgdmFsdWU9e2NvdW50cy5jb250YWN0c30gaWNvbj1cIk1cIiBjb2xvcj1cIiNmOTczMTZcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJOZXdzbGV0dGVyIFN1YnNcIiB2YWx1ZT17Y291bnRzLm5ld3NsZXR0ZXJzfSBpY29uPVwiTlwiIGNvbG9yPVwiIzYzNjZmMVwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIk9ubGluZSBDbGFzc2VzXCIgdmFsdWU9e2NvdW50cy5vbmxpbmVDbGFzc2VzfSBpY29uPVwiT1wiIGNvbG9yPVwiIzBlYTVlOVwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIlJlY29yZGVkIENsYXNzZXNcIiB2YWx1ZT17Y291bnRzLnJlY29yZGVkQ2xhc3Nlc30gaWNvbj1cIlZcIiBjb2xvcj1cIiNhODU1ZjdcIiAvPlxuICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCJOb3RpY2VzXCIgdmFsdWU9e2NvdW50cy5ub3RpY2VzfSBpY29uPVwiIVwiIGNvbG9yPVwiI2VmNDQ0NFwiIC8+XG4gICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cIkV4YW0gUmVzdWx0c1wiIHZhbHVlPXtjb3VudHMucmVzdWx0c30gaWNvbj1cIkVcIiBjb2xvcj1cIiMxMGI5ODFcIiAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxTZWN0aW9uVGl0bGU+QW5hbHl0aWNzPC9TZWN0aW9uVGl0bGU+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4V3JhcDogXCJ3cmFwXCIsIGdhcDogMTYgfX0+XG4gICAgICAgIDxDaGFydENhcmQgdGl0bGU9XCJTdHVkZW50cyBieSBDb3Vyc2VcIj5cbiAgICAgICAgICA8U2ltcGxlQmFyQ2hhcnQgZGF0YT17c3R1ZGVudHNCeUNvdXJzZX0gbGFiZWxLZXk9XCJfaWRcIiB2YWx1ZUtleT1cImNvdW50XCIgaGVpZ2h0PXsyNDB9IC8+XG4gICAgICAgIDwvQ2hhcnRDYXJkPlxuXG4gICAgICAgIDxDaGFydENhcmQgdGl0bGU9XCJQYXltZW50IFN0YXR1c1wiPlxuICAgICAgICAgIDxTaW1wbGVEb251dCBkYXRhPXtwYXltZW50c0J5U3RhdHVzfSBsYWJlbEtleT1cIl9pZFwiIHZhbHVlS2V5PVwiY291bnRcIiBjb2xvck1hcD17U1RBVFVTX0NPTE9SU30gc2l6ZT17MTgwfSAvPlxuICAgICAgICA8L0NoYXJ0Q2FyZD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4V3JhcDogXCJ3cmFwXCIsIGdhcDogMTYsIG1hcmdpblRvcDogMTYgfX0+XG4gICAgICAgIDxDaGFydENhcmQgdGl0bGU9XCJTdHVkZW50IFJlZ2lzdHJhdGlvbnMgKExhc3QgNiBNb250aHMpXCIgd2lkZT5cbiAgICAgICAgICA8U2ltcGxlTGluZUNoYXJ0IGRhdGE9e3JlZ2lzdHJhdGlvbnNUcmVuZH0gbGFiZWxLZXk9XCJtb250aFwiIHZhbHVlS2V5PVwiY291bnRcIiBoZWlnaHQ9ezI0MH0gLz5cbiAgICAgICAgPC9DaGFydENhcmQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgZmxleFdyYXA6IFwid3JhcFwiLCBnYXA6IDE2LCBtYXJnaW5Ub3A6IDE2IH19PlxuICAgICAgICA8Q2hhcnRDYXJkIHRpdGxlPVwiRXhhbSBSZXN1bHRzIChQYXNzIHZzIEZhaWwpXCI+XG4gICAgICAgICAgPFNpbXBsZURvbnV0IGRhdGE9e3Jlc3VsdFN0YXRzfSBsYWJlbEtleT1cIl9pZFwiIHZhbHVlS2V5PVwiY291bnRcIiBjb2xvck1hcD17eyBQYXNzOiBcIiMwNmQ2YTBcIiwgRmFpbDogXCIjZWY0NzZmXCIgfX0gc2l6ZT17MTgwfSAvPlxuICAgICAgICA8L0NoYXJ0Q2FyZD5cblxuICAgICAgICA8Q2hhcnRDYXJkIHRpdGxlPVwiVXBjb21pbmcgT25saW5lIENsYXNzZXNcIj5cbiAgICAgICAgICB7dXBjb21pbmdDbGFzc2VzLmxlbmd0aCA+IDAgPyAoXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IG1heEhlaWdodDogMjYwLCBvdmVyZmxvd1k6IFwiYXV0b1wiIH19PlxuICAgICAgICAgICAgICA8dGFibGUgc3R5bGU9e3sgd2lkdGg6IFwiMTAwJVwiLCBib3JkZXJDb2xsYXBzZTogXCJjb2xsYXBzZVwiLCBmb250U2l6ZTogMTMgfX0+XG4gICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgPHRyIHN0eWxlPXt7IGJvcmRlckJvdHRvbTogXCIycHggc29saWQgI2U1ZTdlYlwiIH19PlxuICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9e3sgdGV4dEFsaWduOiBcImxlZnRcIiwgcGFkZGluZzogXCI4cHggNHB4XCIsIGNvbG9yOiBcIiM2YjcyODBcIiwgZm9udFdlaWdodDogNjAwIH19PlRpdGxlPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPXt7IHRleHRBbGlnbjogXCJsZWZ0XCIsIHBhZGRpbmc6IFwiOHB4IDRweFwiLCBjb2xvcjogXCIjNmI3MjgwXCIsIGZvbnRXZWlnaHQ6IDYwMCB9fT5Db3Vyc2U8L3RoPlxuICAgICAgICAgICAgICAgICAgICA8dGggc3R5bGU9e3sgdGV4dEFsaWduOiBcImxlZnRcIiwgcGFkZGluZzogXCI4cHggNHB4XCIsIGNvbG9yOiBcIiM2YjcyODBcIiwgZm9udFdlaWdodDogNjAwIH19PkRhdGU8L3RoPlxuICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAgIHt1cGNvbWluZ0NsYXNzZXMubWFwKChjbHMsIGkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17aX0gc3R5bGU9e3sgYm9yZGVyQm90dG9tOiBcIjFweCBzb2xpZCAjZjNmNGY2XCIgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPXt7IHBhZGRpbmc6IFwiOHB4IDRweFwiIH19PntjbHMuY2xhc3NUaXRsZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT17eyBwYWRkaW5nOiBcIjhweCA0cHhcIiB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGJhY2tncm91bmQ6IFwiI2VkZTlmZVwiLCBjb2xvcjogXCIjN2MzYWVkXCIsIHBhZGRpbmc6IFwiMnB4IDhweFwiLCBib3JkZXJSYWRpdXM6IDEyLCBmb250U2l6ZTogMTEsIGZvbnRXZWlnaHQ6IDYwMCB9fT57Y2xzLmNvdXJzZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9e3sgcGFkZGluZzogXCI4cHggNHB4XCIsIGNvbG9yOiBcIiM2YjcyODBcIiB9fT57bmV3IERhdGUoY2xzLmNsYXNzRGF0ZVRpbWUpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImVuLVVTXCIsIHsgbW9udGg6IFwic2hvcnRcIiwgZGF5OiBcIm51bWVyaWNcIiwgaG91cjogXCIyLWRpZ2l0XCIsIG1pbnV0ZTogXCIyLWRpZ2l0XCIgfSl9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPEVtcHR5U3RhdGUgdGV4dD1cIk5vIHVwY29taW5nIGNsYXNzZXNcIiAvPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvQ2hhcnRDYXJkPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxTZWN0aW9uVGl0bGU+UmVjZW50IEFjdGl2aXR5PC9TZWN0aW9uVGl0bGU+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6IFwiZmxleFwiLCBmbGV4V3JhcDogXCJ3cmFwXCIsIGdhcDogMTYgfX0+XG4gICAgICAgIDxDaGFydENhcmQgdGl0bGU9XCJSZWNlbnQgUGF5bWVudHNcIj5cbiAgICAgICAgICB7cmVjZW50UGF5bWVudHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgbWF4SGVpZ2h0OiAzMDAsIG92ZXJmbG93WTogXCJhdXRvXCIgfX0+XG4gICAgICAgICAgICAgIDx0YWJsZSBzdHlsZT17eyB3aWR0aDogXCIxMDAlXCIsIGJvcmRlckNvbGxhcHNlOiBcImNvbGxhcHNlXCIsIGZvbnRTaXplOiAxMyB9fT5cbiAgICAgICAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICAgICAgICA8dHIgc3R5bGU9e3sgYm9yZGVyQm90dG9tOiBcIjJweCBzb2xpZCAjZTVlN2ViXCIgfX0+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT17eyB0ZXh0QWxpZ246IFwibGVmdFwiLCBwYWRkaW5nOiBcIjhweCA0cHhcIiwgY29sb3I6IFwiIzZiNzI4MFwiLCBmb250V2VpZ2h0OiA2MDAgfX0+U3R1ZGVudDwvdGg+XG4gICAgICAgICAgICAgICAgICAgIDx0aCBzdHlsZT17eyB0ZXh0QWxpZ246IFwibGVmdFwiLCBwYWRkaW5nOiBcIjhweCA0cHhcIiwgY29sb3I6IFwiIzZiNzI4MFwiLCBmb250V2VpZ2h0OiA2MDAgfX0+Q291cnNlPC90aD5cbiAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPXt7IHRleHRBbGlnbjogXCJyaWdodFwiLCBwYWRkaW5nOiBcIjhweCA0cHhcIiwgY29sb3I6IFwiIzZiNzI4MFwiLCBmb250V2VpZ2h0OiA2MDAgfX0+QW1vdW50PC90aD5cbiAgICAgICAgICAgICAgICAgICAgPHRoIHN0eWxlPXt7IHRleHRBbGlnbjogXCJjZW50ZXJcIiwgcGFkZGluZzogXCI4cHggNHB4XCIsIGNvbG9yOiBcIiM2YjcyODBcIiwgZm9udFdlaWdodDogNjAwIH19PlN0YXR1czwvdGg+XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgICAgPHRib2R5PlxuICAgICAgICAgICAgICAgICAge3JlY2VudFBheW1lbnRzLm1hcCgocCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtpfSBzdHlsZT17eyBib3JkZXJCb3R0b206IFwiMXB4IHNvbGlkICNmM2Y0ZjZcIiB9fT5cbiAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9e3sgcGFkZGluZzogXCI4cHggNHB4XCIsIGZvbnRXZWlnaHQ6IDUwMCB9fT57cC5zdHVkZW50TmFtZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT17eyBwYWRkaW5nOiBcIjhweCA0cHhcIiB9fT57cC5jb3Vyc2VUaXRsZX08L3RkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT17eyBwYWRkaW5nOiBcIjhweCA0cHhcIiwgdGV4dEFsaWduOiBcInJpZ2h0XCIgfX0+UnMuIHtwLnRvdGFsQW1vdW50fTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPXt7IHBhZGRpbmc6IFwiOHB4IDRweFwiLCB0ZXh0QWxpZ246IFwiY2VudGVyXCIgfX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiBcIjJweCAxMHB4XCIsIGJvcmRlclJhZGl1czogMTIsIGZvbnRTaXplOiAxMSwgZm9udFdlaWdodDogNjAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBwLnN0YXR1cyA9PT0gXCJjb21wbGV0ZWRcIiA/IFwiI2QxZmFlNVwiIDogcC5zdGF0dXMgPT09IFwicGVuZGluZ1wiID8gXCIjZmVmM2M3XCIgOiBcIiNmZWUyZTJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHAuc3RhdHVzID09PSBcImNvbXBsZXRlZFwiID8gXCIjMDY1ZjQ2XCIgOiBwLnN0YXR1cyA9PT0gXCJwZW5kaW5nXCIgPyBcIiM5MjQwMGVcIiA6IFwiIzk5MWIxYlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfX0+e3Auc3RhdHVzfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8RW1wdHlTdGF0ZSB0ZXh0PVwiTm8gcGF5bWVudHMgeWV0XCIgLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NoYXJ0Q2FyZD5cblxuICAgICAgICA8Q2hhcnRDYXJkIHRpdGxlPVwiUmVjZW50IENvbnRhY3QgTWVzc2FnZXNcIj5cbiAgICAgICAgICB7cmVjZW50Q29udGFjdHMubGVuZ3RoID4gMCA/IChcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgbWF4SGVpZ2h0OiAzMDAsIG92ZXJmbG93WTogXCJhdXRvXCIgfX0+XG4gICAgICAgICAgICAgIHtyZWNlbnRDb250YWN0cy5tYXAoKGMsIGkpID0+IChcbiAgICAgICAgICAgICAgICA8ZGl2IGtleT17aX0gc3R5bGU9e3sgcGFkZGluZzogXCIxMnB4IDBcIiwgYm9yZGVyQm90dG9tOiBpIDwgcmVjZW50Q29udGFjdHMubGVuZ3RoIC0gMSA/IFwiMXB4IHNvbGlkICNmM2Y0ZjZcIiA6IFwibm9uZVwiIH19PlxuICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwganVzdGlmeUNvbnRlbnQ6IFwic3BhY2UtYmV0d2VlblwiLCBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLCBtYXJnaW5Cb3R0b206IDQgfX0+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRXZWlnaHQ6IDYwMCwgZm9udFNpemU6IDEzLCBjb2xvcjogXCIjMTExODI3XCIgfX0+e2MubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAxMSwgY29sb3I6IFwiIzljYTNhZlwiIH19PntuZXcgRGF0ZShjLnN1Ym1pdHRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZm9udFNpemU6IDEyLCBjb2xvcjogXCIjNmI3MjgwXCIsIG1hcmdpbkJvdHRvbTogMiB9fT57Yy5lbWFpbH0gLSB7Yy5jb3Vyc2V9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGZvbnRTaXplOiAxMywgY29sb3I6IFwiIzM3NDE1MVwiLCBsaW5lSGVpZ2h0OiAxLjQgfX0+e2MubWVzc2FnZSAmJiBjLm1lc3NhZ2UubGVuZ3RoID4gMTIwID8gYy5tZXNzYWdlLnN1YnN0cmluZygwLCAxMjApICsgXCIuLi5cIiA6IGMubWVzc2FnZX08L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPEVtcHR5U3RhdGUgdGV4dD1cIk5vIGNvbnRhY3QgbWVzc2FnZXMgeWV0XCIgLz5cbiAgICAgICAgICApfVxuICAgICAgICA8L0NoYXJ0Q2FyZD5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IHN0eWxlPXt7IG1hcmdpblRvcDogNDAsIHBhZGRpbmdCb3R0b206IDIwLCB0ZXh0QWxpZ246IFwiY2VudGVyXCIsIGZvbnRTaXplOiAxMiwgY29sb3I6IFwiI2QxZDVkYlwiIH19PlxuICAgICAgICBTYWpoYSBFbnRyYW5jZSBBZG1pbiBEYXNoYm9hcmRcbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRGFzaGJvYXJkO1xuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgRGFzaGJvYXJkIGZyb20gJy4uL2FkbWluL2NvbXBvbmVudHMvRGFzaGJvYXJkJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5EYXNoYm9hcmQgPSBEYXNoYm9hcmQiXSwibmFtZXMiOlsiYXBpIiwiQXBpQ2xpZW50IiwiQ09MT1JTIiwiU1RBVFVTX0NPTE9SUyIsImNvbXBsZXRlZCIsInBlbmRpbmciLCJmYWlsZWQiLCJyZWZ1bmRlZCIsImNhbmNlbGVkIiwiY2FyZFN0eWxlIiwiYmFja2dyb3VuZCIsImJvcmRlclJhZGl1cyIsInBhZGRpbmciLCJib3hTaGFkb3ciLCJmbGV4IiwibWluV2lkdGgiLCJTdGF0Q2FyZCIsImxhYmVsIiwidmFsdWUiLCJpY29uIiwiY29sb3IiLCJSZWFjdCIsImNyZWF0ZUVsZW1lbnQiLCJzdHlsZSIsImJvcmRlckxlZnQiLCJkaXNwbGF5IiwianVzdGlmeUNvbnRlbnQiLCJhbGlnbkl0ZW1zIiwiZm9udFNpemUiLCJmb250V2VpZ2h0IiwibWFyZ2luQm90dG9tIiwidGV4dFRyYW5zZm9ybSIsImxldHRlclNwYWNpbmciLCJvcGFjaXR5IiwiU2VjdGlvblRpdGxlIiwiY2hpbGRyZW4iLCJtYXJnaW4iLCJDaGFydENhcmQiLCJ0aXRsZSIsIndpZGUiLCJtYXhXaWR0aCIsIkVtcHR5U3RhdGUiLCJ0ZXh0IiwidGV4dEFsaWduIiwiU2ltcGxlQmFyQ2hhcnQiLCJkYXRhIiwibGFiZWxLZXkiLCJ2YWx1ZUtleSIsImhlaWdodCIsImxlbmd0aCIsIm1heFZhbCIsIk1hdGgiLCJtYXgiLCJtYXAiLCJkIiwiYmFyV2lkdGgiLCJmbG9vciIsImdhcCIsImgiLCJjaGFydEgiLCJ3aWR0aCIsInZpZXdCb3giLCJvdmVyZmxvdyIsImZyYWMiLCJrZXkiLCJ4MSIsInkxIiwieDIiLCJ5MiIsInN0cm9rZSIsInN0cm9rZVdpZHRoIiwiaXRlbSIsImkiLCJiYXJIIiwieCIsInkiLCJyeCIsImZpbGwiLCJ0ZXh0QW5jaG9yIiwiU2ltcGxlRG9udXQiLCJjb2xvck1hcCIsInNpemUiLCJ0b3RhbCIsInJlZHVjZSIsInMiLCJyIiwiY3giLCJjeSIsIm91dGVyUiIsImlubmVyUiIsImN1bUFuZ2xlIiwiUEkiLCJzbGljZXMiLCJzdGFydEFuZ2xlIiwiZW5kQW5nbGUiLCJsYXJnZUFyYyIsIngxbyIsImNvcyIsInkxbyIsInNpbiIsIngybyIsInkybyIsIngxaSIsInkxaSIsIngyaSIsInkyaSIsImpvaW4iLCJwY3QiLCJyb3VuZCIsImZsZXhXcmFwIiwiZmxleERpcmVjdGlvbiIsImZsZXhTaHJpbmsiLCJTaW1wbGVMaW5lQ2hhcnQiLCJ3IiwicGFkWCIsInN0ZXBYIiwicG9pbnRzIiwicGF0aEQiLCJwIiwiYXJlYUQiLCJvdmVyZmxvd1giLCJzdHJva2VMaW5lam9pbiIsInN0cm9rZUxpbmVjYXAiLCJEYXNoYm9hcmQiLCJzZXREYXRhIiwidXNlU3RhdGUiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsInVzZUVmZmVjdCIsImdldERhc2hib2FyZCIsInRoZW4iLCJyZXMiLCJjYXRjaCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImZpbmFsbHkiLCJjb3VudHMiLCJzdHVkZW50c0J5Q291cnNlIiwicGF5bWVudHNCeVN0YXR1cyIsInJlZ2lzdHJhdGlvbnNUcmVuZCIsInJlc3VsdFN0YXRzIiwicmV2ZW51ZVRvdGFsIiwicmVjZW50UGF5bWVudHMiLCJyZWNlbnRDb250YWN0cyIsInVwY29taW5nQ2xhc3NlcyIsImZvbnRGYW1pbHkiLCJtYXJnaW5Ub3AiLCJzdHVkZW50cyIsInBhaWRTdHVkZW50cyIsInRvTG9jYWxlU3RyaW5nIiwiY291cnNlcyIsImJsb2dzIiwiY29sbGVnZXMiLCJjb250YWN0cyIsIm5ld3NsZXR0ZXJzIiwib25saW5lQ2xhc3NlcyIsInJlY29yZGVkQ2xhc3NlcyIsIm5vdGljZXMiLCJyZXN1bHRzIiwiUGFzcyIsIkZhaWwiLCJtYXhIZWlnaHQiLCJvdmVyZmxvd1kiLCJib3JkZXJDb2xsYXBzZSIsImJvcmRlckJvdHRvbSIsImNscyIsImNsYXNzVGl0bGUiLCJjb3Vyc2UiLCJEYXRlIiwiY2xhc3NEYXRlVGltZSIsInRvTG9jYWxlRGF0ZVN0cmluZyIsIm1vbnRoIiwiZGF5IiwiaG91ciIsIm1pbnV0ZSIsInN0dWRlbnROYW1lIiwiY291cnNlVGl0bGUiLCJ0b3RhbEFtb3VudCIsInN0YXR1cyIsImMiLCJuYW1lIiwic3VibWl0dGVkQXQiLCJlbWFpbCIsImxpbmVIZWlnaHQiLCJtZXNzYWdlIiwic3Vic3RyaW5nIiwicGFkZGluZ0JvdHRvbSIsIkFkbWluSlMiLCJVc2VyQ29tcG9uZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztFQUdBLE1BQU1BLEdBQUcsR0FBRyxJQUFJQyxpQkFBUyxFQUFFO0VBRTNCLE1BQU1DLE1BQU0sR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7RUFDdkcsTUFBTUMsYUFBYSxHQUFHO0VBQUVDLEVBQUFBLFNBQVMsRUFBRSxTQUFTO0VBQUVDLEVBQUFBLE9BQU8sRUFBRSxTQUFTO0VBQUVDLEVBQUFBLE1BQU0sRUFBRSxTQUFTO0VBQUVDLEVBQUFBLFFBQVEsRUFBRSxTQUFTO0VBQUVDLEVBQUFBLFFBQVEsRUFBRTtFQUFVLENBQUM7RUFFL0gsTUFBTUMsU0FBUyxHQUFHO0VBQ2hCQyxFQUFBQSxVQUFVLEVBQUUsTUFBTTtFQUNsQkMsRUFBQUEsWUFBWSxFQUFFLEVBQUU7RUFDaEJDLEVBQUFBLE9BQU8sRUFBRSxNQUFNO0VBQ2ZDLEVBQUFBLFNBQVMsRUFBRSx3REFBd0Q7RUFDbkVDLEVBQUFBLElBQUksRUFBRSxXQUFXO0VBQ2pCQyxFQUFBQSxRQUFRLEVBQUU7RUFDWixD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
