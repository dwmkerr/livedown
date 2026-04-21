## Why

The OpenSpec Flow agent is confined to the repository it runs in — it can open issues, PRs, and comments only within the same repo. When a spec reveals that work belongs in an external repository (e.g., extracting OpenSpecFlow into `dwmkerr/agent-actions`), there is no way for the agent to propose or track that cross-repo work automatically.

## What Changes

- **New opt-in config**: `OPENSPEC_CROSS_REPO_REPOS` environment variable (allowlist of `owner/repo` strings) enables the feature. Off by default.
- **New agent capability**: During the plan stage, the agent may create a tracking issue in an allowlisted external repository when the spec identifies cross-repo work.
- **New safeguard comment**: Any cross-repo issue created is immediately summarized in a comment on the originating issue, linking to each created issue with a visible warning banner.
- **Token reuse**: Cross-repo issue creation uses `AGENT_GITHUB_TOKEN` (PAT already present in the workflow) — no new secret is required, but the PAT must have `issues: write` on the target repo.
- **Intra-repo issue creation**: The agent may also create sub-task issues within the current repository when the spec identifies discrete work items that warrant their own tracking.

## Capabilities

### New Capabilities

- `cross-repo-issue-creation`: Opt-in capability allowing the plan agent to create issues in allowlisted external repositories and in the current repository, with safeguard comments on the originating issue summarizing all created issues.

### Modified Capabilities

- `openspec-flow`: The plan job prompt is extended to include cross-repo issue creation instructions when the allowlist is non-empty. The safeguard comment step is added after the agent step.

## Impact

- **`.github/workflows/openspec-flow.yaml`**: New env var `OPENSPEC_CROSS_REPO_REPOS`, new step after plan agent to validate and summarize any cross-repo issues created, updated plan agent prompt.
- **`openspec/specs/openspec-flow/spec.md`**: New requirement for the plan job's cross-repo behavior.
- **Security**: Feature is off by default. Requires explicit opt-in via allowlist. All cross-repo writes use the existing `AGENT_GITHUB_TOKEN` PAT — no new credential surface area. A safeguard comment on the originating issue makes all cross-repo actions visible to humans before any downstream work begins.
- **Dependencies**: None new — reuses `gh` CLI already present in the runner environment and `AGENT_GITHUB_TOKEN` already provisioned.
