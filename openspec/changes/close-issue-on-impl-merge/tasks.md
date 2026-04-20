## 1. Update Implement Agent Prompt

- [ ] 1.1 Open `.claude/agents/implement.md` and locate the PR body template line containing `Refs #`
- [ ] 1.2 Replace `Refs #${ISSUE_NUMBER}` (or equivalent) with `Closes #${ISSUE_NUMBER}`

## 2. Add Cleanup Job to Workflow

- [ ] 2.1 Open `.github/workflows/openspec-flow.yaml`
- [ ] 2.2 Add `pull_request` with type `closed` and branch filter `impl/**` to the workflow `on:` triggers
- [ ] 2.3 Add `cleanup-on-impl-merge` job that runs only when `github.event.pull_request.merged == true`
- [ ] 2.4 In the job, extract the issue number from `github.head_ref` using a shell regex (`impl/<n>-*` pattern)
- [ ] 2.5 Add a step that removes the `openspec:review` label from the extracted issue number using `gh issue edit <n> --remove-label openspec:review`
- [ ] 2.6 Confirm `issues: write` permission is present in the job (or inherited from workflow-level permissions)

## 3. Verify

- [ ] 3.1 Manually confirm the implement agent prompt now contains `Closes #` instead of `Refs #`
- [ ] 3.2 Confirm the new workflow job appears in `openspec-flow.yaml` with the correct trigger and condition
