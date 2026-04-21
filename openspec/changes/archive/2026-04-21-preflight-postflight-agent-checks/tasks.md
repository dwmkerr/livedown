## 1. Preflight Composite Action

- [x] 1.1 Create `.github/actions/openspec-flow-preflight/action.yml` with inputs: `gh-token`, `repo`, `issue-number`, `job`, `min-body-length` (default: `40`)
- [x] 1.2 Implement the `job=plan` branch: fetch issue body length via `gh issue view`, compare to `min-body-length`, set `skip=true` and post skip comment if too short
- [x] 1.3 Implement `job=implement` and `job=respond` branches: set `skip=false` and exit 0 (no body-length check)
- [x] 1.4 Implement skip comment format: blockquote prose, run URL included, no `AGENT_COMMENT_MARKER`, no `REENGAGE_FOOTER`
- [x] 1.5 Declare `skip` as an action output in the `outputs:` block

## 2. Postflight Composite Action

- [x] 2.1 Create `.github/actions/openspec-flow-postflight/action.yml` with inputs: `gh-token`, `repo`, `issue-number`, `job`, `base-sha`, `run-url`
- [x] 2.2 Implement commit-count check: compare `git rev-parse HEAD` to `base-sha`; if different, set `passed=true` and exit 0
- [x] 2.3 Implement marker-comment check with retry: fetch issue/PR comments up to 3 times (5s between attempts), look for `AGENT_COMMENT_MARKER`; if found, set `passed=true` and exit 0
- [x] 2.4 If both checks fail after retries, set `passed=false` and exit 1
- [x] 2.5 Declare `passed` as an action output in the `outputs:` block

## 3. Workflow Integration

- [x] 3.1 Add `MIN_BODY_LENGTH: "40"` to the top-level `env:` block in `openspec-flow.yaml`
- [x] 3.2 Add `actions/checkout` before the first preflight call in each job (already present in plan/implement/respond — verify ordering is correct)
- [x] 3.3 In the `plan` job: add preflight `uses:` step before `Run plan agent`; capture `base-sha` before the agent step; add postflight `uses:` step after the agent step; guard agent step and label-flip with `if: steps.preflight.outputs.skip != 'true'`
- [x] 3.4 In the `implement` job: same pattern as plan — preflight, capture base-sha, agent, postflight, guards
- [x] 3.5 In the `respond` job: same pattern — preflight (body-length skipped for respond), capture base-sha, agent, postflight, guards

## 4. Verification

- [ ] 4.1 Manually trigger the plan job against an issue with a body shorter than 40 chars; verify the skip comment appears and the agent step does not run
- [ ] 4.2 Manually trigger the plan job against a valid issue; verify the agent runs and postflight passes
- [x] 4.3 Confirm that `openspec validate preflight-postflight-agent-checks --strict` passes with no errors
