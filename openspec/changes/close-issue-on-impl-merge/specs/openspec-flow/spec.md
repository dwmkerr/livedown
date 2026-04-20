## ADDED Requirements

### Requirement: Cleanup job runs on impl PR merge

The workflow SHALL include a `cleanup-on-impl-merge` job that triggers on `pull_request` `closed` events where `github.event.pull_request.merged == true` and the head branch matches `impl/**`.

#### Scenario: Cleanup job triggers on merged impl PR

- **WHEN** a pull_request closed event fires with `merged == true` and head branch matching `impl/<n>-*`
- **THEN** the `cleanup-on-impl-merge` job SHALL run

#### Scenario: Cleanup job skipped on non-merged close

- **WHEN** a pull_request closed event fires with `merged == false`
- **THEN** the `cleanup-on-impl-merge` job SHALL NOT run

#### Scenario: Cleanup job skipped for non-impl branches

- **WHEN** a pull_request closed event fires for a branch not matching `impl/**`
- **THEN** the `cleanup-on-impl-merge` job SHALL NOT run

## MODIFIED Requirements

### Requirement: Implement stage label lifecycle preserved

The system SHALL transition the issue from `openspec:spec-ready` through `openspec:implement` to `openspec:review` during the implement job run. On merge of the resulting impl PR, the `openspec:review` label SHALL be removed and the issue SHALL be closed.

#### Scenario: Implement stage label lifecycle preserved

- **WHEN** the implement job runs successfully
- **THEN** the issue transitions from `openspec:spec-ready` through `openspec:implement` to `openspec:review`

#### Scenario: Post-merge label cleanup

- **WHEN** the impl PR is merged
- **THEN** the `openspec:review` label SHALL be removed from the issue and the issue SHALL be closed
