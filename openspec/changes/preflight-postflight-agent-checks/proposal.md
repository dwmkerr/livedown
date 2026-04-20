## Why

The OpenSpec Flow workflow runs Claude agent steps (plan, implement, respond) without any sanity checks before the agent fires or assertions after it finishes. This means the agent can consume expensive API credits on issues with incomplete descriptions, fire on stale or invalid state, and produce outputs that are never validated — failures surface only as runner timeouts or silent no-ops.

## What Changes

- Introduce a `preflight` composite action that runs before each agent step: validates that the issue body is substantive (>= 40 chars), confirms required labels exist, and confirms the repository is in an expected state for the current job.
- Introduce a `postflight` composite action that runs after each agent step: asserts that the agent produced observable output — either new commits were pushed to the branch (`new_commits > 0`) OR a marker comment was posted on the issue/PR.
- Both actions share a single `job` input parameter (`plan` | `implement` | `respond`) so the caller can drive job-specific logic from a single action file rather than six separate actions.
- When a preflight check fails, post a descriptive skip comment on the issue (a separate comment — do not modify the marker comment) and exit cleanly (no failure label, no wasted agent run).
- When a postflight assertion fails, post a warning comment and flip the issue to `openspec:failed`.

## Capabilities

### New Capabilities

- `preflight-agent-checks`: Composite action at `.github/actions/openspec-flow-preflight/action.yml` that validates pre-conditions before an agent step runs; exits with a skip comment when conditions are not met.
- `postflight-agent-checks`: Composite action at `.github/actions/openspec-flow-postflight/action.yml` that asserts post-conditions after an agent step completes; posts a warning and flips to failed when the assertion fails.

### Modified Capabilities

- `openspec-flow`: The plan, implement, and respond jobs each gain a preflight call before the agent step and a postflight call after it.

## Impact

- `.github/actions/openspec-flow-preflight/action.yml` — new file
- `.github/actions/openspec-flow-postflight/action.yml` — new file
- `.github/workflows/openspec-flow.yaml` — two new `uses:` steps per job (preflight + postflight), no other logic changes
- No changes to existing composite actions, specs, or source code
- No new secrets or labels required
