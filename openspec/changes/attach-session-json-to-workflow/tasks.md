## 1. Workflow env block

- [ ] 1.1 Add `attach_session_logs` env var (default empty) to top-level `env:` block in `.github/workflows/openspec-flow.yaml`
- [ ] 1.2 Add `encrypt_session_logs_password` env var (sourced from `${{ secrets.ENCRYPT_SESSION_LOGS_PASSWORD }}`) to the top-level `env:` block
- [ ] 1.3 Add `encrypt_session_logs_key` env var (sourced from `${{ secrets.ENCRYPT_SESSION_LOGS_KEY }}`) with a comment marking it as "reserved, not yet implemented"

## 2. Capture and scrub script

- [ ] 2.1 Write a reusable inline bash script (or composite action step) that: checks `$RUNNER_TEMP/claude-execution-output.json` exists, copies it to `/tmp/session-${JOB_NAME}.json`, and exits 0 with a warning if absent
- [ ] 2.2 Extend the script to iterate `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `OVERRIDE_GITHUB_TOKEN` and redact non-empty values using `python3 -c` substitution (safe for values containing regex metacharacters)
- [ ] 2.3 Add hard-refuse check: if repository is public (`github.event.repository.private == false`) and `encrypt_session_logs_password` is empty, exit 1 and post a warning comment

## 3. Encryption step

- [ ] 3.1 Add an encryption step that runs when `encrypt_session_logs_password` is non-empty: `echo "$ENCRYPT_PASSWORD" | age -p -o /tmp/session-${JOB_NAME}.json.age /tmp/session-${JOB_NAME}.json`
- [ ] 3.2 Delete the plaintext working file after successful encryption
- [ ] 3.3 Add a warning annotation when `encrypt_session_logs_key` is non-empty (`::warning::encrypt_session_logs_key is not yet implemented; ignoring`)

## 4. Upload step

- [ ] 4.1 Add `actions/upload-artifact@v4` step after capture/scrub/encrypt steps in the plan job, with `name: agent-session-${{ github.run_id }}-plan`, `path: /tmp/session-plan.json*`, `retention-days: 14`, `continue-on-error: true`
- [ ] 4.2 Add equivalent upload step to the implement job (`agent-session-${{ github.run_id }}-implement`)
- [ ] 4.3 Add equivalent upload step to the respond job (`agent-session-${{ github.run_id }}-respond`)
- [ ] 4.4 Ensure all capture and upload steps use `if: env.attach_session_logs == 'yes' && always()` condition

## 5. Documentation

- [ ] 5.1 Add a "Session Logs" section to the CLAUDE.md secrets table documenting `ENCRYPT_SESSION_LOGS_PASSWORD` (optional; generate and store as repo secret)
- [ ] 5.2 Document the `attach_session_logs` / `encrypt_session_logs_password` inputs in a comment block at the top of `openspec-flow.yaml`
- [ ] 5.3 Note that `encrypt_session_logs_key` is reserved for future key-based encryption in the same comment block

## 6. Verification

- [ ] 6.1 Manually test with `attach_session_logs=yes` on a private repo (no password): confirm artifact appears in run, scrubbed values are absent from transcript
- [ ] 6.2 Test with `encrypt_session_logs_password` set: confirm artifact is `.age` file, decryptable with `age --decrypt -p`
- [ ] 6.3 Test on a simulated public repo context (set `REPO_PRIVATE=false` in local shell): confirm capture step exits 1 and no artifact is uploaded
- [ ] 6.4 Test with `attach_session_logs` unset (default): confirm zero extra steps execute and workflow run time is unchanged
