## MODIFIED Requirements

### Requirement: Single workflow file owns the full OpenSpec lifecycle

The system SHALL implement the complete OpenSpec automation lifecycle —
plan, implement, and respond — within a single GitHub Actions workflow
file (`.github/workflows/openspec-flow.yaml`). No second workflow file
SHALL be required for any lifecycle stage. Repeated operation blocks
(prune-comments, raise-comment, flip-label, handle-failure) SHALL be
extracted into local composite actions under `.github/actions/` and
called via `uses:` rather than duplicated inline.

The agent prompts used by the plan and implement jobs SHALL instruct the
agent to include a usage table (see `pr-usage-table` spec) in every PR
body it creates, positioned after the recap paragraph and before the `---`
separator.

#### Scenario: Plan job fires on issue assignment or start label

- **WHEN** a GitHub issue is assigned to the agent login, or the
  `openspec:start` label is added to an issue with no lifecycle label
- **THEN** the `plan` job runs and opens a `spec/<n>-<slug>` proposal PR
  whose body contains a usage table between `<!-- openspec-flow-usage-table -->`
  and `<!-- /openspec-flow-usage-table -->` markers

#### Scenario: Implement job fires on proposal PR merge

- **WHEN** a PR whose head branch matches `spec/<n>-<slug>` is merged
  into main and the linked issue is in `openspec:spec-ready`
- **THEN** the `implement` job runs and opens an `impl/<n>-<slug>` code PR
  whose body contains a usage table between `<!-- openspec-flow-usage-table -->`
  and `<!-- /openspec-flow-usage-table -->` markers

#### Scenario: Respond job fires on openspec:start label on a PR

- **WHEN** the `openspec:start` label is added to a PR whose branch
  matches `spec/**` or `impl/**`
- **THEN** the `respond` job runs, re-reads the PR conversation, and
  pushes refinement commits to the PR branch

#### Scenario: Jobs share a single env block

- **WHEN** the workflow file is read
- **THEN** version pins, label names, and the agent comment marker
  appear exactly once in the top-level `env:` block

#### Scenario: Composite actions called via uses

- **WHEN** any job needs to prune comments, raise a comment, flip a label, or handle failure
- **THEN** the job SHALL call the corresponding local composite action via `uses: ./.github/actions/<name>` rather than duplicating the shell script inline

#### Scenario: Checkout precedes composite action calls

- **WHEN** a job is about to call any local composite action
- **THEN** `actions/checkout` SHALL have already run in that job so the action files are present on disk
