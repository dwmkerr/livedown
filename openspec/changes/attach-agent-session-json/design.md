## Context

The OpenSpec Flow workflow (`openspec-flow.yaml`) runs three agent jobs (plan, implement, respond), each of which invokes `bun run /tmp/claude-code-action/src/entrypoints/run.ts`. Internally, `base-action/src/run-claude-sdk.ts` writes every SDK message to `$RUNNER_TEMP/claude-execution-output.json` (line 19: `const EXECUTION_FILE = \`${process.env.RUNNER_TEMP}/claude-execution-output.json\``). The action also exposes this path via the `execution_file` output.

With `show_full_output: false` (the default), the runner log shows only sanitized summaries. The full transcript — tool calls, tool outputs, reasoning — is inaccessible after the run completes.

Workflow run artifacts on GitHub Actions are retained for a configurable number of days and are downloadable by any user with read access to the repository. On public repositories this means **public download** — plain-text transcripts containing tool-call outputs (which may echo secret env vars) must never be uploaded unencrypted.

`age` (the file-encryption tool, package `age` on Ubuntu) is available in the Ubuntu 24.04 apt universe (`age 1.1.1-1ubuntu0.24.04.3`). It supports recipient-based asymmetric encryption via `-r <age1… pubkey>`, making it an appropriate choice: no new secrets needed beyond the recipient public key, and decryption is straightforward for the maintainer who holds the corresponding private key.

## Goals / Non-Goals

**Goals:**
- Provide an opt-in mechanism to upload the agent execution transcript as a GitHub Actions artifact, retained for 14 days.
- When a public-key encryption recipient is configured, encrypt before upload so the file is not readable without the private key.
- Refuse plaintext upload on public repositories (fail the capture step with a clear error) unless encryption is configured — making the secure path the only path in the sensitive case.
- Perform a best-effort scrub of known secret env-var values before encryption/upload.
- Keep the composite action isolated: zero impact when `ATTACH_SESSION_LOGS != 'yes'`.
- Follow the existing composite-action pattern (single-purpose action called via `uses:`).

**Non-Goals:**
- Password-based encryption (the issue sketch mentioned it but recipient pubkey covers the use case without requiring a new secret to be passed to agents).
- GPG support — `age` is sufficient and simpler.
- Automatic secret discovery (scrubbing beyond a known list of env var names is out of scope).
- Retry on upload failure — a warning is acceptable; a missed artifact should not fail the pipeline.
- Modifying `show_full_output` behaviour — this change is orthogonal.

## Decisions

### Decision: New composite action (not inline steps)

Following the existing pattern (prune-comments, raise-comment, flip-label, handle-failure), the capture logic lives in `.github/actions/openspec-flow-capture-session/action.yml`. This keeps the workflow file readable and allows the action to be tested independently.

Alternative considered: inline shell steps in each job. Rejected because the logic (check public/private repo, install age, scrub, encrypt/skip, upload) is non-trivial and would be duplicated three times.

### Decision: `apt-get install -y age` inside the action, not pre-installed

`age` is available in Ubuntu 24.04 apt universe. Installing it only when `ENCRYPT_SESSION_LOGS == 'age-recipient'` means zero overhead for unencrypted or disabled runs.

Alternative considered: require callers to pre-install `age`. Rejected because the action should be self-contained.

### Decision: Refuse plaintext upload on public repositories

When `ATTACH_SESSION_LOGS == 'yes'` and `ENCRYPT_SESSION_LOGS != 'age-recipient'` and the repository visibility is `public`, the capture step SHALL exit with a non-zero code and a clear error message. This is enforced inside the action using `gh api repos/$REPO --jq .visibility`.

Alternative considered: emit a warning and upload anyway. Rejected — the issue explicitly states "plaintext upload on public repos SHALL be refused."

### Decision: Best-effort scrub of `ANTHROPIC_API_KEY` and `AGENT_GITHUB_TOKEN` only

These are the two secrets injected by the workflow. Scrubbing uses `sed -i` with literal string substitution (not regex). If either env var is empty, the sed is a no-op.

Alternative considered: scrubbing all `${{ secrets.* }}` references. GitHub already masks registered secrets in log output, but the execution file is not a log — it is a raw JSON transcript. Limiting scrubbing to the two known secrets keeps the logic deterministic and avoids false positives.

### Decision: Artifact name pattern `agent-session-<run_id>-<job>`

`run_id` is unique per workflow run; `job` disambiguates plan/implement/respond within the same run. This avoids collisions across concurrent runs and makes artifacts easy to identify.

### Decision: `if: always()` on the capture step

The capture step must run even if the agent step failed — that is precisely when the transcript is most valuable for debugging.

## Risks / Trade-offs

- [Risk: transcript contains secret values despite scrubbing] → Scrubbing is best-effort against two known env var names. Tool outputs may echo other env vars the agent ran `printenv` on. Mitigation: encryption is the primary guard; scrubbing is a defense-in-depth layer. Document this limitation in the action README.
- [Risk: `age` install adds ~10-30s to the job when encryption is enabled] → Acceptable trade-off. The agent step itself takes minutes.
- [Risk: repo-visibility check adds one `gh api` call] → Negligible. The call is only made when `ATTACH_SESSION_LOGS == 'yes'`.
- [Risk: execution file does not exist if the agent step was skipped] → The capture action checks for file existence with `-f` before proceeding; exits 0 silently if the file is absent.
- [Risk: artifact upload needs `actions: write` permission] → The workflow currently has `actions: read`. The permission block must be updated to `actions: write`.

## Open Questions

- Should the capture action also upload the `inline-comments-buffer.jsonl` file produced by the MCP server (`/tmp/inline-comments-buffer.jsonl`)? (Proposed: no — it rarely contains debugging-relevant content and adds complexity.)
- Should the retention period be a workflow-level env var rather than hardcoded at 14 days? (Proposed: hardcode 14 for now; easy to parameterise later.)
