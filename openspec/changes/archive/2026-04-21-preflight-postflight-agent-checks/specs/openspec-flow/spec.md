## MODIFIED Requirements

### Requirement: Single workflow file owns the full OpenSpec lifecycle

The system SHALL implement the complete OpenSpec automation lifecycle — plan, implement, and respond — within a single GitHub Actions workflow file (`.github/workflows/openspec-flow.yaml`). No second workflow file SHALL be required for any lifecycle stage. Repeated operation blocks (prune-comments, raise-comment, flip-label, handle-failure, **preflight, postflight**) SHALL be extracted into local composite actions under `.github/actions/` and called via `uses:` rather than duplicated inline. Each of the plan, implement, and respond jobs SHALL call `openspec-flow-preflight` before the agent step and `openspec-flow-postflight` after the agent step. When the preflight action sets `skip=true`, the agent step and all subsequent steps in that job SHALL be skipped.

#### Scenario: Plan job fires on issue assignment or start label
- **WHEN** a GitHub issue is assigned to the agent login, or the `openspec:start` label is added to an issue with no lifecycle label
- **THEN** the `plan` job runs: preflight is called first; if `skip=false`, the agent runs; postflight is called after the agent; if postflight fails, the handle-failure step runs

#### Scenario: Preflight skip aborts agent run cleanly
- **WHEN** the preflight action sets `skip=true` for any job
- **THEN** the agent step SHALL be skipped (via `if: steps.preflight.outputs.skip != 'true'`), no label flip SHALL occur for that run, and the job SHALL exit 0

#### Scenario: Postflight failure triggers handle-failure
- **WHEN** the postflight action exits non-zero for any job
- **THEN** the handle-failure composite action SHALL run, flipping the label to `openspec:failed` and posting a failure comment linking to the run

#### Scenario: Implement job fires on proposal PR merge
- **WHEN** a PR whose head branch matches `spec/<n>-<slug>` is merged into main and the linked issue is in `openspec:spec-ready`
- **THEN** the `implement` job runs with the same preflight/postflight guards as the plan job

#### Scenario: Respond job fires on openspec:start label on a PR
- **WHEN** the `openspec:start` label is added to a PR whose branch matches `spec/**` or `impl/**`
- **THEN** the `respond` job runs with the same preflight/postflight guards; preflight body-length check is skipped for respond

#### Scenario: Jobs share a single env block
- **WHEN** the workflow file is read
- **THEN** version pins, label names, the agent comment marker, and the minimum body length appear exactly once in the top-level `env:` block

#### Scenario: Composite actions called via uses
- **WHEN** any job needs to prune comments, raise a comment, flip a label, handle failure, run preflight, or run postflight
- **THEN** the job SHALL call the corresponding local composite action via `uses: ./.github/actions/<name>` rather than duplicating the shell script inline

#### Scenario: Checkout precedes composite action calls
- **WHEN** a job is about to call any local composite action
- **THEN** `actions/checkout` SHALL have already run in that job so the action files are present on disk
