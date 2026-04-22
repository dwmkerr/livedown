## Context

The OpenSpec Flow workflow (`.github/workflows/openspec-flow.yaml`) runs Claude Code via `claude-code-action` in three jobs: plan, implement, and respond. The action writes a session transcript to `$RUNNER_TEMP/claude-execution-output.json`. After the runner is torn down, this file is gone. When an agent job silently no-ops or produces unexpected output, there is no post-hoc way to examine the agent's reasoning and tool calls.

Session transcripts may contain sensitive values: env-injected secrets echoed in tool call outputs (e.g., `printenv`, `gh api`), file contents the agent read (including `.env` if touched), and references to token names. GitHub Actions workflow run artifacts on public repos are publicly downloadable — plaintext upload is a secret-leak vector.

The `age` symmetric encryption tool is pre-installed on GitHub-hosted ubuntu runners (`age` 1.x via apt). `actions/upload-artifact@v4` is already used in the repo's other workflows.

## Goals / Non-Goals

**Goals:**
- Allow maintainers to opt in to capturing the session transcript for each agent job
- Scrub env vars exposed to the agent step before upload (defence-in-depth)
- Encrypt the scrubbed transcript before upload when a password is configured
- Hard-refuse (fail fast) on public repos when logs are requested without encryption
- Keep the default case (no opt-in) zero-cost — no new steps run unless `attach_session_logs=yes`
- Reserve the `encrypt_session_logs_key` config namespace for future key-based encryption

**Non-Goals:**
- Key-based encryption (`age` recipient / GPG) — reserved but not implemented
- Retroactive capture of transcripts from past runs
- Log streaming or real-time viewing
- Scrubbing based on dynamic secret detection (pattern matching on secret shapes) — only named env vars are scrubbed
- Any impact on livedown's application code or non-OpenSpec workflows

## Decisions

### Decision: `age -p` for symmetric encryption

Alternatives: `openssl enc`, `gpg --symmetric`, custom base64+XOR.

`age` is designed specifically for file encryption with a clean CLI, is pre-installed on ubuntu runners, and is recommended by security practitioners over `openssl enc` (which has weak KDF defaults). `age -p` prompts for a passphrase in interactive use; in CI, the passphrase is piped via stdin or `--passphrase` flag (non-interactive). The `age` decryption command is `age --decrypt -p` and is well-documented.

The password is sourced from a repo secret (`encrypt_session_logs_password`) so it never appears in workflow logs.

### Decision: Scrub by enumerating the agent step's `env:` block

Alternatives: regex-based secret-shape detection, no scrubbing, scrubbing all runner env vars.

The agent step has a bounded, known set of env vars (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `OVERRIDE_GITHUB_TOKEN`, `GITHUB_ACTION_PATH`, `PROMPT`). Enumerating these by name and redacting their values is deterministic and auditable. Values of named vars are runtime-accessible via `${!name}` in bash. Scrubbing all runner env vars would over-redact and make transcripts unreadable; pattern-based detection is fragile and easy to bypass.

Note: GitHub Actions masks secrets in log output but that mask does not apply to files written to disk, so explicit scrubbing is necessary.

### Decision: Hard refuse on public repos without encryption

The workflow already knows `github.event.repository.private`. A `run:` step before upload checks `[ "$REPO_VISIBILITY" = "false" ]` (public) and exits 1 if encryption is not configured. This is a fail-fast: the step that would upload plaintext logs never executes. A warning comment is posted on the issue/PR linking to the run.

### Decision: One artifact per job, 14-day retention

Artifact name: `agent-session-<run_id>-<job_name>`. This is human-readable and avoids collisions across concurrent runs. 14 days matches the project's existing artifact retention on other workflows and is sufficient for post-incident diagnosis without accumulating storage cost.

### Decision: Capture and upload steps run with `if: always()`

The transcript is most valuable when the agent job fails or no-ops. Using `always()` ensures these steps run even when an earlier step exits non-zero. The `if: env.attach_session_logs == 'yes' && always()` pattern is the correct YAML idiom for this (the `always()` function overrides the default "skip on failure" policy for `if:` expressions).

## Risks / Trade-offs

- [Risk] `age` version varies across runner images → Mitigation: pin `apt-get install -y age` in the capture step so the version is explicit; fall back to `brew install age` on macOS runners if ever needed (currently ubuntu only).
- [Risk] `claude-execution-output.json` may not exist if the agent step crashes before writing it → Mitigation: the capture step uses `test -f` and exits 0 (not 1) if the file is absent, logging a warning. No artifact is uploaded.
- [Risk] Scrubbing replaces substrings, so a secret that appears as part of a longer token-format value might not be matched if the value is URL-encoded or base64-encoded → Mitigation: document this limitation; the encryption layer provides the primary protection.
- [Risk] `PROMPT` env var is multi-line and may contain `|` characters that interact with `sed -i` → Mitigation: use `python3 -c` or `jq` for value substitution rather than raw `sed` on values that may contain regex metacharacters.
- [Risk] Public-repo hard refuse may surprise users who set the flag without reading the docs → Mitigation: the failure comment explicitly names the two conditions (public repo + no encryption) and links to the relevant issue/PR.

## Open Questions

- **Q1 (non-blocking):** Should `encrypt_session_logs_key` (key-based) be stubbed as a no-op that logs "not yet implemented" or should it be entirely absent from the workflow until implemented? *Leaning toward: add the env var with a comment reserving the namespace, emit a workflow warning if it is set, but do not implement the encryption path.*
- **Q2 (non-blocking):** Should the artifact upload step fail the job if the upload itself fails (e.g., artifact storage quota exceeded), or should it continue so the rest of the workflow is not disrupted? *Leaning toward: `continue-on-error: true` with a warning comment.*
