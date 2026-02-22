import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Helper to extract token from cookie or Authorization header
const getToken = (req) => {
  // Check Authorization header first (for React frontend)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  // Fall back to cookie
  return req.cookies?.studentToken;
};

// JSON API auth middleware
export const authenticateToken = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ success: false, error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.student = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
};

// Middleware to check if user is authenticated (non-blocking)
export const isAuthenticated = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    req.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.student = decoded;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    req.isAuthenticated = false;
    next();
  }
};

// Alias for authenticateToken (backward compat)
export const requireAuth = authenticateToken;
