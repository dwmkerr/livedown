# postflight-agent-checks Specification

## Purpose

A composite GitHub Actions action
(`.github/actions/openspec-flow-postflight/action.yml`) that asserts
observable output was produced after an agent step runs in the
OpenSpec Flow workflow. It checks for new commits (HEAD differs from
a captured base SHA) or a marker comment on the issue/PR, with retry
logic to absorb API lag. On failure it exits non-zero so the calling
job's handle-failure step can flip the label to `openspec:failed`.

## Requirements

### Requirement: postflight composite action asserts observable agent output

The system SHALL provide a composite action at
`.github/actions/openspec-flow-postflight/action.yml` that accepts the
following inputs: `gh-token` (required), `repo` (required),
`issue-number` (required), `job` (required; one of `plan`,
`implement`, `respond`), `base-sha` (required; the `git rev-parse
HEAD` value captured before the agent step ran), and `run-url`
(required). The action SHALL assert that at least one of the following
is true: the current HEAD SHA differs from `base-sha` (new commits
pushed), OR a comment on the issue/PR containing the
`AGENT_COMMENT_MARKER` was posted after the agent started. When the
assertion passes the action exits 0. When the assertion fails the
action SHALL exit with a non-zero status so the calling job can handle
failure normally.

#### Scenario: Agent pushed new commits — assertion passes
- **WHEN** the action runs and `git rev-parse HEAD` differs from
  `base-sha`
- **THEN** the action SHALL log the number of new commits, set
  `passed=true` output, and exit 0

#### Scenario: Agent posted a marker comment — assertion passes
- **WHEN** the action runs and HEAD SHA equals `base-sha` but a comment
  on the issue/PR contains the `AGENT_COMMENT_MARKER`
- **THEN** the action SHALL log that a marker comment was found, set
  `passed=true` output, and exit 0

#### Scenario: No new commits and no marker comment — assertion fails
- **WHEN** the action runs and HEAD SHA equals `base-sha` AND no
  comment on the issue/PR contains the `AGENT_COMMENT_MARKER`
- **THEN** the action SHALL set `passed=false` output and exit 1

#### Scenario: Marker comment fetch retries on transient API lag
- **WHEN** the first fetch of issue/PR comments returns zero marker
  comments but HEAD SHA equals `base-sha`
- **THEN** the action SHALL retry the comment fetch up to 3 times with
  a 5-second pause between attempts before concluding no marker comment
  is present

#### Scenario: Postflight does not post its own comment
- **WHEN** the action runs (regardless of pass or fail)
- **THEN** the action SHALL NOT post any comment on the issue or PR —
  all commenting is the responsibility of the calling job's
  handle-failure step
