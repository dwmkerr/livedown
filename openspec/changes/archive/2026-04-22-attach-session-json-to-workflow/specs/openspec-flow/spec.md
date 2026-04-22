## ADDED Requirements

### Requirement: openspec-flow workflow exposes session log config inputs

The OpenSpec Flow workflow SHALL declare three new entries in its
top-level `env:` block:
- `attach_session_logs` (default empty string, falsy)
- `encrypt_session_logs_password` (sourced from a repo secret, default empty)
- `encrypt_session_logs_key` (sourced from a repo secret or input, default empty)

These vars SHALL appear exactly once in the workflow, consistent with
the existing convention of declaring all config in the top-level `env:` block.

#### Scenario: Default — env vars present but inactive

- **WHEN** the workflow runs without any override to these env vars
- **THEN** `attach_session_logs` SHALL be empty (falsy), and no session log capture steps SHALL execute

#### Scenario: Opt-in via env override

- **WHEN** a maintainer sets `attach_session_logs: 'yes'` in the workflow `env:` block (or via a `workflow_dispatch` input in future)
- **THEN** the session log capture steps SHALL execute for all three agent jobs (plan, implement, respond)

### Requirement: Each agent job captures session logs after its agent step

The workflow SHALL include two additional steps — "Capture session log" and
"Upload session log artifact" — immediately after the agent step in each of
the plan, implement, and respond jobs. Both steps SHALL be conditioned on
`if: env.attach_session_logs == 'yes' && always()`.

#### Scenario: Plan job captures log

- **WHEN** `attach_session_logs=yes` and the plan job runs (regardless of agent step outcome)
- **THEN** the capture and upload steps SHALL execute immediately after `Run plan agent`

#### Scenario: Implement job captures log

- **WHEN** `attach_session_logs=yes` and the implement job runs (regardless of agent step outcome)
- **THEN** the capture and upload steps SHALL execute immediately after `Run implement agent`

#### Scenario: Respond job captures log

- **WHEN** `attach_session_logs=yes` and the respond job runs (regardless of agent step outcome)
- **THEN** the capture and upload steps SHALL execute immediately after `Run respond agent`
