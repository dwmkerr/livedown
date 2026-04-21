## ADDED Requirements

### Requirement: openspec-flow accepts session log passthrough inputs

The `openspec-flow.yaml` workflow SHALL accept four new optional `workflow_dispatch` / `workflow_call` inputs that are passed through to the agent-actions `claude.yml` reusable workflow: `attach_session_logs` (boolean, default `false`), `encrypt_session_logs` (string, default `none`), `session_logs_recipient` (string, default `''`), and `session_logs_retention_days` (number, default `14`).

#### Scenario: Session logging inputs not provided
- **WHEN** `openspec-flow.yaml` is triggered without session log inputs
- **THEN** the workflow SHALL default to `attach_session_logs: false` and no artifact is uploaded

#### Scenario: Session logging inputs provided and passed through
- **WHEN** `openspec-flow.yaml` is triggered with `attach_session_logs: true` and a valid `session_logs_recipient`
- **THEN** those values SHALL be passed through verbatim in the `with:` block of the `claude.yml` call

#### Scenario: Inputs are declared with correct types
- **WHEN** the workflow file is read
- **THEN** `attach_session_logs` SHALL be declared as `type: boolean`, `encrypt_session_logs` as `type: string`, `session_logs_recipient` as `type: string`, and `session_logs_retention_days` as `type: number`
