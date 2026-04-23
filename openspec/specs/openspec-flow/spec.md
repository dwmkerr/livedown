# openspec-flow Specification

## Purpose

A single GitHub Actions workflow that automates the full OpenSpec
lifecycle — **plan**, **implement**, and **respond** — from a single file
(`.github/workflows/openspec-flow.yaml`). The workflow turns GitHub
events into OpenSpec stages, drives Claude Code to produce the artifacts
and code, and maintains the issue/PR label lifecycle so humans know
exactly what state each piece of work is in.

## Requirements

### Requirement: Single workflow file owns the full OpenSpec lifecycle

The system SHALL implement the complete OpenSpec automation lifecycle —
plan, implement, and respond — within a single GitHub Actions workflow
file (`.github/workflows/openspec-flow.yaml`). No second workflow file
SHALL be required for any lifecycle stage. Repeated operation blocks
(prune-comments, raise-comment, flip-label, handle-failure,
**preflight, postflight**) SHALL be extracted into local composite
actions under `.github/actions/` and called via `uses:` rather than
duplicated inline. Each of the plan, implement, and respond jobs SHALL
call `openspec-flow-preflight` before the agent step and
`openspec-flow-postflight` after the agent step. When the preflight
action sets `skip=true`, the agent step and all subsequent steps in
that job SHALL be skipped.

The plan and implement jobs SHALL each include a post-agent step that
scrapes the Claude session log using `dwmkerr/claude-toolkit` and injects
a usage table (see `pr-usage-table` spec) into the PR body, positioned
after the recap paragraph and before the `---` separator. The agent
prompts SHALL NOT be modified to self-report usage; the session log is the
authoritative source.

#### Scenario: Plan job fires on issue assignment or start label
- **WHEN** a GitHub issue is assigned to the agent login, or the
  `openspec:start` label is added to an issue with no lifecycle label
- **THEN** the `plan` job runs, opens a `spec/<n>-<slug>` proposal PR,
  and a post-agent step scrapes the session log via `dwmkerr/claude-toolkit`
  and injects a usage table between `<!-- openspec-flow-usage-table -->`
  and `<!-- /openspec-flow-usage-table -->` markers into the PR body

#### Scenario: Preflight skip aborts agent run cleanly
- **WHEN** the preflight action sets `skip=true` for any job
- **THEN** the agent step SHALL be skipped (via
  `if: steps.preflight.outputs.skip != 'true'`), no label flip SHALL
  occur for that run, and the job SHALL exit 0

#### Scenario: Postflight failure triggers handle-failure
- **WHEN** the postflight action exits non-zero for any job
- **THEN** the handle-failure composite action SHALL run, flipping the
  label to `openspec:failed` and posting a failure comment linking to
  the run

#### Scenario: Implement job fires on proposal PR merge
- **WHEN** a PR whose head branch matches `spec/<n>-<slug>` is merged
  into main and the linked issue is in `openspec:spec-ready`
- **THEN** the `implement` job runs, opens an `impl/<n>-<slug>` code PR,
  and a post-agent step scrapes the session log via `dwmkerr/claude-toolkit`
  and injects a usage table between `<!-- openspec-flow-usage-table -->`
  and `<!-- /openspec-flow-usage-table -->` markers into the PR body

#### Scenario: Respond job fires on openspec:start label on a PR
- **WHEN** the `openspec:start` label is added to a PR whose branch
  matches `spec/**` or `impl/**`
- **THEN** the `respond` job runs with the same preflight/postflight
  guards; preflight body-length check is skipped for respond

#### Scenario: Jobs share a single env block
- **WHEN** the workflow file is read
- **THEN** version pins, label names, the agent comment marker, and the
  minimum body length appear exactly once in the top-level `env:` block

#### Scenario: Composite actions called via uses
- **WHEN** any job needs to prune comments, raise a comment, flip a
  label, handle failure, run preflight, or run postflight
- **THEN** the job SHALL call the corresponding local composite action
  via `uses: ./.github/actions/<name>` rather than duplicating the
  shell script inline

