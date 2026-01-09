import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // Get token from cookie
  const token = req.cookies?.studentToken;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    req.student = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

// Middleware to check if user is authenticated (for views)
export const isAuthenticated = (req, res, next) => {
  const token = req.cookies?.studentToken;

  if (!token) {
    req.isAuthenticated = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    req.student = decoded;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    req.isAuthenticated = false;
    next();
  }
};

// Middleware to require authentication (redirects to login)
export const requireAuth = (req, res, next) => {
  const token = req.cookies?.studentToken;

  if (!token) {
    return res.redirect("/student/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    req.student = decoded;
    next();
  } catch (error) {
    return res.redirect("/student/login");
  }
};
