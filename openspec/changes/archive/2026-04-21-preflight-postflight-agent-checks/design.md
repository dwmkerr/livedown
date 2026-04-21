## Context

The OpenSpec Flow workflow (`openspec-flow.yaml`) drives three agent jobs — plan, implement, and respond — each of which fires a Claude Code agent at significant cost (API credits, runner minutes, up to 60-minute timeouts). Currently there are no pre-agent guards and no post-agent assertions. An issue with a one-word title, or one that is somehow in an unexpected state, will happily burn a full agent run producing nothing useful.

The existing composite actions (`openspec-flow-prune-comments`, `openspec-flow-raise-comment`, `openspec-flow-flip-label`, `openspec-flow-handle-failure`) established the pattern: isolated, single-purpose actions called via `uses: ./.github/actions/<name>`. Preflight and postflight follow the same pattern.

## Goals / Non-Goals

**Goals:**
- Guard every agent step with a lightweight preflight check (fast, no API calls) that exits cleanly with a descriptive skip comment when preconditions are not met.
- Assert after every agent step that observable output was produced (commits or a marker comment) to catch silent no-ops.
- Keep all job-specific branching inside a single action file for each phase via a `job` input parameter, avoiding action proliferation.
- No new secrets, no new GitHub labels, no changes to the existing action set.

**Non-Goals:**
- Retry logic on failure — a failed postflight flips to `openspec:failed` and waits for human intervention (same as today).
- Validation of agent output quality — only presence of output is checked.
- Preflight checks for the cleanup job — it is a short label-strip with no agent step.

## Decisions

### Decision: Single action per phase (preflight, postflight) with a `job` param — not one action per job per phase

Six specialized actions (`openspec-flow-plan-preflight`, `openspec-flow-implement-preflight`, etc.) would duplicate the shared shell scaffolding and add maintenance overhead. A single `openspec-flow-preflight/action.yml` with a required `job` input (`plan` | `implement` | `respond`) lets a `case "$JOB"` block handle job-specific checks while keeping common setup (token validation, label existence) in shared code before the branch.

Alternative considered: inline the checks in the workflow as extra steps before the agent. Rejected because composite actions are already the project convention, and inline duplication across three jobs would be harder to maintain.

### Decision: Postflight escape hatch is soft — `new_commits > 0` OR agent marker comment present

A strict "must have new commits" would false-positive on the respond job when the agent correctly determines nothing needs changing and posts a "no changes needed" comment. Using OR lets either signal satisfy the assertion, matching the actual semantics of each job.

The postflight action computes `new_commits` by comparing `git rev-parse HEAD` before and after the agent step (the caller passes a `base-sha` input captured before the agent runs).

### Decision: Plan preflight uses a simple body length check (>= 40 chars) — not LLM analysis

A length check is deterministic, cheap, and catches the most common case (issue filed with just a title or a one-liner). It does not catch issues with long but vague bodies, but that is acceptable — the agent will surface the problem in its output and the postflight check will catch the no-op.

### Decision: Skip comment is a separate comment — the marker comment is not modified

The preflight skip comment is informational and ephemeral; modifying the existing marker comment would interfere with the prune-comments action's logic. Posting a separate comment keeps the two concerns independent. The skip comment does NOT start with `AGENT_COMMENT_MARKER` (so it is not pruned) and does NOT include the re-engagement footer (it is not an agent summary).

## Risks / Trade-offs

- [Risk: postflight false-negative on respond job] → The agent posts a summary comment but the comment contains the marker; the postflight checks for the marker in comments fetched after the run. If comment creation is slow (API lag), the fetch might miss it. Mitigation: fetch with a small retry (up to 3 attempts, 5s apart).
- [Risk: `git rev-parse HEAD` base SHA race] → If a concurrent push lands between capturing the base SHA and the postflight check, the commit count will be inflated. This is benign — a false-positive means the assertion passes when it should not, not a failure. The concurrency groups already prevent concurrent runs per issue.
- [Risk: plan preflight rejects legitimate short issues] → A 40-char threshold may block valid issues for internal tooling where context is implicit. Mitigation: threshold is defined as a workflow env var so it can be adjusted without changing the action.

## Open Questions

- Should the postflight skip comment include a link to the run URL? (Proposed: yes, for debugging.)
- Should the preflight min-body-length be a workflow-level env var or an action input? (Proposed: action input with a default of 40.)
