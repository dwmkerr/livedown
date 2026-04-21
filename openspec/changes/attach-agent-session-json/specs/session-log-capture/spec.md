## ADDED Requirements

### Requirement: capture action reads execution transcript from runner temp

The system SHALL provide a composite action at `.github/actions/openspec-flow-capture-session/action.yml` that accepts the following inputs: `gh-token` (required), `repo` (required), `run-id` (required), `job` (required; one of `plan`, `implement`, `respond`), `attach` (required; `yes` | `no`), `encrypt` (optional; default `none`; accepted values `none` | `age-recipient`), and `encrypt-recipient` (optional; the age public key string used when `encrypt == 'age-recipient'`). The action SHALL be a no-op (exit 0 without any side-effects) when `attach != 'yes'`.

#### Scenario: Attachment disabled

- **WHEN** the action runs with `attach=no`
- **THEN** the action SHALL exit 0 immediately without reading any files, making any API calls, or uploading any artifacts

#### Scenario: Execution file absent

- **WHEN** the action runs with `attach=yes` and the file `$RUNNER_TEMP/claude-execution-output.json` does not exist
- **THEN** the action SHALL log a warning and exit 0 without uploading anything

#### Scenario: Successful capture without encryption (private repo)

- **WHEN** the action runs with `attach=yes`, `encrypt=none`, and the repository is private
- **THEN** the action SHALL copy `$RUNNER_TEMP/claude-execution-output.json` to a working file, scrub the values of `ANTHROPIC_API_KEY` and `AGENT_GITHUB_TOKEN` environment variables (replacing each occurrence with `[REDACTED]`), and upload the scrubbed file as a GitHub Actions artifact named `agent-session-<run-id>-<job>` with a retention period of 14 days

### Requirement: capture action refuses plaintext upload on public repositories

The system SHALL refuse to upload an unencrypted execution transcript when the repository visibility is `public`.

#### Scenario: Plaintext upload attempted on public repo

- **WHEN** the action runs with `attach=yes`, `encrypt=none`, and the repository is public (determined via `gh api repos/$REPO --jq .visibility`)
- **THEN** the action SHALL exit with a non-zero code and print an error message stating that plaintext upload is not permitted on public repositories and that an `encrypt-recipient` must be provided

#### Scenario: Encrypted upload on public repo

- **WHEN** the action runs with `attach=yes`, `encrypt=age-recipient`, a valid `encrypt-recipient` value, and the repository is public
- **THEN** the action SHALL install `age`, scrub the working file, encrypt it with `age -r <encrypt-recipient>` producing `<file>.age`, delete the unencrypted working file, and upload the encrypted file as a GitHub Actions artifact

### Requirement: capture action scrubs known secret env vars

The system SHALL perform a best-effort scrub of the two secrets injected by OpenSpec Flow before any upload or encryption.

#### Scenario: Scrub replaces non-empty secret values

- **WHEN** `ANTHROPIC_API_KEY` or `AGENT_GITHUB_TOKEN` is non-empty at the time the capture action runs
- **THEN** every literal occurrence of the secret value in the working copy of the transcript SHALL be replaced with the string `[REDACTED]`

#### Scenario: Scrub is a no-op for empty env vars

- **WHEN** `ANTHROPIC_API_KEY` or `AGENT_GITHUB_TOKEN` is empty or unset
- **THEN** the scrub step for that variable SHALL be skipped without error

### Requirement: capture action runs with always() condition

The capture action SHALL be called from each agent job (plan, implement, respond) using `if: always()` so that the transcript is captured even when the agent step itself fails.

#### Scenario: Transcript captured after agent failure

- **WHEN** the agent step exits with a non-zero code and `attach=yes`
- **THEN** the capture action SHALL still run and attempt to upload the transcript

#### Scenario: Transcript captured after agent success

- **WHEN** the agent step exits with code 0 and `attach=yes`
- **THEN** the capture action SHALL run and upload the transcript
