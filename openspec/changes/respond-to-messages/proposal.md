## Why

The OpenSpec flow is currently a one-shot automation: once it runs, there is no channel for a maintainer to prompt the agent to re-read the discussion thread and update the artifacts. Issue #32 requests a conversational response loop so that adding an `openspec:start` label to an issue or PR re-engages the agent, which re-reads the full discussion and refines the relevant OpenSpec artifacts accordingly.

## What Changes

- New GitHub Actions workflow `openspec-flow-respond.yaml` that fires on `labeled` events when the `openspec:start` label is added to an issue or PR.
- When triggered from an **issue** (no spec PR yet), the agent re-reads the full discussion and updates or creates artifacts in the existing change folder.
- When triggered from a **spec/impl PR** (artifacts already exist), the agent reads all PR comments and review threads and refines the relevant artifacts.
- After acting, the agent posts a summary comment on the issue or PR describing what changed, then removes the `openspec:start` label.
- All automated flow comments from all existing workflows (openspec-flow, openspec-flow-implement) gain a standard footer: "Add the `openspec:start` label to re-engage the agent with the latest discussion."

## Capabilities

### New Capabilities

- `openspec-flow-respond`: A new workflow that provides an on-demand re-engagement trigger for the OpenSpec agent via the `openspec:start` label, enabling a conversational refinement loop across both issues and spec/impl PRs.

### Modified Capabilities

- (none — no existing spec-level requirements change; comment footer updates are implementation details)

## Impact

- New file: `.github/workflows/openspec-flow-respond.yaml`
- Modified files: `.github/workflows/openspec-flow.yaml` and `.github/workflows/openspec-flow-implement.yaml` (add footer to agent-posted comments)
- No new dependencies; same runtime (claude-code-action, OpenSpec CLI)
- No changes to `src/`, browser viewer, relay server, or security model
