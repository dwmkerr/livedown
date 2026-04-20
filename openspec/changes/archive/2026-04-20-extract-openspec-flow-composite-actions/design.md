## Context

`openspec-flow.yaml` is ~711 lines and spans three jobs (`plan`, `implement`, `respond`). Each job contains the same four shell script blocks verbatim:

1. **prune-comments** — lists all comments on the issue/PR, filters by `AGENT_COMMENT_MARKER`, deletes matches
2. **raise-comment** — adds a reaction, optionally flips a label, posts a "starting…" status comment
3. **flip-label** — removes one label and adds another (used on success at end of job)
4. **handle-failure** — posts a failure comment and flips to `openspec:failed` (used in `if: failure()` step)

GitHub composite actions are the standard mechanism for eliminating this kind of duplication within a single repository. They live under `.github/actions/<name>/action.yml`, are referenced with `uses: ./.github/actions/<name>`, and can receive inputs for parameterisation.

The blocker for using composite actions today is that `actions/checkout` runs *after* the prune-comments and raise-comment steps. Composite actions are local — they are resolved from the workspace — so the checkout must happen before the first `uses: ./.github/actions/...` reference.

## Goals / Non-Goals

**Goals:**
- Extract the four repeated blocks into four composite actions under `.github/actions/`
- Move `actions/checkout` earlier in all three jobs so local actions are available
- Pass `GH_TOKEN` and repo/number coordinates as inputs (makes each action independently testable)
- Zero behaviour change — triggers, label names, comment format, failure handling all identical

**Non-Goals:**
- Merging or collapsing the three jobs into one
- Changing the agent prompts or timeout values
- Adding new capabilities or fixing bugs beyond the refactor scope
- Replacing the top-level `env:` block or any secret references

## Decisions

### D1: Four standalone composite actions, not a single "operation" action

Each of the four operations (`prune-comments`, `raise-comment`, `flip-label`, `handle-failure`) becomes its own `action.yml`. Alternatives considered:

- *Single parameterised action with a `mode` input*: Rejected — modes obscure intent and prevent individual steps from having explicit `if:` conditions.
- *Three actions (merge flip-label into raise-comment)*: Rejected — `flip-label` is called at a different point in the job (success path at the end), so merging would require the raise-comment action to do the flip too, which changes meaning.

### D2: handle-failure is standalone (~15 lines), not a call chain

`handle-failure` posts a comment and flips a label. It could call `raise-comment` and `flip-label` internally, but that adds composite-action-calling-composite-action complexity with no benefit. Keeping it as a flat 15-line shell script is simpler to read and debug.

### D3: Checkout moves before prune-comments in all three jobs

Because composite actions are resolved from the checked-out workspace, the checkout step must precede the first `uses: ./.github/actions/...` reference. In the current workflow, `prune-comments` runs before checkout (with an inline comment explaining exactly this constraint). Moving checkout earlier is the natural fix. The inline `actions/checkout` comment block can be removed once the action exists.

### D4: GH_TOKEN threaded via composite action inputs

Each action declares a `gh-token` input (required). Callers pass `${{ secrets.AGENT_GITHUB_TOKEN || github.token }}`. This avoids relying on ambient environment variables inside composite actions and makes each action independently runnable in test contexts.

### D5: No label-name inputs — use workflow-level env vars

Label names (`openspec:exploring`, `openspec:failed`, etc.) are already in the top-level `env:` block and are available to composite action `run:` steps as environment variables. Adding them as action inputs would duplicate the single-source-of-truth principle from the spec. The composite actions reference `$LABEL_*` env vars directly.

## Risks / Trade-offs

- [Checkout moves earlier] → Some pre-checkout steps (`check`, `verify-labels`) are fine before checkout. Moving checkout above prune-comments means the workspace is fetched before the gate checks complete. Mitigation: gate steps still run first; checkout is guarded by `if: steps.check.outputs.run == 'true'` in all jobs, so it only fires when the job actually needs to proceed.

- [Composite actions use workflow env vars] → If a future caller outside `openspec-flow.yaml` wants to use these actions, it must supply the same `LABEL_*` env vars. Mitigation: documented in each `action.yml` description; acceptable tradeoff for keeping label names DRY.

- [Behaviour parity] → Any subtle difference in shell quoting or variable expansion between inline and composite versions would silently break the workflow. Mitigation: the shell scripts are copied verbatim; the only change is input parameterisation (`${{ inputs.gh-token }}` replaces `${{ secrets.AGENT_GITHUB_TOKEN || github.token }}`).
