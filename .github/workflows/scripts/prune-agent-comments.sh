#!/usr/bin/env bash
# Delete prior agent summary comments on an issue/PR, matched by an HTML
# marker. Keeps one summary visible at a time so PRs don't accumulate
# status breadcrumbs across multiple runs of the OpenSpec flow.
#
# Usage: prune-agent-comments.sh <repo> <issue_or_pr_number> <marker>
#   repo    — "owner/name"
#   number  — issue or PR number (PR comments live on the issues endpoint)
#   marker  — literal string that identifies agent-authored comments
#             (typically an HTML comment like `<!-- openspec-flow-summary -->`)
#
# Relies on $GH_TOKEN in the environment for authentication.

set -euo pipefail

repo="${1:?repo required}"
number="${2:?issue/PR number required}"
marker="${3:?marker required}"

# --paginate handles repos with many comments; --jq extracts just the IDs
# of comments whose body contains the marker.
ids=$(gh api --paginate "repos/$repo/issues/$number/comments" \
  --jq --arg m "$marker" '.[] | select(.body | contains($m)) | .id')

if [ -z "$ids" ]; then
  echo "No prior agent comments to prune."
  exit 0
fi

count=0
while read -r id; do
  [ -z "$id" ] && continue
  if gh api --method DELETE "repos/$repo/issues/comments/$id" >/dev/null 2>&1; then
    count=$((count + 1))
  else
    echo "::warning::Failed to delete comment $id"
  fi
done <<< "$ids"

echo "Pruned $count prior agent summary comment(s)."
