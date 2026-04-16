## 1. Repo Labels

- [ ] 1.1 Create `openspec:implement` label in the repo (color: `0052CC`, description: "OpenSpec Flow: implement workflow running (apply + verify + archive)")
- [ ] 1.2 Create `openspec:review` label in the repo (color: `0E8A16`, description: "OpenSpec Flow: code PR open, awaiting human review")

## 2. Workflow File

- [ ] 2.1 Create `.github/workflows/openspec-flow-implement.yaml` with file header comment block (purpose, numbered operations, lifecycle position, trigger docs, label docs, sub-agent docs, configurable knobs, required secrets)
- [ ] 2.2 Add `name`, `on` (pull_request closed + branch filter `spec/**`), `env`, `permissions`, and `concurrency` sections — reuse same env var names as `openspec-flow.yaml` where possible; add `LABEL_IMPLEMENT` and `LABEL_REVIEW`
- [ ] 2.3 Implement `check-trigger` step: verify `merged == true`, extract issue number from branch (`spec/<n>-*`), verify issue carries `openspec:spec-ready`, output `run`, `issue_number`, `change_name`
- [ ] 2.4 Implement `verify-required-labels` step: check all six `openspec:*` labels exist; post issue comment with creation commands and exit 1 if any missing
- [ ] 2.5 Implement `react-label-comment` step: flip `openspec:spec-ready` → `openspec:implement`, post "code PR will open automatically" comment, add eyes reaction
- [ ] 2.6 Add `checkout`, `setup-node`, `install-openspec-cli`, `clone-claude-code-action`, `install-bun`, `install-dependencies` steps (copy from `openspec-flow.yaml`, no changes needed)
- [ ] 2.7 Implement `verify-openspec-skills` step: check `.claude/skills/openspec-apply-change/SKILL.md` exists; post comment + flip to `openspec:failed` + exit 1 if absent
- [ ] 2.8 Implement `run-agent` step: build PROMPT delegating to `openspec-apply-change` → `openspec-verify-change` → `openspec-archive-change` skills with change name passed as context; build ALL_INPUTS JSON via jq; export CLAUDE_ARGS; run `bun run /tmp/claude-code-action/src/entrypoints/run.ts`
- [ ] 2.9 Implement `flip-label-success` step (runs on success): remove `openspec:implement`, add `openspec:review`
- [ ] 2.10 Implement `flip-label-failure` step (runs on failure): remove current lifecycle label, add `openspec:failed`, post comment with run URL

## 3. Validation

- [ ] 3.1 Run `openspec validate add-openspec-flow-implement-workflow --strict` and confirm it passes with no errors
- [ ] 3.2 Lint the new workflow YAML with `actionlint` or equivalent; fix any issues
- [ ] 3.3 Manually verify the trigger filter: confirm a PR with branch `spec/26-foo` matches and a PR with branch `fix/bar` does not (dry-run or test event)
