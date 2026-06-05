import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ACTIVE_USER_WINDOW_MS = 1000 * 60 * 2;
const MAX_TRACKED_ACTIVE_USERS = 500;
const activeUsers = new Map();

const normalizeText = (value = "", maxLength = 120) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const normalizePath = (value = "") => {
  const normalized = normalizeText(value, 180);
  return normalized.startsWith("/") ? normalized : `/${normalized || ""}`;
};

const hashValue = (value = "") =>
  crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 24);

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.studentToken || "";
};

const resolveStudentFromRequest = (req) => {
  const token = getRequestToken(req);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return {
      id: normalizeText(decoded.id, 80),
      studentId: normalizeText(decoded.studentId, 40),
      email: normalizeText(decoded.email, 120),
    };
  } catch (_error) {
    return null;
  }
};

const pruneInactiveUsers = (now = Date.now()) => {
  const activeSince = now - ACTIVE_USER_WINDOW_MS;

  for (const [key, user] of activeUsers.entries()) {
    if (!user?.lastSeenAt || user.lastSeenAt < activeSince) {
      activeUsers.delete(key);
    }
  }

  if (activeUsers.size <= MAX_TRACKED_ACTIVE_USERS) {
    return;
  }

  const oldestUsers = [...activeUsers.entries()].sort(
    ([, left], [, right]) => (left.lastSeenAt || 0) - (right.lastSeenAt || 0)
  );

  for (const [key] of oldestUsers.slice(0, activeUsers.size - MAX_TRACKED_ACTIVE_USERS)) {
    activeUsers.delete(key);
  }
};

export const recordActiveUser = (req) => {
  const now = Date.now();
  const body = req.body || {};
  const student = resolveStudentFromRequest(req);
  const browserClientId = normalizeText(body.clientId, 100);
  const fallbackClientId = hashValue(`${req.ip || ""}|${req.get("user-agent") || ""}`);
  const userKey = student?.id
    ? `student:${student.id}`
    : `visitor:${browserClientId || fallbackClientId}`;
  const previousUser = activeUsers.get(userKey);
  const pagePath = normalizePath(body.path || req.get("referer") || "/");
  const pageTitle = normalizeText(body.title, 140);

  activeUsers.set(userKey, {
    id: userKey,
    type: student ? "student" : "visitor",
    label: student
      ? student.studentId || student.email || "Student"
      : "Guest visitor",
    email: student?.email || "",
    studentId: student?.studentId || "",
    pagePath,
    pageTitle,
    firstSeenAt: previousUser?.firstSeenAt || now,
    lastSeenAt: now,
    hits: (previousUser?.hits || 0) + 1,
  });

  pruneInactiveUsers(now);

  return getActiveUsersSnapshot(now);
};

export const getActiveUsersSnapshot = (now = Date.now()) => {
  pruneInactiveUsers(now);

  const users = [...activeUsers.values()]
    .filter((user) => now - user.lastSeenAt <= ACTIVE_USER_WINDOW_MS)
    .sort((left, right) => right.lastSeenAt - left.lastSeenAt)
    .map((user) => ({
      id: user.id,
      type: user.type,
      label: user.label,
      email: user.email,
      studentId: user.studentId,
      pagePath: user.pagePath,
      pageTitle: user.pageTitle,
      firstSeenAt: new Date(user.firstSeenAt).toISOString(),
      lastSeenAt: new Date(user.lastSeenAt).toISOString(),
      activeForSeconds: Math.max(0, Math.round((now - user.firstSeenAt) / 1000)),
      secondsSinceSeen: Math.max(0, Math.round((now - user.lastSeenAt) / 1000)),
      hits: user.hits,
    }));

  const studentsCount = users.filter((user) => user.type === "student").length;

  return {
    count: users.length,
    studentsCount,
    visitorsCount: users.length - studentsCount,
    users,
    activeWindowSeconds: Math.round(ACTIVE_USER_WINDOW_MS / 1000),
    generatedAt: new Date(now).toISOString(),
  };
};
