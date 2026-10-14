# Production Handover

## Release Status

The frontend production build and all 132 backend tests pass. Production startup now rejects missing or weak `JWT_SECRET` and `SESSION_SECRET` values (minimum 32 bytes). These changes have not been deployed.

Do not mark the security handover complete yet:

- `Server/.env` has two historical Git revisions; a suppressed-content scan found credential-pattern material in one revision. Current ignore rules do not remove data from Git history. No history rewrite has been performed.
- The latest production dependency audit reports 10 high backend findings and 5 moderate frontend findings. High backend findings include `firebase-admin`, `nodemailer`, `sharp`, and `xlsx`; some require major upgrades, and `xlsx` has no npm advisory fix. Frontend findings include `katex`, `quill` (through `react-quill`), and `react-router`.
- A dedicated history scanner such as Gitleaks was not installed, so this check is not a complete secret audit.
- The local ignored `Server/.env` and untracked `tmp-repo-clean/` workspace copy were not changed or included. Review them separately and do not bundle them with company deliverables.

## Handover Sequence

1. Assign a company technical owner and freeze repository pushes while credential cleanup is planned.
2. Rotate every credential that appeared in the historical env file or other committed material. Review MongoDB, Firebase, JWT/session, SMTP, Cloudinary, eSewa, Zoom, SMS, hosting, CI/CD, and analytics credentials as applicable. Revoke old provider keys, update the production secret manager, and verify access. Do not send raw secrets in email, chat, or this repository. JWT/session rotation invalidates existing sessions and tokens.
3. Create a protected mirror backup, then coordinate a Git-history rewrite across all branches and tags with `git-filter-repo`. Verify the rewritten repository with a clean clone and a secret scanner before force-pushing. Notify collaborators that they must re-clone; forks, caches, and old backups can retain the original secrets. Follow [the existing rotation runbook](rotate-secrets.md).
4. Resolve dependency findings in a staging branch. Upgrade `firebase-admin`, `nodemailer`, `sharp`, and the AdminJS/Firebase transitive tree with compatibility tests. Replace `xlsx` with a maintained alternative because npm reports no fix. Upgrade the frontend KaTeX, Quill/react-quill, and React Router stack without using blind `--force` updates.
5. Confirm the company-controlled production environment provides `JWT_SECRET` and `SESSION_SECRET` with at least 32 bytes each before deploying this version. Keep production secrets in the host's secret manager, never in `.env` committed to Git.
6. Run clean installs and release checks from the repository root:

   ```powershell
   npm ci --prefix Server
   npm ci --prefix App
   npm --prefix Server test
   npm --prefix App run build
   npm audit --prefix Server --omit=dev
   npm audit --prefix App --omit=dev
   ```

7. Back up the production database and uploaded media, then perform a documented restore test in staging. Confirm who owns backup retention, encryption, and recovery access.
8. Deploy to staging first. Smoke-test student registration/login/password reset, admin login and permissions, content editing/upload, payments in the correct eSewa environment, mock tests/results, email/SMS notifications, health endpoint, and rollback. Promote only after the company owner signs off.
9. Transfer repository ownership, hosting and billing, domain/DNS and TLS, database, Firebase, payment, mail, media, Zoom/SMS provider accounts, CI/CD, analytics, monitoring, backups, recovery contacts, and MFA/recovery methods to company-controlled identities. Apply least privilege and remove personal access only after company access is verified.
10. Deliver the source repository, environment-variable template, deployment/rollback instructions, data backup/restore procedure, third-party service inventory, known limitations, and named support/escalation contacts. Do not include live credentials in the handover package.

## Verification Notes

- Backend tests: 132 passed after test discovery was restricted to `Server/tests/*.test.js`; `Server/scratch/test-admin.js` is a manual database utility and must not run as a test.
- Frontend build: passed.
- Production dependency audit: backend 59 findings (10 high, 48 moderate, 1 low); frontend 5 (4 moderate, 1 low). Re-run after dependency work because audit results change over time.
- `scripts/check_secrets_in_clean.sh` checks supplied values against `HEAD` only; it explicitly does not scan Git history. Use a dedicated history scanner for the cleanup verification.
