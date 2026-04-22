## Why

When an OpenSpec agent runs (plan or implement), it invokes sub-agents and skills but provides no structured record of what was used. Adding a usage table to spec and impl PR bodies makes the agent's work auditable and helps maintainers understand which automation drove each artifact.

## What Changes

- Both spec PR bodies and impl PR bodies will contain an HTML-delimited usage table after the recap paragraph and before the `---` separator.
- The table is wrapped in `<!-- openspec-flow-usage-table -->` … `<!-- /openspec-flow-usage-table -->` markers so it can be found and updated by automation.
- The usage data is sourced from the Claude session logs, scraped after each agent run using `dwmkerr/claude-toolkit`. Agent self-reporting is **not** used — session logs are the authoritative source.
- Table columns: **Step**, **Agent/Skill**, **Detail**.
- The `openspec-flow` workflow adds a post-agent step that uses `dwmkerr/claude-toolkit` to scrape the session log and inject the usage table into the PR body.

## Capabilities

### New Capabilities

- `pr-usage-table`: A structured HTML-delimited table embedded in spec/impl PR bodies that records each sub-agent and skill invoked during the run, with columns Step, Agent/Skill, and Detail.

### Modified Capabilities

- `openspec-flow`: The plan and implement agent prompts change to require the usage table in the PR body — this is a spec-level behaviour change (the PR body format is a requirement of the openspec-flow spec).

## Impact

- `.github/workflows/openspec-flow.yaml` — a post-agent step is added to the plan and implement jobs to scrape session logs and inject the usage table into the PR body.
- `dwmkerr/claude-toolkit` is added as a dependency (used in the workflow step to parse session logs).
- No changes to agent prompt strings are required; the table is produced by the post-processing step, not the agent.
- No agent skill files need updating.
