# openspec-flow-implement

## Purpose

The `openspec-flow-implement` workflow automates the implementation lifecycle stages (apply + verify + archive) after a proposal PR is merged. It runs Claude Code against the linked issue's change folder and opens a code PR, flipping `openspec:*` lifecycle labels as it progresses.

## Requirements

### Requirement: Workflow triggers on proposal PR merge
The `openspec-flow-implement` workflow SHALL fire when a pull request whose head branch matches `spec/<n>-*` is merged into `main`, where `<n>` is a positive integer (the linked issue number).

#### Scenario: Proposal PR merged with correct branch pattern
- **WHEN** a pull request with head branch `spec/26-add-something` is merged into `main`
- **THEN** the `openspec-flow-implement` workflow run starts

#### Scenario: Non-spec PR merged — workflow does not fire
- **WHEN** a pull request with head branch `fix/some-bug` is merged into `main`
- **THEN** the `openspec-flow-implement` workflow does NOT start

#### Scenario: Spec PR closed without merging — workflow does not fire
- **WHEN** a pull request with head branch `spec/26-add-something` is closed without merging
- **THEN** the `openspec-flow-implement` workflow does NOT start

### Requirement: Workflow verifies issue carries openspec:spec-ready label
Before running the agent, the workflow SHALL verify that the linked issue (extracted from the branch name) carries the `openspec:spec-ready` label. If it does not, the run SHALL exit without performing any work.

#### Scenario: Issue has openspec:spec-ready — proceed
- **WHEN** the linked issue carries the `openspec:spec-ready` label
- **THEN** the workflow proceeds to the agent run step

#### Scenario: Issue lacks openspec:spec-ready — skip
- **WHEN** the linked issue does not carry the `openspec:spec-ready` label
- **THEN** the workflow exits with `run=false` and does not start the agent

### Requirement: Workflow verifies required labels exist in repo
Before the agent run, the workflow SHALL verify that all six `openspec:*` labels (`openspec:start`, `openspec:exploring`, `openspec:spec-ready`, `openspec:implement`, `openspec:review`, `openspec:failed`) exist in the repository. Any missing label SHALL cause a fast-fail with an issue comment listing the missing labels and the `gh label create` commands to fix them.

#### Scenario: All labels present — proceed
- **WHEN** all six `openspec:*` labels exist in the repo
- **THEN** the workflow proceeds past the label verification step

#### Scenario: One or more labels missing — fail fast
- **WHEN** one or more of the required labels is absent from the repo
- **THEN** the workflow posts an issue comment listing missing labels and creation commands, then exits with a non-zero status

### Requirement: Workflow flips issue label from spec-ready to implement at start
When the run begins (trigger matched, labels verified), the workflow SHALL remove `openspec:spec-ready` from the linked issue and add `openspec:implement`, then post a comment that a code PR will open automatically.

#### Scenario: Label flip at run start
- **WHEN** the trigger fires and checks pass
- **THEN** `openspec:spec-ready` is removed, `openspec:implement` is added, and a comment is posted on the issue

### Requirement: Agent runs apply then verify then archive in sequence
The workflow SHALL invoke Claude Code with a prompt that delegates to the `openspec-apply-change`, `openspec-verify-change`, and `openspec-archive-change` skills in sequence for the identified change. All three stages SHALL run in one workflow job and produce a single code PR.

#### Scenario: All three stages complete successfully
- **WHEN** the agent completes apply, verify, and archive without error
- **THEN** a code PR is open containing implementation files, the archived change folder, and updated main specs

#### Scenario: Apply stage fails
- **WHEN** `openspec-apply-change` reports an unrecoverable error
- **THEN** the agent does not proceed to verify or archive, and the workflow run fails

### Requirement: Workflow flips issue label to openspec:review after code PR opens
On successful completion of the agent run, the workflow SHALL remove `openspec:implement` from the linked issue and add `openspec:review`.

#### Scenario: Agent run succeeds — label flip to review
- **WHEN** the agent run step exits successfully
- **THEN** `openspec:implement` is removed and `openspec:review` is added on the linked issue

### Requirement: Workflow flips issue label to openspec:failed on any failure
If any workflow step fails after the run has been triggered, the workflow SHALL remove the current lifecycle label and add `openspec:failed` to the linked issue, and post a comment with a link to the failed run.

#### Scenario: Any step fails after trigger
- **WHEN** any step after the trigger check fails
- **THEN** the current lifecycle label is removed, `openspec:failed` is added, and a comment with the run URL is posted on the issue

### Requirement: Workflow verifies OpenSpec scaffold present in repo
Before running the agent, the workflow SHALL verify that `.claude/skills/openspec-apply-change/SKILL.md` exists. If absent, the workflow SHALL post an issue comment with setup instructions and exit with a non-zero status.

#### Scenario: Scaffold present — proceed
- **WHEN** `.claude/skills/openspec-apply-change/SKILL.md` exists
- **THEN** the workflow proceeds past the scaffold check

#### Scenario: Scaffold absent — fail fast with instructions
- **WHEN** `.claude/skills/openspec-apply-change/SKILL.md` does not exist
- **THEN** the workflow posts an issue comment with `openspec init --tools claude` instructions, flips to `openspec:failed`, and exits with a non-zero status
