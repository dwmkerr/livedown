## Why

The OpenSpec lifecycle is split across two workflow files (`openspec-flow.yaml` and `openspec-flow-implement.yaml`), duplicating roughly 100 lines of identical setup boilerplate and making it harder to reason about the full lifecycle in one place. Consolidating into a single file removes duplication and gives maintainers a single source of truth.

## What Changes

- Merge `openspec-flow-implement.yaml` into `openspec-flow.yaml` as a second job (`implement`).
- Rename the existing job in `openspec-flow.yaml` from `openspec-flow` to `plan` for clarity.
- Add a top-level `env:` block that is a superset of both files' env vars, eliminating duplication.
- The `on:` block gains a `pull_request: types: [closed]` trigger alongside the existing `issues` trigger.
- Each job retains its own `timeout-minutes`, `concurrency` group, trigger guard, and agent prompt.
- **Delete** `.github/workflows/openspec-flow-implement.yaml`.

## Capabilities

### New Capabilities

- `openspec-flow`: A single GitHub Actions workflow that drives the full OpenSpec lifecycle — plan (explore + build-spec) triggered by issue events, and implement (apply + verify + archive) triggered by proposal PR merge — within one file with shared configuration.

### Modified Capabilities

<!-- None: no existing spec-level requirements are changing; this is a pure structural consolidation. -->

## Impact

- `.github/workflows/openspec-flow.yaml` — expanded with second job and a single shared env block.
- `.github/workflows/openspec-flow-implement.yaml` — **deleted**.
- No changes to source code, OpenSpec CLI usage, labels, secrets, or agent prompts.
