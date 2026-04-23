# pr-usage-table Specification

## Purpose

Defines the structure and placement of the usage table that the OpenSpec
flow injects into spec and impl PR bodies to record which sub-agents or
skills were invoked during a run.

## Requirements

### Requirement: PR body contains a delimited usage table

Every spec PR and impl PR opened by the OpenSpec flow agent SHALL contain a usage table in its body. The table SHALL be wrapped by the opening marker `<!-- openspec-flow-usage-table -->` on its own line and the closing marker `<!-- /openspec-flow-usage-table -->` on its own line. The table SHALL appear after the recap paragraph and before the `---` separator line in the PR body.

#### Scenario: Spec PR body includes usage table

- **WHEN** the plan job opens a spec PR
- **THEN** the PR body SHALL contain a Markdown table between `<!-- openspec-flow-usage-table -->` and `<!-- /openspec-flow-usage-table -->` markers, positioned after the recap paragraph and before the `---` separator

#### Scenario: Impl PR body includes usage table

- **WHEN** the implement job opens an impl PR
- **THEN** the PR body SHALL contain a Markdown table between `<!-- openspec-flow-usage-table -->` and `<!-- /openspec-flow-usage-table -->` markers, positioned after the recap paragraph and before the `---` separator

### Requirement: Usage table has three columns: Step, Agent/Skill, Detail

The usage table SHALL have exactly three columns with headers **Step**, **Agent/Skill**, and **Detail**. Each row SHALL record one top-level step the agent took, naming the sub-agent or skill invoked and providing a concise detail note.

#### Scenario: Table header row is correct

- **WHEN** the usage table is present in a PR body
- **THEN** the first row of the table SHALL be the header `| Step | Agent/Skill | Detail |`

#### Scenario: Each invoked sub-agent or skill has a row

- **WHEN** the agent invokes a sub-agent or skill during the run
- **THEN** a row SHALL appear in the usage table for that invocation with a non-empty Step, a non-empty Agent/Skill value, and a non-empty Detail value

### Requirement: Usage table markers are unique in the PR body

The opening marker `<!-- openspec-flow-usage-table -->` and the closing marker `<!-- /openspec-flow-usage-table -->` SHALL each appear exactly once in the PR body.

#### Scenario: Markers appear exactly once

- **WHEN** a spec or impl PR body is inspected
- **THEN** each marker string SHALL occur exactly once in the body text
