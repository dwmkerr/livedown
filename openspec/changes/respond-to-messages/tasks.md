## 1. Create the respond workflow

- [ ] 1.1 Create `.github/workflows/openspec-flow-respond.yaml` with a `labeled` trigger that fires when `openspec:start` is added to an issue or PR
- [ ] 1.2 Add a check step that determines context (issue vs. PR) and whether a change folder exists in `openspec/changes/`; skip with a no-op exit if no change folder is found and no lifecycle label is set
- [ ] 1.3 Add setup steps: checkout repository (full depth), setup Node.js, install OpenSpec CLI, clone and install claude-code-action (mirror the pattern in `openspec-flow.yaml`)
- [ ] 1.4 Write the agent prompt for the **issue context**: instruct the agent to read the full discussion, identify requested changes, update relevant artifacts, and post a summary comment listing each modified artifact
- [ ] 1.5 Write the agent prompt for the **PR context**: instruct the agent to read all PR comments and review threads, identify requested changes, update relevant artifacts, and post a summary comment
- [ ] 1.6 Add a post-agent step that removes the `openspec:start` label on success
- [ ] 1.7 Add a failure handler step that removes `openspec:start` and posts an error comment linking to the failed run

## 2. Add re-engagement footers to existing workflows

- [ ] 2.1 In `openspec-flow.yaml`, update the agent prompt template so that every comment the agent posts ends with a `---` and the footer: "Add the `openspec:start` label to re-engage the agent with the latest discussion."
- [ ] 2.2 In `openspec-flow-implement.yaml`, apply the same footer instruction to the agent prompt

## 3. Validation and testing

- [ ] 3.1 Run `openspec validate respond-to-messages --strict` locally and confirm it passes with zero errors
- [ ] 3.2 Verify the new workflow file passes `actionlint` (or equivalent YAML linting) with no errors
- [ ] 3.3 Manually test the respond workflow on a sandbox issue: add `openspec:start`, confirm the agent comments and removes the label
- [ ] 3.4 Confirm the footer appears in agent comments produced by a test run of `openspec-flow.yaml`
