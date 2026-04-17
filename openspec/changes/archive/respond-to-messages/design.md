## Context

The OpenSpec Flow currently provides automation for the *proposal* stage (`openspec-flow.yaml`) and the *implement* stage (`openspec-flow-implement.yaml`). Both are fire-and-forget: once they run, the agent does not re-engage unless the maintainer clears lifecycle labels and re-assigns. Issue #32 asks for a message-response loop so any participant can trigger the agent to re-read the discussion and refine artifacts by simply applying the `openspec:start` label.

The `openspec:start` label already exists as the manual trigger for `openspec-flow.yaml`. The respond workflow reuses the same label as its trigger so no new labels need to be created.

## Goals / Non-Goals

**Goals:**
- Add `openspec-flow-respond.yaml` that fires when `openspec:start` is labeled on an issue or PR
- Support two contexts: issue (change folder may or may not exist yet) and spec/impl PR (artifacts exist)
- After acting, post a summary comment and remove `openspec:start` so the issue/PR is not stuck in a retriggering loop
- Add a one-line footer to agent-posted comments in all existing flow workflows pointing users to the `openspec:start` label

**Non-Goals:**
- Automatically detecting *which* artifacts need updating — the agent decides based on the discussion
- Supporting other label names or webhook event types
- Changing the lifecycle labels (`openspec:exploring`, `openspec:spec-ready`, `openspec:implement`, `openspec:review`, `openspec:failed`) — those remain owned by the primary flows

## Decisions

### Decision: Reuse `openspec:start` as the respond trigger

Alternatives considered:
- New label `openspec:respond` — avoids ambiguity with the creation flow, but adds a label maintainers must create, and the intent is the same ("start/restart the agent").
- Comment trigger (`/openspec`) — harder to implement reliably in GitHub Actions; requires parsing comment bodies.

Chosen: reuse `openspec:start`. The respond workflow checks whether it is running in an issue or PR context and whether a change folder already exists; `openspec-flow.yaml` already guards against re-runs via lifecycle labels.

### Decision: One workflow file, two code paths (issue vs. PR)

The workflow reads `github.event_name` and `github.event.issue.pull_request` to determine context, then passes the appropriate prompt to the agent. A single workflow is simpler to maintain than two near-identical files.

### Decision: Agent posts a summary comment then label cleanup happens in a workflow step

The agent is instructed to post a comment summarising what changed. After the agent step succeeds, a dedicated workflow step removes `openspec:start`. This keeps label management in the workflow layer (consistent with existing flows) and the agent focused on content.

### Decision: Footer added to agent-posted comments via prompt, not post-processing

Existing workflows pass a `PROMPT` env var to the agent. The footer line will be added to the prompt template that instructs the agent what to include in its comment. This is simpler than string-patching agent output and keeps the instruction colocated with the comment template.

## Risks / Trade-offs

- [Risk] `openspec:start` is already consumed by `openspec-flow.yaml` on issues — the respond workflow may race with the creation flow if `openspec:start` is added to an issue that has no lifecycle label yet. → Mitigation: `openspec-flow-respond.yaml` checks for the presence of a change folder; if none exists AND no lifecycle label is set, it skips so the creation flow can handle it. The creation flow removes `openspec:start` at its first step, preventing double-firing.
- [Risk] Agent re-engages on a PR and modifies artifacts after implementation has started. → Mitigation: The agent is prompted to post a summary and seek confirmation before making significant structural changes; this is a soft guardrail (no hard enforcement needed at this stage).
- [Risk] The summary comment the agent posts may not accurately reflect all changes. → Mitigation: The agent is instructed to list each artifact it modified with a one-line description of what changed.

## Open Questions

- Should the respond workflow also flip a lifecycle label while running (e.g. `openspec:exploring`) to prevent a second `openspec:start` being added concurrently? Current design: no label flip, rely on concurrency group cancel-in-progress=false and label removal at end.
