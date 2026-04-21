## Context

OpenSpec Flow's plan job currently confines all GitHub writes to the repository it runs in. The only outbound GitHub API calls use either `GITHUB_TOKEN` (scoped to the current repo) or `AGENT_GITHUB_TOKEN` (a PAT that may have wider scope). When a spec identifies work that belongs in an external repository — for example, extracting OpenSpecFlow into `dwmkerr/agent-actions` — there is no pathway for the agent to propose or track that work automatically.

The feature must be off by default. Unrestricted cross-repo writes from a CI agent would be a significant security and governance risk: the agent could create noise (or worse) in repos the user does not intend to touch. The design therefore centers on an explicit opt-in allowlist and a visible safeguard audit trail.

Grounding: `agent-actions` (cloned at `/tmp/agent-actions`) is the motivating target. Its reusable workflow lives at `.github/workflows/claude.yml`. It currently has no OpenSpec tooling. A tracking issue created there would be the first step toward extracting OpenSpecFlow into it.

## Goals / Non-Goals

**Goals:**
- Allow the plan agent to create issues in the current repository (intra-repo sub-tasks)
- Allow the plan agent to create issues in explicitly allowlisted external repositories
- Surface all cross-repo issues created as a safeguard comment on the originating issue
- Keep the feature fully disabled unless the operator sets the allowlist
- Reuse existing `AGENT_GITHUB_TOKEN` PAT — no new credential surface

**Non-Goals:**
- Cross-repo PR creation (out of scope for initial version)
- Automatic token scope validation (the PAT must already have write on the target; a clear error message is sufficient if it does not)
- Allowing the agent to create issues in repos not on the allowlist (no dynamic allowlist expansion)
- UI or dashboard for tracking cross-repo work

## Decisions

### Decision: Allowlist as a comma-separated env var

**Chosen**: `OPENSPEC_CROSS_REPO_REPOS` at the workflow `env:` level, containing a comma-separated list of `owner/repo` strings (e.g. `dwmkerr/agent-actions,dwmkerr/other-repo`). Empty string (the default) disables the feature entirely.

**Alternative considered**: A config file (e.g. `openspec/config.yaml` extended with a `cross_repo` key). Rejected for v1 because it requires a file change to enable the feature, whereas an env var can be set at the repo/org secrets level without touching code. The env var is also visible in the workflow file, making it auditable in PRs.

**Alternative considered**: A GitHub Actions input on `workflow_dispatch`. Rejected because the feature needs to be always-on (or always-off) per repo, not toggled per manual run.

### Decision: Reuse AGENT_GITHUB_TOKEN, no new secret

**Chosen**: Cross-repo `gh issue create` calls use `GH_TOKEN=$AGENT_GITHUB_TOKEN`. If the PAT lacks write on the target repo, `gh` will return a 403 and the step will fail with a clear error. The workflow's handle-failure step surfaces this.

**Alternative considered**: A dedicated `CROSS_REPO_TOKEN` secret. Rejected for v1 — it adds credential management overhead for a feature that already requires a PAT for other purposes. The operator can always scope `AGENT_GITHUB_TOKEN` narrowly.

### Decision: Safeguard comment is mandatory, not optional

**Chosen**: After the plan agent step, a workflow step reads a structured output file written by the agent listing any issues it created. The step then posts a safeguard comment on the originating issue summarizing all cross-repo actions taken. This comment uses the standard `AGENT_COMMENT_MARKER` so it participates in the prune-and-replace cycle.

**Rationale**: If the agent silently creates issues in other repos, the human reviewing the spec PR has no way to know. Making the summary mandatory ensures cross-repo writes are always visible.

### Decision: Agent writes a manifest file; workflow reads it

**Chosen**: The plan agent writes `/tmp/cross-repo-issues.json` (or an empty file if no cross-repo issues were created). A post-agent workflow step reads this file, validates that every entry is in the allowlist, and posts the safeguard comment.

**Why a file rather than parsing agent output**: The agent's stdout goes to the GitHub Actions log, which is not easily machine-parseable. A structured JSON file is unambiguous.

**Format**:
```json
[
  { "repo": "dwmkerr/agent-actions", "issue_url": "https://github.com/dwmkerr/agent-actions/issues/42", "title": "..." },
  { "repo": "dwmkerr/livedown", "issue_url": "https://github.com/dwmkerr/livedown/issues/99", "title": "..." }
]
```

### Decision: Intra-repo issue creation is always permitted

**Chosen**: The plan agent may create issues in `$GITHUB_REPOSITORY` (the current repo) without requiring it to appear on the allowlist. The safeguard comment still reports these.

**Rationale**: `GITHUB_TOKEN` already has `issues: write` on the current repo. Requiring it on the allowlist adds friction with no security benefit.

## Risks / Trade-offs

- **PAT over-scoped** → Operator must scope `AGENT_GITHUB_TOKEN` appropriately. Mitigation: document the minimum required scope (`issues: write` on target repos) in CLAUDE.md.
- **Agent creates duplicate issues** → The agent should check for existing open issues with similar titles before creating. The plan prompt instructs this, but it is a best-effort check. Mitigation: the safeguard comment links to each created issue, so humans can close duplicates quickly.
- **Allowlist bypass** → The manifest-validation step checks that every repo in `/tmp/cross-repo-issues.json` appears in `OPENSPEC_CROSS_REPO_REPOS`. If the agent writes a repo not on the list, the step fails and the issue is flagged. Mitigation: the manifest validation is a workflow step (not agent code), so it cannot be bypassed by agent prompt injection.
- **Feature off by default** → This is intentional, but means users must remember to set the env var. Mitigation: document clearly in CLAUDE.md and in the workflow's comment header.

## Migration Plan

1. Add `OPENSPEC_CROSS_REPO_REPOS: ""` to the `env:` block in `openspec-flow.yaml` (no-op default).
2. Add the post-agent manifest-read and safeguard-comment step to the plan job.
3. Extend the plan agent prompt with cross-repo instructions, gated on `OPENSPEC_CROSS_REPO_REPOS` being non-empty.
4. Update `openspec/specs/openspec-flow/spec.md` with the new requirement.
5. Update `CLAUDE.md` Secrets section to document minimum PAT scope.

Rollback: remove the env var (set to empty string or delete it). The manifest-read step will find no file and skip. No state cleanup needed.

## Open Questions

- Should the post-agent manifest-validation step be a composite action (`.github/actions/openspec-flow-cross-repo-check`)? Likely yes when the composite-actions change ships, but out of scope for v1.
- Should the agent be instructed to label cross-repo issues it creates (e.g. `openspec:upstream`)? Left as a future enhancement.
