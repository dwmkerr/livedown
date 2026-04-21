## ADDED Requirements

### Requirement: Cross-repo issue creation is opt-in via allowlist

The system SHALL disable cross-repo issue creation by default. The feature SHALL only be activated when the `OPENSPEC_CROSS_REPO_REPOS` workflow environment variable is set to a non-empty comma-separated list of `owner/repo` strings.

#### Scenario: Feature disabled by default

- **WHEN** `OPENSPEC_CROSS_REPO_REPOS` is empty or unset
- **THEN** the plan agent SHALL receive no cross-repo instructions, SHALL NOT create issues in any external repository, and the manifest-read step SHALL be a no-op

#### Scenario: Feature enabled with valid allowlist

- **WHEN** `OPENSPEC_CROSS_REPO_REPOS` is set to one or more `owner/repo` entries
- **THEN** the plan agent's prompt SHALL include cross-repo issue creation instructions and the list of permitted repositories

#### Scenario: Agent attempts to create issue in non-allowlisted repo

- **WHEN** the manifest-read step finds an entry in `/tmp/cross-repo-issues.json` whose `repo` field does not appear in `OPENSPEC_CROSS_REPO_REPOS`
- **THEN** the step SHALL fail with a non-zero exit code, trigger handle-failure, and flip the issue label to `openspec:failed`

### Requirement: Plan agent may create intra-repo sub-task issues

The plan agent SHALL be permitted to create new issues in the current repository (`$GITHUB_REPOSITORY`) when the spec identifies discrete work items that warrant their own tracking. Intra-repo issue creation SHALL NOT require the current repo to appear on the allowlist.

#### Scenario: Intra-repo issue created during plan

- **WHEN** the plan agent creates an issue in the current repository
- **THEN** the issue URL SHALL be recorded in `/tmp/cross-repo-issues.json` under the current repo's `owner/repo` key
- **AND** the safeguard comment SHALL list it as an intra-repo action

### Requirement: Plan agent may create issues in allowlisted external repositories

When `OPENSPEC_CROSS_REPO_REPOS` is non-empty, the plan agent SHALL be permitted to create issues in any repository that appears on the allowlist. The agent SHALL use `AGENT_GITHUB_TOKEN` for all cross-repo writes via `gh issue create --repo <owner/repo>`.

#### Scenario: Cross-repo issue created in allowlisted repo

- **WHEN** the plan agent creates an issue in an allowlisted external repository
- **THEN** the issue URL, title, and target repo SHALL be written to `/tmp/cross-repo-issues.json`
- **AND** the manifest-read step SHALL verify the repo is on the allowlist before posting the safeguard comment

#### Scenario: AGENT_GITHUB_TOKEN lacks write on target repo

- **WHEN** the plan agent attempts `gh issue create --repo <owner/repo>` and the PAT does not have `issues: write` on that repo
- **THEN** `gh` SHALL return a non-zero exit code, the agent run SHALL fail, and handle-failure SHALL flip the label to `openspec:failed`

### Requirement: Safeguard comment reports all cross-repo actions

After the plan agent step, the workflow SHALL read `/tmp/cross-repo-issues.json` and post a safeguard comment on the originating issue listing every issue created (intra-repo and external). This comment SHALL use the standard `AGENT_COMMENT_MARKER` and participate in the prune-and-replace cycle.

#### Scenario: One or more issues created

- **WHEN** `/tmp/cross-repo-issues.json` contains one or more entries
- **THEN** the workflow SHALL post a safeguard comment on the originating issue containing a warning banner and a bulleted list of created issues with their URLs and titles

#### Scenario: No issues created

- **WHEN** `/tmp/cross-repo-issues.json` is absent or empty
- **THEN** the manifest-read step SHALL be a no-op and no safeguard comment SHALL be posted

### Requirement: Agent instructs duplicate-check before creating issues

The plan agent's cross-repo prompt SHALL instruct the agent to search for existing open issues with a similar title in the target repository before creating a new one, using `gh issue list --repo <owner/repo> --search "<title>"`.

#### Scenario: Existing issue found in target repo

- **WHEN** the agent finds an open issue with a matching title in the target repo
- **THEN** the agent SHALL record the existing issue URL in `/tmp/cross-repo-issues.json` (marked as `existing: true`) rather than creating a duplicate
- **AND** the safeguard comment SHALL note the issue as pre-existing rather than newly created
