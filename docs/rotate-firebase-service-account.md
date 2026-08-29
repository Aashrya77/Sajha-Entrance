Rotate Firebase service account (runbook)

Goal: Replace the Firebase Admin service account key used by the app, verify the new key, and revoke the old key.

Steps (console)
1. Open Firebase Console → Project Settings → Service accounts.
2. Click "Generate new private key" for the Admin SDK. Download the JSON (keep it secure).
3. In the project server host (production/CI), upload the JSON to your secret store:
   - GCP Secret Manager: create secret `FIREBASE_SERVICE_ACCOUNT_JSON` with JSON contents.
   - Heroku/Render/Vercel: set `FIREBASE_SERVICE_ACCOUNT_JSON` or upload file securely.
   - If you use a filesystem file, place the JSON at `Server/serviceAccountKey.json` and restrict permissions.
4. Update the server config:
   - Option A (file): ensure `Server/config/firebaseadmin.js` reads `serviceAccountKey.json` (it already does if present).
   - Option B (env): set `FIREBASE_SERVICE_ACCOUNT_JSON` to the JSON string and update `Server/config/firebaseadmin.js` to parse `process.env.FIREBASE_SERVICE_ACCOUNT_JSON`.
5. Restart your app servers (PM2, systemd, container restart, or redeploy).
6. Run verification tests (below).
7. Once verified, revoke the old key in Firebase Console: Service accounts → Manage keys → delete old key.

gcloud CLI alternative
- Create key locally (requires appropriate IAM):
  gcloud iam service-accounts keys create key.json \
    --iam-account "SERVICE_ACCOUNT_EMAIL" \
    --project "YOUR_PROJECT_ID"
- Upload to GCP Secret Manager:
  echo "$(cat key.json)" | gcloud secrets create firebase-key --data-file=-

Validation (quick)
1. Locally (or on server), test initialization using the new JSON by running:

  node scripts/validate_firebase_key.js /path/to/serviceAccountKey.json

2. Expected output: prints projectId and successful init, or clear error message.

Validation (app-level)
- After restart, call an endpoint that uses Firebase auth (e.g., POST `/api/auth/firebase-login` with a valid Firebase token) or run your own test tokens through `firebase-admin` verify flow.

Safety notes
- Always rotate keys in provider console after deployment of new key.
- Do not commit the JSON to Git. Use secret managers.
- Limit key lifetime and restrict IAM permissions where possible.

Files added
- `docs/rotate-firebase-service-account.md` — this runbook
- `Server/scripts/validate_firebase_key.js` — small script to validate a JSON key

If you want, I can:
- Update `Server/config/firebaseadmin.js` to support `FIREBASE_SERVICE_ACCOUNT_JSON` env var.
- Run validation here if you upload the new JSON (or paste it into a secure channel).
- Generate the exact `gcloud` commands for your project.
