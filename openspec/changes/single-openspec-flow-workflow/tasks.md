## 1. Merge implement job into openspec-flow.yaml

- [ ] 1.1 Expand the `on:` block in `openspec-flow.yaml` to add `pull_request: types: [closed] branches: [main]` alongside the existing `issues` trigger.
- [ ] 1.2 Add all env vars from `openspec-flow-implement.yaml` into the top-level `env:` block of `openspec-flow.yaml`, removing duplicates (version pins and label names appear once).
- [ ] 1.3 Rename the existing `openspec-flow` job to `propose`.
- [ ] 1.4 Copy the full `openspec-flow-implement` job from `openspec-flow-implement.yaml` into `openspec-flow.yaml` as job `implement`, preserving all steps verbatim.
- [ ] 1.5 Update any env var references inside the `implement` job that previously read from the file-level `env:` block to ensure they resolve correctly from the unified top-level `env:` block (no functional change expected — just verify nothing is shadowed).

## 2. Delete the implement workflow file

- [ ] 2.1 Delete `.github/workflows/openspec-flow-implement.yaml`.

## 3. Verify correctness

- [ ] 3.1 Confirm `openspec-flow.yaml` contains exactly one `on:` block with both `issues` and `pull_request` triggers.
- [ ] 3.2 Confirm `CLAUDE_CODE_ACTION_REF` and `OPENSPEC_CLI_VERSION` appear exactly once in the file.
- [ ] 3.3 Confirm all label env vars (`LABEL_START`, `LABEL_EXPLORING`, `LABEL_SPEC_READY`, `LABEL_IMPLEMENT`, `LABEL_REVIEW`, `LABEL_FAILED`) appear exactly once in the top-level `env:` block.
- [ ] 3.4 Confirm the `propose` job's trigger guard still handles only `assigned` and `labeled` issue events.
- [ ] 3.5 Confirm the `implement` job's trigger guard still fires only on `spec/**` PR merges into main.
- [ ] 3.6 Confirm `.github/workflows/openspec-flow-implement.yaml` no longer exists.
