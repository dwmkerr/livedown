## Why

When an OpenSpec Flow agent step silently no-ops, the workflow surfaces nothing useful because `claude-execution-output.json` (the Claude Code session transcript) exists only inside the runner and is discarded when the run completes. Maintainers need a way to download and inspect that transcript after the fact to diagnose what the agent actually did.

## What Changes

- Add `attach_session_logs` workflow-level input (boolean, default `no`). When set to `yes`, the agent transcript is copied, scrubbed, optionally encrypted, and uploaded as a GitHub Actions artifact after each agent job (plan / implement / respond).
- Add `encrypt_session_logs_password` workflow-level input. When set, the scrubbed transcript is encrypted symmetrically with `age -p` before upload. On a **public** repo, `attach_session_logs=yes` without an encryption setting SHALL fail fast (hard refuse).
- Secret scrubbing: before upload, iterate all env vars exposed to the agent step and redact any that have non-empty values (`[REDACTED_<NAME>]`). This is defence-in-depth on top of encryption, not a substitute for it.
- `encrypt_session_logs_key` (key-based / recipient encryption) is explicitly **out of scope for this change** — the config namespace is reserved and documented, but implementation is follow-on work.

## Capabilities

### New Capabilities

- `session-log-capture`: Opt-in capture, scrubbing, encryption, and artifact upload of the `claude-execution-output.json` transcript for each OpenSpec Flow agent job (plan, implement, respond). Includes a hard refuse on public repos when logs are requested without encryption.

### Modified Capabilities

- `openspec-flow`: The plan, implement, and respond jobs each gain a post-agent step that conditionally captures and uploads the session log. The workflow-level `env:` block gains two new inputs (`attach_session_logs`, `encrypt_session_logs_password`). Trigger conditions, label lifecycle, and agent prompts are unchanged.

## Impact

- `.github/workflows/openspec-flow.yaml` — gains two env vars and one new step per agent job (capture + upload), conditioned on `attach_session_logs == 'yes'`
- New dependency: `age` encryption tool (available on GitHub-hosted ubuntu runners via `apt`)
- `actions/upload-artifact@v4` already pinned in the repo; used for log upload with `retention-days: 14`
- No impact on livedown's end-user application code or any non-OpenSpec workflow
