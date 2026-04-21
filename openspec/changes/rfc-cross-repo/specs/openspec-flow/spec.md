## ADDED Requirements

### Requirement: Plan job supports opt-in cross-repo issue creation

The plan job SHALL include a post-agent step that reads `/tmp/cross-repo-issues.json`, validates every listed repository against `OPENSPEC_CROSS_REPO_REPOS`, and posts a safeguard comment when any issues were created. When `OPENSPEC_CROSS_REPO_REPOS` is empty, this step SHALL be a no-op.

#### Scenario: OPENSPEC_CROSS_REPO_REPOS is empty

- **WHEN** the plan job runs and `OPENSPEC_CROSS_REPO_REPOS` is empty or unset
- **THEN** the manifest-read step SHALL exit 0 without posting any comment
- **AND** the plan agent prompt SHALL contain no cross-repo instructions

#### Scenario: OPENSPEC_CROSS_REPO_REPOS is non-empty and issues were created

- **WHEN** the plan job runs and `OPENSPEC_CROSS_REPO_REPOS` contains at least one repo
- **AND** the plan agent writes one or more entries to `/tmp/cross-repo-issues.json`
- **THEN** the manifest-read step SHALL validate each repo against the allowlist
- **AND** post a safeguard comment on the originating issue containing the standard `AGENT_COMMENT_MARKER`, a warning banner, and a bulleted list of created issue URLs with titles

#### Scenario: Manifest contains non-allowlisted repo

- **WHEN** the manifest-read step finds a repo in `/tmp/cross-repo-issues.json` that is not in `OPENSPEC_CROSS_REPO_REPOS`
- **THEN** the step SHALL exit non-zero, causing the handle-failure step to run and flip the issue label to `openspec:failed`

### Requirement: OPENSPEC_CROSS_REPO_REPOS env var declared at workflow level

The workflow `env:` block SHALL include `OPENSPEC_CROSS_REPO_REPOS: ""` so the variable is declared in one place and visible to all jobs. When the operator enables the feature, they update this value in the workflow file or via a repo-level env override.

#### Scenario: Env var present in workflow file

- **WHEN** the workflow file is read
- **THEN** `OPENSPEC_CROSS_REPO_REPOS` SHALL appear exactly once in the top-level `env:` block with a default value of empty string