#### Scenario: Checkout precedes composite action calls
- **WHEN** a job is about to call any local composite action
- **THEN** `actions/checkout` SHALL have already run in that job so the
  action files are present on disk

### Requirement: No behaviour change from consolidation

The plan and implement stages SHALL behave identically after
consolidation — same trigger conditions, same label transitions, same
agent prompts, same secrets handling, and same timeout values as the
two original workflows (`openspec-flow.yaml` plan stage and
`openspec-flow-implement.yaml` implement stage).

#### Scenario: Plan stage label lifecycle preserved
- **WHEN** the plan job runs successfully
- **THEN** the issue transitions from `openspec:exploring` to
  `openspec:spec-ready`

#### Scenario: Implement stage label lifecycle preserved
- **WHEN** the implement job runs successfully
- **THEN** the issue transitions from `openspec:spec-ready` through
  `openspec:implement` to `openspec:review`

#### Scenario: Failure handling preserved for all jobs
- **WHEN** any job fails
- **THEN** the issue/PR is labelled `openspec:failed` and a comment
  linking to the run is posted

### Requirement: Respond job refines artifacts from PR conversation

The system SHALL read the full PR conversation (issue comments, review
bodies, and review comments) and instruct the agent to refine the
relevant artifacts accordingly, when the `openspec:start` label is
added to a PR whose branch matches `spec/**` or `impl/**`.

#### Scenario: Discussion requests a change to the proposal
- **WHEN** a reviewer asks for a change to scope or motivation on a
  `spec/**` PR
- **THEN** the agent SHALL update `proposal.md` and re-validate with
  `openspec validate <slug> --strict`

#### Scenario: Discussion requests a change to design or specs
- **WHEN** a reviewer asks for a technical change or additional
  requirement
- **THEN** the agent SHALL update `design.md` and/or the relevant
  `specs/**/*.md` file

#### Scenario: Discussion requests a change to tasks
- **WHEN** a reviewer asks to add or remove a deliverable
- **THEN** the agent SHALL update `tasks.md`

#### Scenario: Discussion requests a change to implementation
- **WHEN** a reviewer asks for a change on an `impl/**` PR
- **THEN** the agent SHALL update the relevant source files and push
  to the PR branch

#### Scenario: Nothing to change
- **WHEN** the agent determines the existing artifacts already reflect
  the discussion
- **THEN** the agent SHALL post a summary comment stating that no
  changes were needed and why

### Requirement: openspec:start label removed after respond run

The workflow SHALL remove the `openspec:start` label from the PR after
the respond agent step completes, regardless of whether changes were
made.

#### Scenario: Successful respond run
- **WHEN** the respond agent step exits successfully
- **THEN** a workflow step SHALL remove the `openspec:start` label from
  the PR

#### Scenario: Failed respond run
- **WHEN** the respond agent step fails
- **THEN** a workflow step SHALL still remove the `openspec:start`
  label and post a failure comment linking to the run

### Requirement: Agent summary comments are prunable

Every agent-authored status comment posted by the workflow SHALL begin
with a literal marker line (`<!-- openspec-flow-summary -->`) so that
subsequent workflow runs can find and delete prior comments authored by
the agent. Before posting any new summary comment, the workflow SHALL
delete all prior comments on the same issue/PR that contain the marker.

#### Scenario: New summary supersedes prior summary
- **WHEN** any job (plan, implement, or respond) is about to post a
  status comment on an issue or PR
- **THEN** a workflow step SHALL first delete every prior comment on
  that issue/PR whose body contains the marker

#### Scenario: Human comments are never deleted
- **WHEN** the prune step runs
- **THEN** only comments whose body contains the marker SHALL be
  deleted — human comments (which never contain the marker) MUST be
  preserved

### Requirement: Agent comments include a re-engagement footer

Every agent-authored status comment posted by the workflow SHALL end
with a horizontal rule (`---`) on its own line followed by the text:
"Add the `openspec:start` label to re-engage the agent with the latest
discussion."

#### Scenario: Any agent comment posted
- **WHEN** the workflow or the agent posts a status comment on an
  issue or PR
- **THEN** the final two lines of the comment body SHALL be `---` and
  the re-engagement footer, in that order
