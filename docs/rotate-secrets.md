# Secret Rotation Plan

This document describes a safe, repeatable process to rotate secrets that were exposed in Git history or in committed files (Firebase, MongoDB, JWT/SESSION, admin credentials, mail, eSewa, etc.). Follow these steps carefully and coordinate with your ops/hosting provider.

1. Prepare
  - Create a full backup of the repository (clone to a safe location).
  - Notify stakeholders that a history rewrite and force-push will occur.

2. Rotate credentials with providers (do NOT skip)
  - MongoDB: create a new database user, update `MONGODB_URI` with new credentials, and restrict network access to required hosts.
  - Firebase: create a new service account key in Firebase Console and revoke old keys. Replace `FIREBASE_SERVICE_ACCOUNT` with the new JSON (store in secrets manager, not repo).
  - JWT/Session: generate new `JWT_SECRET` and `SESSION_SECRET` values (use a CSPRNG, 32+ bytes). Update runtime env.
  - Mail (SMTP): change the SMTP account password or create a new mailbox and update `MAIL_USERNAME`/`MAIL_PASSWORD`.
  - Cloudinary / Zoom / eSewa / Aakash SMS: rotate keys in the provider consoles and update env vars.

3. Update production and CI secrets
  - Update environment variables in production hosts, CI/CD pipelines, and any secret stores (Azure Key Vault / AWS Secrets Manager / GCP Secret Manager / Heroku config vars).
  - Restart services after updating secrets.

4. Purge secrets from Git history (optional but recommended if secrets were committed)
  - Recommended: use `git-filter-repo` (faster, safer) or `BFG Repo-Cleaner`.
  - Example (git-filter-repo):

```bash
# 1. Backup local repo
git clone --mirror <repo-url> repo-backup.git

# 2. Run filter-repo to remove sensitive files/strings
git clone <repo-url> tmp-repo
cd tmp-repo

# Remove a file path completely
git filter-repo --invert-paths --path Server/.env

# Or replace strings (e.g., leaked token) with a placeholder
git filter-repo --replace-text ../replacements.txt

# 3. Force-push cleaned repo (coordinate with team)
git remote add cleaned origin <repo-url>
git push --force --all cleaned
git push --force --tags cleaned
```

`replacements.txt` format is documented in git-filter-repo docs. Always verify the cleaned repository before deleting any backups.

5. Invalidate tokens and sessions
  - After rotating `JWT_SECRET` and `SESSION_SECRET`, all existing sessions and tokens will be invalidated. Notify users if required.

6. Verify
  - Run integration tests, smoke tests, and confirm that services can connect with new credentials.

7. Post-rotation hardening
  - Add `.env` to `.gitignore` and remove any committed secrets.
  - Replace in-repo secrets with a `Server/.env.example` file containing keys but no values.
  - Add automated pre-commit secret scanning (e.g., `git-secrets`, `truffleHog`, `gitleaks`) in CI.

Contact me if you want me to perform the history rewrite and update `.env` placeholders and CI config. I will prepare exact commands and a replacement file for `git-filter-repo` or BFG.
