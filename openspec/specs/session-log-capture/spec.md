# session-log-capture Specification

## Purpose

An opt-in capability within the OpenSpec Flow workflow that captures the
Claude Code session transcript (`claude-execution-output.json`) after each
agent job, scrubs it of secrets, optionally encrypts it with a symmetric
passphrase, and uploads it as a GitHub Actions run artifact so maintainers
can download and inspect it after the run completes.

## Requirements

### Requirement: Session log capture is opt-in via workflow input

The OpenSpec Flow workflow SHALL accept an `attach_session_logs` env var
(boolean string `yes` / `no`, default `no`). When the value is not `yes`,
no capture, scrubbing, encryption, or upload steps SHALL execute — the
default case adds zero runtime cost.

#### Scenario: Default — no capture

- **WHEN** `attach_session_logs` is unset or set to `no`
- **THEN** the capture, scrub, and upload steps SHALL be skipped entirely for all agent jobs (plan, implement, respond)

#### Scenario: Opt-in — capture enabled

- **WHEN** `attach_session_logs` is set to `yes`
- **THEN** the capture, scrub, and upload steps SHALL execute after each agent job step with `if: always()` semantics (i.e., they run even if the agent step failed)

### Requirement: Transcript file is copied before upload

After each agent step, the workflow SHALL copy
`$RUNNER_TEMP/claude-execution-output.json` to a working path
(`/tmp/session-<job>.json`) for scrubbing and optional encryption.

#### Scenario: Transcript file exists

- **WHEN** the capture step runs and `$RUNNER_TEMP/claude-execution-output.json` exists
- **THEN** the file SHALL be copied to the working path and processing SHALL continue

#### Scenario: Transcript file is absent

- **WHEN** the capture step runs and `$RUNNER_TEMP/claude-execution-output.json` does not exist
- **THEN** the step SHALL log a warning, exit 0 (not fail the job), and no artifact SHALL be uploaded

### Requirement: Exposed env var values are scrubbed before upload

Before upload, the workflow SHALL iterate the env vars that were exposed
to the agent step (`ANTHROPIC_API_KEY`, `GITHUB_TOKEN`,
`OVERRIDE_GITHUB_TOKEN`) and replace each non-empty value with
`[REDACTED_<NAME>]` throughout the transcript file. Scrubbing is
defence-in-depth and SHALL run regardless of whether encryption is also
configured.

#### Scenario: Scrubbing replaces secret values

- **WHEN** the scrub step runs and an env var has a non-empty value
- **THEN** every occurrence of that value in the transcript file SHALL be replaced with `[REDACTED_<NAME>]` (e.g., `[REDACTED_ANTHROPIC_API_KEY]`)

#### Scenario: Empty env var values are skipped

- **WHEN** the scrub step runs and an env var has an empty value
- **THEN** no substitution is performed for that var and the transcript is not modified for it

#### Scenario: PROMPT var is not scrubbed (it is not a secret)

- **WHEN** the scrub step runs
- **THEN** the `PROMPT` env var value SHALL NOT be redacted — only vars that may carry secret material are in scope

### Requirement: Hard refuse on public repo without encryption configured

The workflow SHALL refuse to upload session logs in plaintext on a public
repository. When `attach_session_logs=yes` and the repository is public and
no encryption password is configured, the capture step SHALL exit 1 before
any upload occurs, and SHALL post a warning comment on the issue/PR
explaining the refusal.

#### Scenario: Public repo, no encryption configured

- **WHEN** `attach_session_logs=yes` and the repository is public and `encrypt_session_logs_password` is empty
- **THEN** the capture step SHALL exit 1, no artifact SHALL be uploaded, and a comment SHALL be posted stating that plaintext log upload is refused on public repos

#### Scenario: Private repo, no encryption configured

- **WHEN** `attach_session_logs=yes` and the repository is private and `encrypt_session_logs_password` is empty
- **THEN** the scrubbed transcript SHALL be uploaded as a plaintext artifact (no encryption required)

#### Scenario: Public repo with password encryption configured

- **WHEN** `attach_session_logs=yes` and the repository is public and `encrypt_session_logs_password` is non-empty
- **THEN** the workflow SHALL proceed to encrypt and upload the artifact (no refusal)

### Requirement: Symmetric encryption with age when password is configured

When `encrypt_session_logs_password` is non-empty, the workflow SHALL
encrypt the scrubbed transcript using `age` symmetric mode (`age -p`)
before upload. The encrypted output SHALL have the `.age` extension.
The plaintext working file SHALL be deleted after encryption.

#### Scenario: Encryption produces .age artifact

- **WHEN** `encrypt_session_logs_password` is set and encryption runs
- **THEN** the artifact path SHALL be `/tmp/session-<job>.json.age` and the plaintext `/tmp/session-<job>.json` SHALL be deleted

#### Scenario: Encrypted artifact is decryptable

- **WHEN** a maintainer downloads the artifact and runs `age --decrypt -p session-<job>.json.age`
- **THEN** supplying the correct passphrase SHALL produce the original scrubbed transcript

### Requirement: Artifact uploaded with consistent naming and retention

The upload-artifact step SHALL use `actions/upload-artifact@v4` with:
- artifact name: `agent-session-<run_id>-<job_name>` (e.g., `agent-session-12345-plan`)
- path: the processed file (plaintext or `.age`)
- `retention-days: 14`
- `continue-on-error: true` so an upload failure does not fail the workflow job

#### Scenario: Artifact upload succeeds

- **WHEN** the upload step runs and the storage quota is not exceeded
- **THEN** the artifact SHALL appear in the workflow run's artifact list with the name `agent-session-<run_id>-<job_name>`

#### Scenario: Artifact upload fails

- **WHEN** the upload step fails (e.g., quota exceeded)
- **THEN** the job SHALL continue (not fail) and a workflow warning SHALL be emitted

### Requirement: encrypt_session_logs_key namespace is reserved

The workflow SHALL accept an `encrypt_session_logs_key` env var. When
this var is set, the workflow SHALL emit a `::warning::` annotation
stating the feature is not yet implemented. No key-based encryption
SHALL be attempted.

#### Scenario: Key-based encryption var is set

- **WHEN** `encrypt_session_logs_key` is non-empty
- **THEN** the workflow SHALL emit `::warning::encrypt_session_logs_key is not yet implemented; ignoring` and proceed using password-based encryption if `encrypt_session_logs_password` is also set, or plaintext/refuse as appropriate
