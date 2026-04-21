## Why

When Claude agent runs complete, the execution output (session.json) is lost unless explicitly captured. Attaching it as a GitHub Actions artifact enables post-run debugging, audit trails, and cost tracking — particularly valuable for public repos where run logs may be insufficient.

## What Changes

- Add optional `attach_session_logs` boolean input to the agent workflow in `dwmkerr/agent-actions` (claude.yml)
- Add optional `encrypt_session_logs` input (`age` | `password` | `none`) to control encryption mode
- Add optional `session_logs_recipient` input for the age public key when using age encryption
- Add optional `session_logs_retention_days` input (default: 14) to control artifact retention
- After each agent run, upload the execution file as a GitHub Actions artifact named `agent-session-${{ github.run_id }}-${{ github.run_attempt }}`
- Reference the execution file via `steps.<id>.outputs.execution_file` (not hardcoded path)
- **Fail the upload step** if the repository is public and `encrypt_session_logs` is `none` (safety guard)
- Perform best-effort secret scrubbing by redacting env var values from the session file before upload
- Expose corresponding `with:` params in livedown's `openspec-flow.yaml` to opt in

## Capabilities

### New Capabilities

- `agent-session-artifact`: Upload and optionally encrypt Claude agent execution output as a workflow artifact after each run

### Modified Capabilities

- `openspec-flow`: The openspec-flow composite action gains new passthrough `with:` inputs for session log attachment and encryption settings

## Impact

- `dwmkerr/agent-actions`: `claude.yml` gains new inputs and a post-run upload step
- `.github/workflows/openspec-flow.yaml` (livedown): gains passthrough `with:` params
- New dependency: `age` encryption tool (installed in CI runner on demand)
- No changes to the relay, browser viewer, or CLI
- Artifact storage costs increase marginally (mitigated by 14-day default retention)
