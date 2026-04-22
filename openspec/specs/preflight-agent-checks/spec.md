# preflight-agent-checks Specification

## Purpose

A composite GitHub Actions action
(`.github/actions/openspec-flow-preflight/action.yml`) that validates
pre-conditions before an agent step runs in the OpenSpec Flow workflow.
For the plan job, it checks that the issue body meets a minimum length
threshold; for implement and respond jobs it always passes. When a
pre-condition is not met it posts an informational skip comment and
sets a `skip=true` output so the caller can gate subsequent steps.

## Requirements

### Requirement: preflight composite action validates pre-conditions before an agent step

The system SHALL provide a composite action at
`.github/actions/openspec-flow-preflight/action.yml` that accepts the
following inputs: `gh-token` (required), `repo` (required),
`issue-number` (required), `job` (required; one of `plan`,
`implement`, `respond`), and `min-body-length` (optional; default
`40`). The action SHALL run synchronously and either exit cleanly
(skip) or exit 0 (pass) — it SHALL NOT flip labels or post marker
comments on pass.

#### Scenario: Issue body is too short (plan job)
- **WHEN** the action runs with `job=plan` and the issue body length is
  less than `min-body-length`
- **THEN** the action SHALL post a skip comment on the issue (without
  the `AGENT_COMMENT_MARKER` prefix) explaining that the issue body is
  too short, set a `skip=true` output, and exit 0

#### Scenario: Issue body meets length threshold (plan job)
- **WHEN** the action runs with `job=plan` and the issue body length is
  >= `min-body-length`
- **THEN** the action SHALL set `skip=false` output and exit 0 without
  posting any comment

#### Scenario: Issue body check is skipped for respond job
- **WHEN** the action runs with `job=respond`
- **THEN** the action SHALL NOT check the issue body length, SHALL set
  `skip=false` output, and exit 0

#### Scenario: Issue body check is skipped for implement job
- **WHEN** the action runs with `job=implement`
- **THEN** the action SHALL NOT check the issue body length, SHALL set
  `skip=false` output, and exit 0

#### Scenario: Skip comment format
- **WHEN** the action posts a skip comment
- **THEN** the comment body SHALL begin with `> ` (blockquote), SHALL
  state the specific pre-condition that was not met, SHALL include a
  link to the run URL via `RUN_URL`, and SHALL NOT include the
  `AGENT_COMMENT_MARKER` or the `REENGAGE_FOOTER`
