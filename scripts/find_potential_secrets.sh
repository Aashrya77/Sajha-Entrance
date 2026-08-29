#!/usr/bin/env bash
# Utility: scan repository files for potential secrets (quick, not exhaustive)
set -euo pipefail

echo "Scanning repository for potential secret patterns..."

# Patterns to look for (extend as needed)
PATTERNS=(
  "AKIA[0-9A-Z]{16}" # AWS Access Key
  "AIza[0-9A-Za-z-_]{35}" # Google API key-ish
  "-----BEGIN PRIVATE KEY-----" # private keys
  "mongodb\+srv:\/\/" # mongo connection
  "CLOUDINARY_URL="
  "FIREBASE_SERVICE_ACCOUNT"
  "MAIL_PASSWORD"
  "JWT_SECRET"
  "SESSION_SECRET"
  "AAKASH_SMS_AUTH_TOKEN"
)

for p in "${PATTERNS[@]}"; do
  echo
  echo "== Pattern: $p"
  git grep -n --full-name -I -E "$p" || true
done

echo
echo "Also show any committed .env or key files:" 
git ls-files | grep -E "\.env$|serviceAccount|credentials|\.key$|\.pem$" || true

echo "Scan complete. Review matches above and rotate any confirmed secrets immediately."
