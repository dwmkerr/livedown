## ADDED Requirements

### Requirement: Respond workflow triggers on openspec:start label
The system SHALL provide a GitHub Actions workflow (`openspec-flow-respond.yaml`) that fires when the `openspec:start` label is added to any issue or pull request in the repository.

#### Scenario: Label added to issue
- **WHEN** the `openspec:start` label is added to a GitHub issue
- **THEN** the workflow SHALL start, detect the issue context, and engage the agent to re-read the full discussion thread

#### Scenario: Label added to pull request
- **WHEN** the `openspec:start` label is added to a pull request whose branch matches `spec/**` or `impl/**`
- **THEN** the workflow SHALL start, detect the PR context, and engage the agent to re-read all PR comments and review threads

#### Scenario: Label added with no change folder present
- **WHEN** the `openspec:start` label is added to an issue that has no corresponding change folder in `openspec/changes/`
- **THEN** the workflow SHALL skip without error and leave the label for the primary `openspec-flow.yaml` to consume

### Requirement: Agent refines artifacts based on discussion
The system SHALL instruct the agent to read all comments since the last agent action, identify any requested changes, and update the relevant OpenSpec artifacts in the change folder accordingly.

#### Scenario: Discussion requests a change to the proposal
- **WHEN** a comment requests a change to scope or motivation
- **THEN** the agent SHALL update `proposal.md` to reflect the new understanding

#### Scenario: Discussion requests a change to design or specs
- **WHEN** a comment requests a technical change or additional requirement
- **THEN** the agent SHALL update `design.md` and/or the relevant `specs/**/*.md` file

#### Scenario: Discussion requests a task addition or removal
- **WHEN** a comment requests adding or removing a deliverable
- **THEN** the agent SHALL update `tasks.md` to reflect the change

### Requirement: Agent posts a summary comment after acting
After completing its changes, the agent SHALL post one comment on the issue or PR listing each artifact it modified and a brief description of what changed.

#### Scenario: One or more artifacts updated
- **WHEN** the agent modifies one or more artifact files
- **THEN** the agent SHALL post a comment listing each modified artifact and the nature of the change

#### Scenario: No changes needed
- **WHEN** the agent determines the existing artifacts already reflect the discussion
- **THEN** the agent SHALL post a comment stating that no changes were needed and why

### Requirement: openspec:start label removed after agent run
The workflow SHALL remove the `openspec:start` label from the issue or PR after the agent step completes, regardless of whether changes were made.

#### Scenario: Successful agent run
- **WHEN** the agent step exits successfully
- **THEN** a workflow step SHALL remove the `openspec:start` label

#### Scenario: Failed agent run
- **WHEN** the agent step fails
- **THEN** a workflow step SHALL remove the `openspec:start` label and post an error comment linking to the failed run

### Requirement: Automated flow comments include re-engagement footer
All comments posted by the agent in `openspec-flow.yaml` and `openspec-flow-implement.yaml` SHALL include a footer line: "Add the `openspec:start` label to re-engage the agent with the latest discussion."

#### Scenario: Agent posts a comment in any OpenSpec flow
- **WHEN** the agent posts a comment as part of any OpenSpec automated workflow
- **THEN** the comment SHALL end with the re-engagement footer on a new line after a horizontal rule (`---`)
