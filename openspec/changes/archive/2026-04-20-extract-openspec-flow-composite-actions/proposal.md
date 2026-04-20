## Why

`openspec-flow.yaml` (~711 lines) contains four identical operation blocks repeated across the `explore`, `change`, and `respond` jobs, making the workflow hard to maintain and error-prone to update. Extracting these into local composite actions eliminates the duplication and gives each operation a single source of truth.

## What Changes

- Add `.github/actions/openspec-flow-prune-comments/action.yml` — deletes prior agent summary comments from an issue
- Add `.github/actions/openspec-flow-raise-comment/action.yml` — posts a "starting…" status comment on an issue
- Add `.github/actions/openspec-flow-flip-label/action.yml` — removes one issue label and adds another
- Add `.github/actions/openspec-flow-handle-failure/action.yml` — posts a failure comment and flips to the failed label
- Move the `actions/checkout` step earlier in each job (before `prune-comments`) so the local composite actions are available
- Replace all four inline operation blocks in `openspec-flow.yaml` with `uses:` references to the new composite actions
- Pure refactor: zero behaviour change; all inputs are threaded via `GH_TOKEN` for testability

## Capabilities

### New Capabilities

- `openspec-flow-composite-actions`: Four reusable GitHub composite actions that encapsulate the shared operation blocks from `openspec-flow.yaml`

### Modified Capabilities

- `openspec-flow`: Checkout step moves earlier; inline operation blocks replaced with composite action calls — no requirement changes, implementation-only refactor

## Impact

- `.github/actions/` — four new directories, each with `action.yml`
- `.github/workflows/openspec-flow.yaml` — step ordering and inline blocks change; net line count drops significantly
- No API, dependency, or security model changes
