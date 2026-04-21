## 1. Investigate `dwmkerr/claude-toolkit` session log scraping API

- [x] 1.1 Read the `dwmkerr/claude-toolkit` README and relevant source to identify the CLI command / API for extracting sub-agent and skill invocations from a Claude session log
- [x] 1.2 Confirm the session log file path written by the Claude Code GitHub Actions runner
- [x] 1.3 Document the exact command and output format to use in the workflow step

## 2. Add Post-Agent Step to Plan Job

- [x] 2.1 Locate the plan job in `.github/workflows/openspec-flow.yaml`
- [x] 2.2 Add a post-agent step that: (a) runs `dwmkerr/claude-toolkit` against the session log, (b) formats the output as a three-column Markdown table (`Step | Agent/Skill | Detail`), and (c) injects the table into the spec PR body between `<!-- openspec-flow-usage-table -->` and `<!-- /openspec-flow-usage-table -->` markers

## 3. Add Post-Agent Step to Implement Job

- [x] 3.1 Locate the implement job in `.github/workflows/openspec-flow.yaml`
- [x] 3.2 Add the equivalent post-agent step for the impl PR body (same logic as step 2.2)

## 4. Pin `dwmkerr/claude-toolkit` Version

- [x] 4.1 Pin the version of `dwmkerr/claude-toolkit` used in both steps to a specific release tag

## 5. Validate

- [x] 5.1 Run `npx openspec validate show-subagent-skill-usage-table --strict` and confirm it passes with no errors
