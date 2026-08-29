#!/usr/bin/env bash
set -euo pipefail

WORKDIR="tmp-repo-clean"
rm -rf "$WORKDIR"
git clone . "$WORKDIR"
cd "$WORKDIR"
cp ../scripts/replacements.txt ./replacements.txt || true

if command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo found, running replace-text (force)..."
  git filter-repo --replace-text replacements.txt --force
else
  # Fallback to python -m git_filter_repo if installed via pip --user
  if python -c "import importlib.util, sys; sys.exit(0 if importlib.util.find_spec('git_filter_repo') else 1)" >/dev/null 2>&1; then
    echo "git_filter_repo module available, running via python -m git_filter_repo (force)..."
    python -m git_filter_repo --replace-text replacements.txt --force
  else
    echo "git-filter-repo not available. Install it (pip install --user git-filter-repo) and re-run this script."
    exit 0
  fi
fi

echo "--- recent commits ---"
git --no-pager log --oneline -n 5

echo "--- searching for leaking patterns after rewrite ---"
if git grep -n -E "MONGODB_URI|JWT_SECRET|SESSION_SECRET|CLOUDINARY_URL|AAKASH_SMS_AUTH_TOKEN|ESEWA_SECRET_KEY|YOUTUBE_API_KEY|FIREBASE_SERVICE_ACCOUNT"; then
  echo "Potential matches remain. Review above output.";
else
  echo "No matches found for common secret patterns."
fi

echo "Disposable cleaned clone is at: $(pwd)"
