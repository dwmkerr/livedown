# openspec-flow-composite-actions Specification

## Purpose

Four local GitHub Actions composite actions that encapsulate the repeated
operation blocks used by all three jobs in `openspec-flow.yaml`. Each action
lives under `.github/actions/<name>/action.yml` and is referenced via
`uses: ./.github/actions/<name>`.

## Requirements

### Requirement: prune-comments composite action deletes prior agent summary comments

The system SHALL provide a composite action at `.github/actions/openspec-flow-prune-comments/action.yml` that accepts a `gh-token` input (required), a `repo` input (required), and an `issue-number` input (required), and deletes all comments on the specified issue or PR whose body contains the value of the `AGENT_COMMENT_MARKER` environment variable.

#### Scenario: Prior agent comments exist
- **WHEN** the action runs and one or more comments on the issue/PR contain the agent comment marker
- **THEN** each matching comment SHALL be deleted via `gh api --method DELETE`

#### Scenario: No prior agent comments
- **WHEN** the action runs and no comments contain the agent comment marker
- **THEN** the action SHALL exit cleanly with a "No prior agent comments" log line and no DELETE calls

#### Scenario: Delete fails for one comment
- **WHEN** a DELETE call returns an error for a specific comment ID
- **THEN** the action SHALL emit a `::warning::` annotation and continue processing remaining IDs

### Requirement: raise-comment composite action posts a starting status comment

The system SHALL provide a composite action at `.github/actions/openspec-flow-raise-comment/action.yml` that accepts `gh-token`, `repo`, `issue-number`, `run-url`, and `message` inputs (all required), and posts a comment whose body starts with `AGENT_COMMENT_MARKER`, includes the message text, and ends with `---` followed by the `REENGAGE_FOOTER` environment variable value.

#### Scenario: Starting comment posted
- **WHEN** the action runs with valid inputs
- **THEN** a comment SHALL be created on the issue/PR via `gh issue comment` with the marker as the first line

#### Scenario: Re-engagement footer always present
- **WHEN** any starting comment is posted by this action
- **THEN** the final two lines of the comment body SHALL be `---` and the value of `REENGAGE_FOOTER`

### Requirement: flip-label composite action transitions issue labels

The system SHALL provide a composite action at `.github/actions/openspec-flow-flip-label/action.yml` that accepts `gh-token`, `repo`, `issue-number`, `remove-label`, and `add-label` inputs (all required), removes the specified label from the issue, and adds the new label.

#### Scenario: Successful label flip
- **WHEN** the action runs with an issue that has the remove-label applied
- **THEN** the remove-label SHALL be removed and add-label SHALL be added in a single `gh issue edit` call

#### Scenario: Remove-label not present
- **WHEN** the action runs and the issue does not have the remove-label
- **THEN** the `--remove-label` call SHALL fail silently (exit 0) and the add-label SHALL still be applied

### Requirement: handle-failure composite action posts failure comment and flips to failed label

The system SHALL provide a composite action at `.github/actions/openspec-flow-handle-failure/action.yml` that accepts `gh-token`, `repo`, `issue-number`, `run-url`, `current-label`, and `message` inputs (all required), removes the `current-label`, adds `LABEL_FAILED`, and posts a failure comment with the marker header and re-engagement footer.

#### Scenario: Failure comment posted with failed label
- **WHEN** the action runs after a job step fails
- **THEN** the current-label SHALL be removed, `LABEL_FAILED` SHALL be added, and a comment SHALL be posted starting with `AGENT_COMMENT_MARKER` and containing the run URL

#### Scenario: Label removal failure does not block comment
- **WHEN** the label removal call fails (e.g., label not present)
- **THEN** the action SHALL continue and still post the failure comment
