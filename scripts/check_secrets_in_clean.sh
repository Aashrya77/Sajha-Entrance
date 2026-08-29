#!/usr/bin/env bash
set -euo pipefail
REPO="/mnt/c/Users/LOQ/Desktop/Sajha-Entrance/tmp-repo-clean"
if [ ! -d "$REPO/.git" ]; then
  echo "Cleaned repo not found at $REPO/.git"
  exit 1
fi
cat > /tmp/secret_list.txt <<'VALS'
Mukesh:0908
76ed680ef82ae0bca21c29b0953d591da64462e660af75a19c6796708321c718
test123
8gBm/:&EnhH.1/q
AIzaSyC62kUe3nYLXQHLyep3O6RM5IUBut9GvBY
614959587925644:bE-X7Rc7nHWmAkuOv70S8NqYiGk
d1327571da12900caa0eb3f6ae576253534ebd0d1260ca7268e5e6f9e3ef4594
VALS

while IFS= read -r s; do
  echo "== $s =="
  git --git-dir="$REPO/.git" --work-tree="$REPO" grep -n -F "$s" || echo "no matches"
done < /tmp/secret_list.txt

echo "check complete"
