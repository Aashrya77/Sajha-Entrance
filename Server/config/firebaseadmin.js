import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount = null;

// Load from serviceAccountKey.json file
const keyPath = join(__dirname, "../serviceAccountKey.json");
if (existsSync(keyPath)) {
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase initialized from file");
  } catch (error) {
    console.warn("Warning: Firebase initialization from file failed:", error.message);
  }
} else {
  console.warn("Warning: Firebase credentials not found!");
  console.warn("Place serviceAccountKey.json in Server/ directory");
  console.warn("Firebase admin will not be initialized. Some features may not work.");
}

export default admin;