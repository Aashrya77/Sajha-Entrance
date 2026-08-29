/*
 * Script: generate_env_example.js
 * Reads Server/.env and writes Server/.env.example with values masked.
 * Usage: node scripts/generate_env_example.js
 */
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), "Server", ".env");
const outPath = path.join(process.cwd(), "Server", ".env.example");

if (!fs.existsSync(envPath)) {
  console.error("Server/.env not found. Create it first or run from repo root.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const lines = content.split(/\r?\n/);

const masked = lines.map((line) => {
  if (!line || line.trim().startsWith("#")) return line;
  const idx = line.indexOf("=");
  if (idx === -1) return line;
  const key = line.slice(0, idx + 1);
  return `${key}<REDACTED>`;
});

fs.writeFileSync(outPath, masked.join("\n"));
console.log(`Wrote ${outPath}. Review and commit as safe example file.`);
