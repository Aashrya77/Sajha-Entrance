import admin from "../config/firebaseAdmin.js";

export const authenticateFirebase = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "No token" });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      await admin.auth().verifyIdToken(
        token
      );

    req.firebaseUser = decoded;

    next();
  } catch (e) {
    return res
      .status(401)
      .json({ message: "Invalid Firebase Token" });
  }
};