## Context

Claude agent runs produce an execution output file (session.json / execution file) accessible via `steps.<id>.outputs.execution_file`. Currently this file is never persisted — it is discarded when the runner exits. Teams debugging agent failures or auditing costs must re-run or rely solely on job logs.

The change lives in two repositories:
- `dwmkerr/agent-actions` — the reusable workflow (`claude.yml`) that runs the agent
- `dwmkerr/livedown` — a consumer that invokes the workflow via `openspec-flow.yaml`

Encryption is necessary before upload in public repositories because session.json may contain prompts, tool outputs, and incidentally captured secret values.

## Goals / Non-Goals

**Goals:**
- Persist agent execution output as a GitHub Actions artifact after every opted-in run
- Encrypt the artifact before upload when the repository is public or when the caller requests encryption
- Hard-fail the upload step (not silently skip) if public repo + encryption is `none` — preventing accidental secret leakage
- Best-effort scrub known secret values (CI env var values) from the file before upload
- Allow callers to configure retention, encryption mode, and age recipient key via workflow inputs
- Reference the execution file via the step output, not a hardcoded path

**Non-Goals:**
- Full secret detection / scanning (best-effort env var substitution only)
- Decryption tooling or a viewer UI for the artifacts
- Compression of the artifact (GitHub Actions handles this natively)
- Support for GPG or other encryption formats beyond `age` and symmetric password

## Decisions

### Encryption tool: `age`

**Decision:** Use `age` (https://age-encryption.org/) for public-key encryption.

**Rationale:** `age` is modern, auditable, has a minimal CLI surface, and is available via `apt`/`brew`/`curl`. It avoids the complexity of GPG key management. A caller provides their age public key as a workflow input; the artifact is encrypted with `age -r <recipient>`. Decryption requires the corresponding private key, which never leaves the caller's machine.

**Alternatives considered:**
- GPG: Widely known but heavy, key management is error-prone, passphrase handling in CI is fragile.
- `openssl enc`: Available everywhere but symmetric-only; requires sharing a password secret.
- No encryption: Acceptable for private repos but unsafe for public repos.

### Public repo safety guard

**Decision:** The upload step fails with an error message if `github.event.repository.visibility == 'public'` and `encrypt_session_logs == 'none'`.

**Rationale:** Silent skip would mask mis-configuration. A hard failure forces the caller to make an explicit choice (add a recipient key, or accept `none` on a private repo only).

### Encryption modes: `age` | `password` | `none`

- `age`: Asymmetric, recipient public key supplied via `session_logs_recipient` input
- `password`: Symmetric, passphrase supplied via `SESSION_LOGS_PASSWORD` secret (caller must wire this)
- `none`: No encryption — allowed only on private repos

### Secret scrubbing approach

**Decision:** Best-effort — iterate over all environment variables whose names suggest secrets (contain `SECRET`, `TOKEN`, `KEY`, `PASSWORD`, `PASS`) and replace their values in the session file with `[REDACTED]`.

**Rationale:** Perfect scrubbing is impossible without semantic understanding of the session. Best-effort protects against the most common leakage vectors while keeping implementation simple. This runs before encryption and before upload regardless of mode.

### Artifact naming

`agent-session-${{ github.run_id }}-${{ github.run_attempt }}`

Includes `run_attempt` to avoid collisions on re-runs. No repo or workflow name prefix — the artifact lives within the run's namespace already.

### Retention default: 14 days

Balances storage cost against debugging window. Configurable via `session_logs_retention_days` input (integer, 1–90).

### Step ordering in claude.yml

The upload runs as a separate step after the agent step, conditioned on:
1. `inputs.attach_session_logs == 'true'`
2. `steps.<agent-step-id>.outputs.execution_file != ''` (file exists)
3. Always (`if: always()`) — so artifacts are captured even on agent failure, which is when they are most useful

## Risks / Trade-offs

- **Secret leakage despite scrubbing** → Callers on public repos must use `age` encryption; the hard-fail guard enforces this. Best-effort scrubbing is a secondary layer, not the primary control.
- **`age` not installed on runner** → The step installs `age` on demand (`apt-get install age` on ubuntu). If the runner is self-hosted without internet access, this fails. Mitigation: document requirement; callers on air-gapped runners can pre-install.
- **Large session files** → GitHub Actions artifact limit is 500 MB. Session files are typically small (< 1 MB) but no hard cap is enforced. Mitigation: document; add a size-check warning step.
- **Password mode secret wiring** → The caller must pass `SESSION_LOGS_PASSWORD` as an env var. If omitted, the `age --passphrase` call fails. Mitigation: validate input and emit a clear error before attempting encryption.
- **`execution_file` output missing** → If the agent step did not produce the output (older action version), the upload step skips gracefully via the condition check.

## Migration Plan

1. Implement inputs and upload step in `dwmkerr/agent-actions` behind `attach_session_logs: false` default — existing callers are unaffected.
2. Add passthrough `with:` params in livedown's `openspec-flow.yaml` (also defaulting to `false`).
3. Opt livedown in by setting `attach_session_logs: true` and providing an age recipient key in repo secrets.
4. Rollback: set `attach_session_logs: false` — no artifact uploaded, no behaviour change to the agent run itself.

## Open Questions

- Should the scrubbing step run before or be integrated into the upload step? (Current plan: separate scrub-then-upload for auditability.)
- Should the artifact be gzip-compressed before age encryption for smaller uploads? (Deferred — premature optimisation.)
- Should `session_logs_retention_days` be validated (clamped to 1–90) in the workflow, or left to GitHub to reject? (Lean toward workflow-level clamp with a warning.)
