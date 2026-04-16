## Context

The repository currently has two GitHub Actions workflow files that together implement the full OpenSpec automation lifecycle:

- `openspec-flow.yaml` — propose stage: triggered by issue assignment or `openspec:start` label; drives explore + build-spec; outputs a proposal PR.
- `openspec-flow-implement.yaml` — implement stage: triggered when a `spec/**` PR merges into main; drives apply + verify + archive; outputs a code PR.

Both files share a large block of identical setup steps (Node, OpenSpec CLI, claude-code-action clone, bun, dependency install) and nearly identical failure-handling steps. The shared env vars are duplicated. This makes the lifecycle harder to follow at a glance and creates a maintenance surface where a version bump (e.g. `CLAUDE_CODE_ACTION_REF`) must be applied in two places.

## Goals / Non-Goals

**Goals:**
- Merge both workflow files into a single `openspec-flow.yaml`.
- Eliminate duplicated env vars via a top-level `env:` block.
- Eliminate duplicated setup/teardown steps by moving shared steps into a reusable composite action, OR by accepting one copy of setup steps per job (simpler, lower risk).
- Keep the full OpenSpec lifecycle visible in one file.
- No behaviour changes — labels, agent prompts, trigger conditions, timeouts, and secrets handling are all preserved.

**Non-Goals:**
- Refactoring the agent prompts.
- Changing label names or the lifecycle state machine.
- Adding new workflow capabilities (e.g. auto-close issue on code PR merge).
- Extracting a reusable composite action (deferred; adds complexity without clear need now).

## Decisions

### Single file, two jobs (not a composite action)

**Decision**: Merge into one file with a `propose` job and an `implement` job. Do not extract shared steps into a composite action.

**Rationale**: A composite action would require a new file in `.github/actions/` and another layer of indirection. The duplication is boilerplate (setup steps), not logic, and the two jobs' setup steps are already identical enough that they stay in sync trivially. One file with two jobs is the simplest thing that satisfies the issue.

**Alternative considered**: Extract shared setup into `.github/actions/openspec-setup/action.yml`. Rejected for now because it adds a new file and an `uses:` indirection without meaningful benefit at the current scale. Can be revisited if a third stage is added.

### Job naming: `propose` and `implement`

**Decision**: Rename the existing `openspec-flow` job to `propose` and name the new job `implement`.

**Rationale**: Short, descriptive names that match the lifecycle stage names used in comments and the OpenSpec documentation. Avoids the redundant `openspec-flow-` prefix that was needed when the jobs lived in separate files.

### Top-level `env:` block

**Decision**: Merge all env vars from both files into a single top-level `env:` block. Job-level env vars are used only where a value differs between jobs (currently none — all values are identical).

**Rationale**: Single source of truth for version pins and label names. A reviewer bumping `CLAUDE_CODE_ACTION_REF` edits one line.

### `on:` block: combine both triggers

**Decision**: The single workflow declares both `issues: types: [assigned, labeled]` and `pull_request: types: [closed] branches: [main]`. Each job's trigger guard (`check` step) ensures only the appropriate job runs for each event.

**Rationale**: GitHub Actions supports multiple event types in a single `on:` block. The existing trigger-guard logic in each job already handles the filtering correctly; no change needed there.

### Concurrency groups remain per-job

**Decision**: Keep `concurrency:` at the job level, not the workflow level, using the existing keys (`openspec-flow-${{ github.event.issue.number }}` and `openspec-flow-implement-${{ github.event.pull_request.number }}`).

**Rationale**: Workflow-level concurrency would block both jobs on the same key, which is wrong — a new issue assignment should not be blocked by an in-progress implement run. Per-job concurrency preserves the existing isolation.

## Risks / Trade-offs

- **Cross-fire on wrong event type**: When a `pull_request` event fires, the `propose` job's trigger guard (`check-trigger`) will run and evaluate `EVENT_ACTION` as `closed` (not `assigned`/`labeled`), so it exits with `run=false`. Similarly the `implement` job guard exits `run=false` on `issues` events. This is the existing pattern and is correct — but it means every event fires both jobs' first step (the check). Overhead is negligible.

  Mitigation: Keep the trigger-guard logic unchanged; it already handles this correctly.

- **Single file length**: The merged file will be ~600–700 lines. Still readable; YAML syntax highlighting makes job boundaries clear.

  Mitigation: Retain the existing comment headers to make job boundaries obvious at a glance.

- **Version pin drift**: Consolidation actually reduces this risk (one place to update). No new risk introduced.

## Migration Plan

1. Copy the full `openspec-flow-implement.yaml` job body into `openspec-flow.yaml` as job `implement`.
2. Rename the existing job from `openspec-flow` to `propose`.
3. Merge env var blocks; remove duplicates.
4. Expand the `on:` block with the `pull_request` trigger.
5. Verify both jobs' trigger guards still reference the correct env vars (all refs become top-level `env:` now).
6. Delete `openspec-flow-implement.yaml`.
7. Smoke-test: manually trigger each job path in a branch or dry-run; confirm the other job exits early.

Rollback: `git revert` the single commit; the deleted file is recoverable from git history.

## Open Questions

- None blocking. The composite-action extraction question is explicitly deferred.
