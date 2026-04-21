## 1. Update Plan Job Prompt

- [ ] 1.1 Locate the agent prompt string in the plan job of `.github/workflows/openspec-flow.yaml`
- [ ] 1.2 Add instructions to the prompt requiring the agent to include the usage table (markers + three-column Markdown table) in the spec PR body, after the recap paragraph and before the `---` separator

## 2. Update Implement Job Prompt

- [ ] 2.1 Locate the agent prompt string in the implement job of `.github/workflows/openspec-flow.yaml`
- [ ] 2.2 Add instructions to the prompt requiring the agent to include the usage table in the impl PR body, after the recap paragraph and before the `---` separator

## 3. Update Skill Templates (if applicable)

- [ ] 3.1 Check `.claude/skills/` for any skill files that contain a PR body template (e.g., `openspec-ff-change`, `openspec-explore`)
- [ ] 3.2 For each skill file that contains a PR body template, add the usage table markers and example table in the appropriate position

## 4. Validate

- [ ] 4.1 Run `npx openspec validate show-subagent-skill-usage-table --strict` and confirm it passes with no errors
