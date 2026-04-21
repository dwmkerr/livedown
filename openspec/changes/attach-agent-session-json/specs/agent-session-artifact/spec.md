## ADDED Requirements

### Requirement: Agent execution file is uploaded as a workflow artifact

After each agent run completes, the system SHALL upload the agent execution file as a GitHub Actions artifact when `attach_session_logs` is `true`. The artifact SHALL be named `agent-session-${{ github.run_id }}-${{ github.run_attempt }}` and SHALL be uploaded regardless of whether the agent step succeeded or failed.

#### Scenario: Successful agent run with session logging enabled
- **WHEN** the agent step completes (success or failure) and `attach_session_logs` is `true`
- **THEN** the workflow SHALL upload the file at `steps.<agent-step-id>.outputs.execution_file` as a GitHub Actions artifact

#### Scenario: Session logging disabled
- **WHEN** `attach_session_logs` is `false` or not set
- **THEN** the upload step SHALL be skipped and no artifact is created

#### Scenario: Execution file output missing
- **WHEN** `attach_session_logs` is `true` but `steps.<agent-step-id>.outputs.execution_file` is empty or not set
- **THEN** the upload step SHALL be skipped gracefully without failing the workflow

### Requirement: Artifact name includes run ID and attempt number

The artifact name SHALL follow the pattern `agent-session-<run_id>-<run_attempt>` to ensure uniqueness across runs and re-runs.

#### Scenario: Re-run produces a distinct artifact
- **WHEN** the same workflow run is re-run (attempt > 1)
- **THEN** the artifact name SHALL differ from the first attempt's artifact name

### Requirement: Artifact retention is configurable

The artifact retention period SHALL default to 14 days and SHALL be overridable via a `session_logs_retention_days` input (integer, 1–90).

#### Scenario: Default retention applied
- **WHEN** `session_logs_retention_days` is not provided
- **THEN** the artifact SHALL be retained for 14 days

#### Scenario: Custom retention applied
- **WHEN** `session_logs_retention_days` is set to a valid integer between 1 and 90
- **THEN** the artifact SHALL be retained for the specified number of days

### Requirement: Secret values are scrubbed before upload

Before uploading, the system SHALL perform best-effort secret scrubbing by replacing the values of environment variables whose names contain `SECRET`, `TOKEN`, `KEY`, `PASSWORD`, or `PASS` with `[REDACTED]` in the session file content.

#### Scenario: Environment variable with sensitive name exists
- **WHEN** an environment variable named (e.g.) `GITHUB_TOKEN` is set and its value appears in the session file
- **THEN** the upload step SHALL replace all occurrences of the value with `[REDACTED]` before uploading

#### Scenario: No sensitive environment variables set
- **WHEN** no environment variables with sensitive name patterns are present
- **THEN** the session file SHALL be uploaded as-is (after any encryption)

### Requirement: Encryption is applied before upload when configured

The system SHALL encrypt the session artifact before upload according to the `encrypt_session_logs` input value. Supported modes: `age` (asymmetric, recipient public key via `session_logs_recipient`), `password` (symmetric, passphrase via `SESSION_LOGS_PASSWORD` environment variable), and `none` (no encryption).

#### Scenario: Age encryption with valid recipient key
- **WHEN** `encrypt_session_logs` is `age` and `session_logs_recipient` is set to a valid age public key
- **THEN** the session file SHALL be encrypted with `age -r <recipient>` before upload, producing a `.age` encrypted file

#### Scenario: Password encryption with passphrase
- **WHEN** `encrypt_session_logs` is `password` and `SESSION_LOGS_PASSWORD` is set
- **THEN** the session file SHALL be encrypted with `age --passphrase` using that value before upload

#### Scenario: Password mode without passphrase
- **WHEN** `encrypt_session_logs` is `password` and `SESSION_LOGS_PASSWORD` is not set
- **THEN** the upload step SHALL fail with a clear error message before attempting encryption

#### Scenario: No encryption on private repository
- **WHEN** `encrypt_session_logs` is `none` and the repository is private
- **THEN** the session file SHALL be uploaded without encryption

### Requirement: Public repository without encryption fails hard

The system SHALL fail the upload step with a descriptive error if the repository visibility is `public` and `encrypt_session_logs` is `none`.

#### Scenario: Public repo with no encryption configured
- **WHEN** `encrypt_session_logs` is `none` and `github.event.repository.visibility` is `public`
- **THEN** the upload step SHALL exit with a non-zero code and log: "ERROR: Session logs encryption is required for public repositories. Set encrypt_session_logs to 'age' or 'password'."

#### Scenario: Public repo with age encryption configured
- **WHEN** `encrypt_session_logs` is `age` and the repository is public
- **THEN** the upload step SHALL proceed normally with encryption applied

### Requirement: `age` is installed on-demand when needed

When `encrypt_session_logs` is `age` or `password`, the workflow SHALL install `age` before attempting encryption if it is not already available on the runner.

#### Scenario: Ubuntu runner without age pre-installed
- **WHEN** `encrypt_session_logs` requires `age` and the runner is Ubuntu
- **THEN** a workflow step SHALL run `apt-get install -y age` before the encryption step

#### Scenario: `age` already available
- **WHEN** `age` is already on the runner PATH
- **THEN** the install step SHALL be skipped or succeed idempotently
