## 1. Create composite action files

- [x] 1.1 Create `.github/actions/openspec-flow-prune-comments/action.yml` with `gh-token`, `repo`, and `issue-number` inputs; shell script copies the inline prune logic verbatim
- [x] 1.2 Create `.github/actions/openspec-flow-raise-comment/action.yml` with `gh-token`, `repo`, `issue-number`, `run-url`, and `message` inputs; shell script posts the marker + message + footer comment
- [x] 1.3 Create `.github/actions/openspec-flow-flip-label/action.yml` with `gh-token`, `repo`, `issue-number`, `remove-label`, and `add-label` inputs; shell script runs `gh issue edit` with both flags
- [x] 1.4 Create `.github/actions/openspec-flow-handle-failure/action.yml` with `gh-token`, `repo`, `issue-number`, `run-url`, `current-label`, and `message` inputs; shell script removes current-label, adds `$LABEL_FAILED`, posts failure comment

## 2. Refactor plan job in openspec-flow.yaml

- [x] 2.1 Move the `actions/checkout` step to immediately after the `Verify required labels exist` step (before `Prune prior agent summary comments`)
- [x] 2.2 Replace the inline `Prune prior agent summary comments` step with `uses: ./.github/actions/openspec-flow-prune-comments`
- [x] 2.3 Replace the inline `React, label, and post starting comment` step with `uses: ./.github/actions/openspec-flow-raise-comment`
- [x] 2.4 Replace the inline `Flip label to openspec:spec-ready` step with `uses: ./.github/actions/openspec-flow-flip-label`
- [x] 2.5 Replace the inline `Handle failure` step with `uses: ./.github/actions/openspec-flow-handle-failure`

## 3. Refactor implement job in openspec-flow.yaml

- [x] 3.1 Move the `actions/checkout` step to immediately after the `Verify issue is in spec-ready state` step
- [x] 3.2 Replace the inline `Prune prior agent summary comments` step with `uses: ./.github/actions/openspec-flow-prune-comments`
- [x] 3.3 Replace the inline `React, flip label, post starting comment` step with `uses: ./.github/actions/openspec-flow-raise-comment`
- [x] 3.4 Replace the inline `Flip label to openspec:review` step with `uses: ./.github/actions/openspec-flow-flip-label`
- [x] 3.5 Replace the inline `Handle failure` step with `uses: ./.github/actions/openspec-flow-handle-failure`

## 4. Refactor respond job in openspec-flow.yaml

- [x] 4.1 Move `actions/checkout` to immediately after the `Check trigger` step (before `Prune prior agent summary comments`)
- [x] 4.2 Replace the inline `Prune prior agent summary comments` step with `uses: ./.github/actions/openspec-flow-prune-comments`
- [x] 4.3 Replace the inline `React and post starting comment` step with `uses: ./.github/actions/openspec-flow-raise-comment`
- [x] 4.4 Replace the inline `Handle failure` step with `uses: ./.github/actions/openspec-flow-handle-failure`

## 5. Verification

- [x] 5.1 Run `actionlint` (or `act --dryrun`) on the updated `openspec-flow.yaml` to confirm no syntax errors
- [x] 5.2 Confirm the workflow line count has decreased and no inline prune/raise/flip/handle-failure shell blocks remain
- [x] 5.3 Manually trigger a dry-run or review the `plan` job step list to confirm checkout precedes all composite action calls
