## Why

When an implementation PR merges, the linked issue remains open and the `openspec:review` label stays attached — requiring manual cleanup. Automating this on merge ensures the issue lifecycle is tracked correctly without extra steps.

## What Changes

- Update the implement agent prompt to use `Closes #<n>` instead of `Refs #<n>` so GitHub auto-closes the linked issue when the impl PR merges.
- Add a new GitHub Actions job in `.github/workflows/openspec-flow.yaml` triggered on `pull_request` closed events where `merged == true` and the head branch matches `impl/<n>-*`, that extracts the issue number and removes the `openspec:review` label.

## Capabilities

### New Capabilities

- `impl-merge-cleanup`: Automatically close the linked issue and remove the `openspec:review` label when an implementation PR is merged.

### Modified Capabilities

- `openspec-flow`: The workflow gains a new job for post-merge cleanup; no requirement-level behavior of existing jobs changes.

## Impact

- `.claude/agents/implement.md` — change `Refs` to `Closes` in the PR body template.
- `.github/workflows/openspec-flow.yaml` — new `cleanup-on-impl-merge` job requiring `issues: write` (already present).
- No new dependencies or breaking changes.
