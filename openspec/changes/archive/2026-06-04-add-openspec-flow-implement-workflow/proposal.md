## Why

The `openspec-flow` workflow covers the proposal stage (explore + spec), but once a proposal PR is merged there is no automation to drive the implementation. Engineers must manually invoke `openspec-apply`, `openspec-verify`, and `openspec-archive` — the three remaining lifecycle stages. A companion workflow closes this gap, triggering automatically on proposal PR merge and producing a ready-to-review code PR without manual intervention.

## What Changes

- **New file**: `.github/workflows/openspec-flow-implement.yaml` — workflow that fires when a `spec/<n>-*` branch is merged into `main`, runs the apply → verify → archive sequence via Claude Code, and opens a code PR.
- **New labels**: `openspec:implement` (workflow running) and `openspec:review` (code PR open, awaiting human review) added to the repo label set.
- **Label state machine update**: existing `openspec-flow.yaml` documentation and label lifecycle extended to include the two new states and their transitions.

## Capabilities

### New Capabilities

- `openspec-flow-implement`: Automates the implementation phase of the OpenSpec lifecycle. Triggered by a proposal PR merge, it invokes `openspec-apply-change`, `openspec-verify-change`, and `openspec-archive-change` skills in sequence and opens a single code PR containing the implementation, the archived change folder, and updated main specs.

### Modified Capabilities

(none — no existing spec-level behavior changes)

## Impact

- **`.github/workflows/`**: new `openspec-flow-implement.yaml`; no changes to `openspec-flow.yaml`
- **Repo labels**: two new labels must be created (`openspec:implement`, `openspec:review`) before first run
- **No source code changes**: purely GitHub Actions + OpenSpec metadata
- **Dependencies**: same runtime stack as `openspec-flow.yaml` (`@fission-ai/openspec`, `claude-code-action`, `bun`)
