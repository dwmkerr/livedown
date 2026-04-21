## Why

When an OpenSpec Flow agent step silent-no-ops, the workflow surfaces nothing useful: `show_full_output: false` (the default in claude-code-action) hides all reasoning and tool use, and the execution transcript (`$RUNNER_TEMP/claude-execution-output.json`) is discarded when the run finishes. Maintainers currently have no way to diagnose what the agent actually did after the fact.

## What Changes

- Add an optional `ATTACH_SESSION_LOGS` env toggle (`yes` | `no`, default `no`) to the OpenSpec Flow workflow that controls whether the agent execution transcript is uploaded as a workflow artifact after each agent step.
- Add an optional `ENCRYPT_SESSION_LOGS` env toggle (`none` | `age-recipient`, default `none`) and an `ENCRYPT_SESSION_LOGS_RECIPIENT` env that holds an age public key. When set, the transcript is encrypted with `age` before upload; without it, plaintext upload is **refused** on public repositories.
- Add a new composite action `.github/actions/openspec-flow-capture-session/action.yml` that performs the capture, optional scrubbing, optional encryption, and artifact upload — called from each agent job immediately after the agent step, with `if: always()`.
- The artifact is named `agent-session-<run_id>-<job>` and retained for 14 days.

## Capabilities

### New Capabilities

- `session-log-capture`: Composite action that captures `$RUNNER_TEMP/claude-execution-output.json` after an agent step, scrubs known secret env vars, optionally encrypts with `age`, and uploads as a GitHub Actions artifact. Refuses plaintext upload on public repositories unless an encryption recipient is configured.

### Modified Capabilities

- `openspec-flow`: The plan, implement, and respond jobs each gain a post-agent `uses:` call to the new capture action. No logic change to any existing step.

## Impact

- `.github/actions/openspec-flow-capture-session/action.yml` — new composite action
- `.github/workflows/openspec-flow.yaml` — three new `uses:` steps (one per agent job), two new top-level `env:` vars (`ATTACH_SESSION_LOGS`, `ENCRYPT_SESSION_LOGS`, `ENCRYPT_SESSION_LOGS_RECIPIENT`), and `actions: read` permission already present (artifact upload requires no extra permission beyond `actions: write` — added if not present)
- New GitHub Actions permission needed: `actions: write` (for `actions/upload-artifact`)
- `age` tool installed via `apt-get install -y age` within the composite action when encryption is enabled
- No changes to existing composite actions, specs, or source code outside the workflow and new action
