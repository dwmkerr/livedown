## Context

The `openspec-flow.yaml` workflow automates the proposal phase of the OpenSpec lifecycle (explore + spec). Once a proposal PR is merged, the `openspec/changes/<name>/` folder lives in the repo as an in-flight change ready for implementation. Today there is no automation for the next three lifecycle stages: `apply` (write code), `verify` (check against spec), and `archive` (finalize). Engineers trigger these manually.

The new `openspec-flow-implement.yaml` workflow closes this gap by firing on proposal PR merge and driving Claude Code through all three remaining stages in one run.

Existing patterns from `openspec-flow.yaml` are reused verbatim where possible: runtime setup (bun, Node, OpenSpec CLI, claude-code-action), fail-fast prechecks, label flip idiom, and the ALL_INPUTS / CLAUDE_ARGS invocation pattern.

## Goals / Non-Goals

**Goals:**
- Fire automatically when a `spec/<n>-*` branch merges to `main`
- Verify the linked issue carries `openspec:spec-ready` before proceeding (idempotency + safety)
- Run `openspec-apply-change` → `openspec-verify-change` → `openspec-archive-change` skills in sequence via Claude Code
- Produce one code PR containing: implementation files, archived change folder, updated main specs
- Flip issue label `openspec:spec-ready` → `openspec:implement` at start; `openspec:review` after code PR opens
- Fail fast if required labels are missing or OpenSpec is not scaffolded in the repo
- Comment on the issue at start ("code PR will open automatically") and link the resulting code PR

**Non-Goals:**
- Auto-closing the issue on code PR merge (follow-up)
- Cancellation / reassignment handling mid-run
- Detecting "agent ran but produced no PR" (acknowledged as a known gap, same as existing workflow)
- Changing `openspec-flow.yaml` in any way

## Decisions

### Trigger: `pull_request: closed` + merged check + branch pattern

**Decision**: Trigger on `pull_request` `closed` event, guard with `github.event.pull_request.merged == true` and `startsWith(github.event.pull_request.head.ref, 'spec/')`.

**Rationale**: The natural event for "PR merged" is `pull_request: [closed]` filtered to merged. The branch pattern `spec/<n>-*` is already established by `openspec-flow.yaml` and is the most reliable discriminator — it is set by the propose workflow and is not user-editable without breaking the convention.

**Alternatives considered**:
- Trigger on `push` to `main` and look for merged spec branches: noisier, harder to correlate to a specific PR.
- Trigger on `issues: labeled` with `openspec:spec-ready`: fires too early (label is set when the proposal PR opens, not when it merges).

### Issue number extraction from branch name

**Decision**: Extract the issue number from the branch name (`spec/<n>-<slug>`) using shell parameter expansion in the check step. Then use `gh issue view` to verify the issue still has `openspec:spec-ready`.

**Rationale**: The branch name is authoritative — it is set by the propose workflow and encodes the issue number explicitly. Parsing the PR body for `Refs #<n>` is more fragile. The `gh issue view` verification ensures idempotency: if someone manually closes and re-opens a branch, the label check prevents a spurious re-run.

### Change name from branch slug

**Decision**: Derive the change name by stripping the `spec/<n>-` prefix from the branch name. Pass this to the agent as context so it knows which `openspec/changes/<name>/` to work on.

**Rationale**: The branch slug is the change name (set by the propose workflow). An alternative (scanning `openspec/changes/` for non-archived folders) is used as a fallback hint in the agent prompt for robustness.

### Label flip to `openspec:review` — post-run step (not agent)

**Decision**: A post-run workflow step flips `openspec:implement` → `openspec:review` on success, the same pattern `openspec-flow.yaml` uses for `openspec:exploring` → `openspec:spec-ready`.

**Rationale**: Keeping label management in the workflow (not inside the agent prompt) makes the state machine predictable and auditable. The agent focuses purely on the implementation.

### Concurrency group keyed on PR number

**Decision**: `group: openspec-flow-implement-${{ github.event.pull_request.number }}` with `cancel-in-progress: false`.

**Rationale**: Each proposal PR is distinct; keying on PR number prevents concurrent duplicate runs for the same proposal while allowing different proposals to run in parallel.

### Required labels extended to include new states

**Decision**: The fail-fast label check (copied from `openspec-flow.yaml`) verifies `openspec:implement` and `openspec:review` exist in addition to the existing four labels.

**Rationale**: Same reasoning as the original: failing early with a clear error message and creation commands is far better than a late failure mid-run that leaves the issue in an inconsistent state.

## Risks / Trade-offs

- **Silent success with no PR**: Same risk as `openspec-flow.yaml` — if the agent exits 0 without opening a PR the label flips to `openspec:review` incorrectly. Mitigation: acknowledged in FUTURE WORK; a post-run PR existence check can be added later.
- **Branch naming drift**: If the propose workflow ever changes its branch naming convention away from `spec/<n>-*`, the trigger filter breaks silently (no run, no error). Mitigation: document the convention; the filter is a single `startsWith` check that is easy to update.
- **Multiple in-flight changes**: If multiple spec branches exist simultaneously and both merge in quick succession, the agent needs to identify the correct change folder. Mitigation: the branch slug → change name derivation is deterministic; each run processes exactly one change.
- **No rollback on archive**: `openspec-archive` moves files and is not easily reversible via the workflow. Mitigation: git history preserves the change folder; a rollback is a manual revert commit.

## Open Questions

- Should the code PR title follow a convention (e.g., `feat: implement #<n> <title>`)? Leaving this to the agent for now; can be standardised in a follow-up.
- Should the workflow auto-close the linked issue on code PR merge? Out of scope for this change; noted in proposal.
