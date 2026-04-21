## ADDED Requirements

### Requirement: openspec-flow workflow exposes session log configuration via env vars

The `openspec-flow.yaml` workflow SHALL define three top-level `env:` variables: `ATTACH_SESSION_LOGS` (default `no`), `ENCRYPT_SESSION_LOGS` (default `none`), and `ENCRYPT_SESSION_LOGS_RECIPIENT` (default empty string). These are the sole configuration surface for the session capture feature.

#### Scenario: Default configuration produces no artifacts

- **WHEN** the workflow runs with the default env values (`ATTACH_SESSION_LOGS: no`)
- **THEN** no session artifact SHALL be uploaded for any agent job

#### Scenario: Opt-in configuration enables capture for all agent jobs

- **WHEN** `ATTACH_SESSION_LOGS` is set to `yes` in the workflow env
- **THEN** each of the plan, implement, and respond jobs SHALL call the capture action after their agent step

### Requirement: openspec-flow workflow calls capture action after each agent step

Each of the plan, implement, and respond jobs in `openspec-flow.yaml` SHALL include a step immediately after the agent step that calls `./.github/actions/openspec-flow-capture-session` with `if: always()`.

#### Scenario: Capture step present in plan job

- **WHEN** the plan job runs its agent step
- **THEN** a subsequent step with `if: always()` SHALL call the capture action passing `attach: ${{ env.ATTACH_SESSION_LOGS }}`, `encrypt: ${{ env.ENCRYPT_SESSION_LOGS }}`, `encrypt-recipient: ${{ env.ENCRYPT_SESSION_LOGS_RECIPIENT }}`, `gh-token`, `repo`, `run-id`, and `job: plan`

#### Scenario: Capture step present in implement job

- **WHEN** the implement job runs its agent step
- **THEN** a subsequent step with `if: always()` SHALL call the capture action passing the same inputs with `job: implement`

#### Scenario: Capture step present in respond job

- **WHEN** the respond job runs its agent step
- **THEN** a subsequent step with `if: always()` SHALL call the capture action passing the same inputs with `job: respond`

### Requirement: openspec-flow workflow grants artifact upload permission

The `openspec-flow.yaml` workflow's `permissions:` block SHALL include `actions: write` to permit `actions/upload-artifact` calls from within the composite action.

#### Scenario: Permission present when capture is enabled

- **WHEN** `ATTACH_SESSION_LOGS: yes` and the capture action calls `actions/upload-artifact`
- **THEN** the upload SHALL succeed without a permissions error
