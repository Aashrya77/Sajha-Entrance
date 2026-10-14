#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <repository-path> <secret-values-file>" >&2
  exit 1
fi
REPO="$1"
SECRET_VALUES_FILE="$2"

if ! git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1; then
  echo "Repository not found: $REPO" >&2
  exit 1
fi

if [ ! -f "$SECRET_VALUES_FILE" ]; then
  echo "Secret values file not found: $SECRET_VALUES_FILE" >&2
  exit 1
fi

found=0
while IFS= read -r secret || [ -n "$secret" ]; do
  [ -z "$secret" ] && continue
  if git -C "$REPO" grep -l -F -e "$secret" HEAD -- >/dev/null 2>&1; then
    echo "Potential secret match found in repository content (value redacted)."
    found=1
  fi
done < "$SECRET_VALUES_FILE"

if [ "$found" -eq 1 ]; then
  echo "Check failed. Review matches locally without sharing secret values."
  exit 1
fi

echo "No supplied secret values found in HEAD. Git history was not scanned."
