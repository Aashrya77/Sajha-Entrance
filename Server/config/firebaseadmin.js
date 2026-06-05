import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keyPath = join(__dirname, "../serviceAccountKey.json");

let serviceAccount = null;

if (existsSync(keyPath)) {
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.warn("Warning: Firebase initialization failed:", error.message);
  }
} else {
  console.warn("Warning: serviceAccountKey.json not found at", keyPath);
  console.warn("Firebase admin will not be initialized. Some features may not work.");
}

export default admin;