## 1. agent-actions: New workflow inputs

- [ ] 1.1 Add `attach_session_logs` boolean input (default: `false`) to `claude.yml` in `dwmkerr/agent-actions`
- [ ] 1.2 Add `encrypt_session_logs` string input (default: `none`) with allowed values `age | password | none`
- [ ] 1.3 Add `session_logs_recipient` string input (default: `''`) for age public key
- [ ] 1.4 Add `session_logs_retention_days` number input (default: `14`) for artifact retention

## 2. agent-actions: Install age on demand

- [ ] 2.1 Add a conditional step that installs `age` via `apt-get install -y age` when `encrypt_session_logs` is `age` or `password` and `attach_session_logs` is `true`
- [ ] 2.2 Condition the install step on `runner.os == 'Linux'`; document that non-Linux runners must pre-install `age`

## 3. agent-actions: Secret scrubbing step

- [ ] 3.1 Add a step (runs after the agent step, before upload) that reads the execution file and replaces values of env vars matching `*SECRET* | *TOKEN* | *KEY* | *PASSWORD* | *PASS*` with `[REDACTED]`
- [ ] 3.2 Write the scrubbed content to a temp file to avoid mutating the original output
- [ ] 3.3 Condition the scrub step on `attach_session_logs == 'true'` and execution file output being non-empty

## 4. agent-actions: Public repo safety guard

- [ ] 4.1 Add a step that checks `github.event.repository.visibility == 'public'` and `encrypt_session_logs == 'none'` and exits with a non-zero code and descriptive error message if both are true
- [ ] 4.2 Place this guard step before the encryption and upload steps

## 5. agent-actions: Encryption step

- [ ] 5.1 Add conditional encryption step for `encrypt_session_logs == 'age'`: run `age -r <session_logs_recipient> -o session.json.age <scrubbed-file>`
- [ ] 5.2 Add conditional encryption step for `encrypt_session_logs == 'password'`: validate `SESSION_LOGS_PASSWORD` is set, then run `age --passphrase -o session.json.age <scrubbed-file>`
- [ ] 5.3 For `encrypt_session_logs == 'none'`: use the scrubbed file directly (no `.age` extension)
- [ ] 5.4 Set a step output `upload_file` pointing to the final file path (encrypted or plain)

## 6. agent-actions: Artifact upload step

- [ ] 6.1 Add an `actions/upload-artifact` step with name `agent-session-${{ github.run_id }}-${{ github.run_attempt }}`
- [ ] 6.2 Set `path` to `steps.<upload-prep-step>.outputs.upload_file`
- [ ] 6.3 Set `retention-days` to `inputs.session_logs_retention_days`
- [ ] 6.4 Set `if: always()` so the artifact is captured even when the agent step failed
- [ ] 6.5 Condition the entire upload step on `inputs.attach_session_logs == 'true'` and execution file output being non-empty

## 7. openspec-flow: Passthrough inputs

- [ ] 7.1 Add `attach_session_logs` (type: boolean, default: `false`) to `openspec-flow.yaml` inputs
- [ ] 7.2 Add `encrypt_session_logs` (type: string, default: `none`) to inputs
- [ ] 7.3 Add `session_logs_recipient` (type: string, default: `''`) to inputs
- [ ] 7.4 Add `session_logs_retention_days` (type: number, default: `14`) to inputs
- [ ] 7.5 Pass all four inputs through in the `with:` block of the `claude.yml` reusable workflow call

## 8. Validation and documentation

- [ ] 8.1 Run `npx openspec validate attach-agent-session-json --strict` and resolve any failures
- [ ] 8.2 Update `docs/architecture.md` if the relay or workflow orchestration section is affected
- [ ] 8.3 Add a brief note to `README.md` "How It Works" section documenting the session log artifact opt-in
