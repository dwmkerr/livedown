## ADDED Requirements

### Requirement: Impl PR merge closes linked issue automatically

The implement agent SHALL use `Closes #<n>` (not `Refs #<n>`) in the PR body so that GitHub auto-closes the linked issue when the impl PR is merged.

#### Scenario: PR body uses Closes keyword

- **WHEN** the implement agent opens an impl PR for issue `<n>`
- **THEN** the PR body SHALL contain `Closes #<n>` so GitHub closes the issue on merge

### Requirement: openspec:review label removed on impl PR merge

The workflow SHALL remove the `openspec:review` label from the linked issue when an impl PR (head branch matching `impl/<n>-*`) is merged into the default branch.

#### Scenario: Impl PR merged with openspec:review label present

- **WHEN** a PR whose head branch matches `impl/<n>-*` is merged
- **THEN** the workflow SHALL extract `<n>` from the branch name and remove the `openspec:review` label from issue `<n>`

#### Scenario: Impl PR merged with openspec:review label absent

- **WHEN** a PR whose head branch matches `impl/<n>-*` is merged and the issue does not have the `openspec:review` label
- **THEN** the workflow SHALL attempt removal and complete without error

#### Scenario: Impl PR closed without merging

- **WHEN** a PR whose head branch matches `impl/<n>-*` is closed but NOT merged
- **THEN** the cleanup job SHALL NOT run and no labels SHALL be removed
