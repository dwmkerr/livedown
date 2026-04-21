## 1. Capture Composite Action

- [ ] 1.1 Create `.github/actions/openspec-flow-capture-session/action.yml` with inputs: `gh-token`, `repo`, `run-id`, `job`, `attach` (default: `no`), `encrypt` (default: `none`), `encrypt-recipient` (default: `""`)
- [ ] 1.2 Implement early-exit when `attach != 'yes'` (exit 0, no side-effects)
- [ ] 1.3 Implement existence check: if `$RUNNER_TEMP/claude-execution-output.json` does not exist, log a warning and exit 0
- [ ] 1.4 Implement repo-visibility guard: fetch `gh api repos/$REPO --jq .visibility`; if `public` and `encrypt != 'age-recipient'`, print an error and exit 1
- [ ] 1.5 Implement best-effort scrub: copy execution file to `/tmp/session-capture.json`; run `sed -i` to replace non-empty values of `ANTHROPIC_API_KEY` and `AGENT_GITHUB_TOKEN` with `[REDACTED]`
- [ ] 1.6 Implement plaintext upload path: when `encrypt == 'none'` (and repo is private), proceed directly to upload with the scrubbed file
- [ ] 1.7 Implement age-encrypted upload path: install `age` via `sudo apt-get install -y age`; run `age -r "$ENCRYPT_RECIPIENT" /tmp/session-capture.json > /tmp/session-capture.json.age`; remove the unencrypted working file
- [ ] 1.8 Implement `actions/upload-artifact@v4` step with `name: agent-session-${{ inputs.run-id }}-${{ inputs.job }}`, `path: /tmp/session-capture.json*`, `retention-days: 14`

## 2. Workflow Integration

- [ ] 2.1 Add `ATTACH_SESSION_LOGS: "no"`, `ENCRYPT_SESSION_LOGS: "none"`, `ENCRYPT_SESSION_LOGS_RECIPIENT: ""` to the top-level `env:` block in `openspec-flow.yaml`
- [ ] 2.2 Update `permissions:` block in `openspec-flow.yaml` to include `actions: write`
- [ ] 2.3 In the `plan` job: add capture `uses:` step immediately after `Run plan agent`, with `if: always()`, passing all required inputs
- [ ] 2.4 In the `implement` job: add capture `uses:` step immediately after `Run implement agent`, with `if: always()`, passing all required inputs with `job: implement`
- [ ] 2.5 In the `respond` job: add capture `uses:` step immediately after `Run respond agent`, with `if: always()`, passing all required inputs with `job: respond`

## 3. Verification

- [ ] 3.1 Manually trigger the plan job with `ATTACH_SESSION_LOGS: yes` on a private repo (no encryption); verify the artifact `agent-session-<run_id>-plan` appears in the workflow run and the transcript does not contain the raw `ANTHROPIC_API_KEY` value
- [ ] 3.2 Manually trigger the plan job with `ATTACH_SESSION_LOGS: yes` on a public repo without an encryption recipient; verify the capture step fails with a clear error message and no artifact is uploaded
- [ ] 3.3 Manually trigger the plan job with `ATTACH_SESSION_LOGS: yes`, `ENCRYPT_SESSION_LOGS: age-recipient`, and a valid `ENCRYPT_SESSION_LOGS_RECIPIENT`; verify the artifact contains a `.age` file and the unencrypted file is absent
- [ ] 3.4 Verify that with `ATTACH_SESSION_LOGS: no` (default), no artifact is produced and the capture step exits 0 in under 1 second
- [ ] 3.5 Confirm `openspec validate attach-agent-session-json --strict` passes with no errors
