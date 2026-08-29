# Git history cleanup with git-filter-repo

Warning: rewriting history is destructive to shared branches. Coordinate with your team and keep backups.

1. Install `git-filter-repo` (preferred over BFG)

  - macOS (Homebrew): `brew install git-filter-repo`
  - Linux: follow https://github.com/newren/git-filter-repo

2. Backup repository mirror

```bash
git clone --mirror $(git remote get-url origin) repo-backup.git
```

3. Create a working clone and copy `scripts/replacements.txt` into it

```bash
git clone $(git remote get-url origin) tmp-repo
cd tmp-repo
cp ../scripts/replacements.txt ./replacements.txt
```

4. Run `git-filter-repo` to replace leaked values

```bash
# This will replace any matching text according to replacements.txt
git filter-repo --replace-text replacements.txt
```

5. Inspect history, run tests, then force-push cleaned branches

```bash
git remote add cleaned $(git remote get-url origin)
git push cleaned --force --all
git push cleaned --force --tags
```

6. Rotate provider credentials immediately (MongoDB, Firebase, SMTP, Cloudinary, Zoom, eSewa, Aakash SMS, YouTube API).

7. Update production secrets (envs, secrets manager) and restart services.

If you prefer, I can prepare and run these steps for you locally (I will not push secrets). Tell me when you're ready and ensure you have backups.
