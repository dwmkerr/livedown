## ADDED Requirements

### Requirement: Single workflow file owns the full OpenSpec lifecycle
The system SHALL implement the complete OpenSpec automation lifecycle — plan and implement — within a single GitHub Actions workflow file (`openspec-flow.yaml`). No second workflow file SHALL be required for any lifecycle stage.

#### Scenario: Plan stage fires on issue assignment
- **WHEN** a GitHub issue is assigned to the agent login or the `openspec:start` label is added
- **THEN** the `plan` job runs and the `implement` job exits early with `run=false`

#### Scenario: Implement stage fires on proposal PR merge
- **WHEN** a PR whose head branch matches `spec/<n>-<slug>` is merged into main
- **THEN** the `implement` job runs and the `plan` job exits early with `run=false`

#### Scenario: Both jobs share a single env block
- **WHEN** the workflow file is read
- **THEN** version pins (`CLAUDE_CODE_ACTION_REF`, `OPENSPEC_CLI_VERSION`) and label names appear exactly once in the top-level `env:` block

#### Scenario: Deleting the implement workflow file
- **WHEN** the change is implemented
- **THEN** `.github/workflows/openspec-flow-implement.yaml` SHALL not exist in the repository

### Requirement: No behaviour change from consolidation
The plan and implement stages SHALL behave identically after consolidation — same trigger conditions, same label transitions, same agent prompts, same secrets handling, and same timeout values.

#### Scenario: Label lifecycle is preserved for plan stage
- **WHEN** the plan job runs successfully
- **THEN** the issue transitions from `openspec:exploring` to `openspec:spec-ready`, matching the behaviour of the original `openspec-flow.yaml`

#### Scenario: Label lifecycle is preserved for implement stage
- **WHEN** the implement job runs successfully
- **THEN** the issue transitions from `openspec:spec-ready` to `openspec:review`, matching the behaviour of the original `openspec-flow-implement.yaml`

#### Scenario: Failure handling is preserved for both jobs
- **WHEN** either job fails
- **THEN** the issue is labelled `openspec:failed` and a comment with a run URL is posted, matching the existing failure handlers
