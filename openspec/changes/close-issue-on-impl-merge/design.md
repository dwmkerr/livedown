## Context

Currently, when an implementation PR is merged, the linked issue stays open and the `openspec:review` label remains on it. The implement agent uses `Refs #<n>` in the PR body, which only links but does not close the issue. Cleanup is entirely manual.

The repo already has `issues: write` permission in the workflow and uses `gh` CLI for label management (e.g., the `drives-implement` job). The impl branch naming convention `impl/<n>-*` provides a reliable signal for extracting the issue number.

## Goals / Non-Goals

**Goals:**
- Auto-close the linked issue when the impl PR merges, using GitHub's native `Closes` keyword.
- Remove the `openspec:review` label from the issue on impl PR merge via a GitHub Actions job.

**Non-Goals:**
- Handling cases where the impl PR is closed without merging.
- Modifying any other labels or issue state beyond `openspec:review` removal.
- Changing the PR template for manually created PRs not following the `impl/<n>-*` pattern.

## Decisions

**Use `Closes` keyword in the PR body (not branch name or merge commit)**
The implement agent controls the PR body. Changing `Refs #<n>` to `Closes #<n>` is the simplest, most idiomatic GitHub approach. GitHub processes this keyword at merge time. Alternative: a separate API call to close the issue from the workflow — rejected because the keyword approach requires zero extra permissions or steps.

**Extract issue number from branch name in the GHA job**
The `impl/<n>-*` convention makes the issue number machine-readable from the branch name. Using `echo "${{ github.head_ref }}" | grep -oP '(?<=impl/)\d+'` is straightforward and doesn't require parsing the PR body. Alternative: parse the PR body for `Closes #<n>` — more fragile, skipped.

**Single new job `cleanup-on-impl-merge` in `openspec-flow.yaml`**
Keeps all openspec automation in one workflow file. The job runs only on `pull_request` type `closed` with `github.event.pull_request.merged == true` and a branch filter `impl/**`. No new workflow file needed.

## Risks / Trade-offs

- [Risk] Issue closes before downstream steps complete → Mitigation: GitHub closes on merge, which is the last step; no ordering issue.
- [Risk] Branch name doesn't match `impl/<n>-*` → Mitigation: The job extracts the number and skips label removal gracefully if no number is found (gh cli exits cleanly on label-not-present).
- [Risk] `openspec:review` label already removed → Mitigation: `gh issue edit --remove-label` is idempotent-safe; worst case, it's a no-op.
