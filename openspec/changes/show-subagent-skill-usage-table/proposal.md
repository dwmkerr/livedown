## Why

When an OpenSpec agent runs (plan or implement), it invokes sub-agents and skills but provides no structured record of what was used. Adding a usage table to spec and impl PR bodies makes the agent's work auditable and helps maintainers understand which automation drove each artifact.

## What Changes

- Both spec PR bodies and impl PR bodies will contain an HTML-delimited usage table after the recap paragraph and before the `---` separator.
- The table is wrapped in `<!-- openspec-flow-usage-table -->` … `<!-- /openspec-flow-usage-table -->` markers so it can be found and updated by automation.
- The agent self-reports the steps it took (sub-agent name, skills used, CLI calls) as rows in the table.
- Table columns: **Step**, **Agent/Skill**, **Detail**.
- The `openspec-flow` workflow prompts for the plan and implement agent jobs will be updated to include instructions for producing the table.

## Capabilities

### New Capabilities

- `pr-usage-table`: A structured HTML-delimited table embedded in spec/impl PR bodies that records each sub-agent and skill invoked during the run, with columns Step, Agent/Skill, and Detail.

### Modified Capabilities

- `openspec-flow`: The plan and implement agent prompts change to require the usage table in the PR body — this is a spec-level behaviour change (the PR body format is a requirement of the openspec-flow spec).

## Impact

- `.github/workflows/openspec-flow.yaml` — agent prompt strings for the plan and implement jobs.
- Possibly agent skill files (`.claude/skills/`) if they contain PR body templates.
- No runtime dependencies added; the table is plain Markdown/HTML rendered by GitHub.
