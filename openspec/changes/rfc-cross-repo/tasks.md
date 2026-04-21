## 1. Workflow env var and plan prompt

- [ ] 1.1 Add `OPENSPEC_CROSS_REPO_REPOS: ""` to the top-level `env:` block in `.github/workflows/openspec-flow.yaml`
- [ ] 1.2 Extend the plan job agent prompt with cross-repo instructions, gated behind a check that `OPENSPEC_CROSS_REPO_REPOS` is non-empty. Instructions must cover: allowed repos list, `gh issue list` duplicate-check before creation, writing results to `/tmp/cross-repo-issues.json`, and intra-repo issue creation guidance.

## 2. Manifest-read and safeguard-comment step

- [ ] 2.1 Add a post-agent step to the plan job that reads `/tmp/cross-repo-issues.json` (skip if absent or empty)
- [ ] 2.2 In that step, validate each `repo` field against `OPENSPEC_CROSS_REPO_REPOS`; exit non-zero if any non-allowlisted repo is found
- [ ] 2.3 In that step, post a safeguard comment on the originating issue when the manifest is non-empty, containing the `AGENT_COMMENT_MARKER`, a warning banner, and a bulleted list of created issue URLs with titles and a note for pre-existing issues

## 3. Spec updates

- [ ] 3.1 Add the new `cross-repo-issue-creation` capability spec to `openspec/specs/cross-repo-issue-creation/spec.md` (copy from the change's `specs/cross-repo-issue-creation/spec.md`)
- [ ] 3.2 Merge the `openspec-flow` delta spec into `openspec/specs/openspec-flow/spec.md` (add the two new requirements from the change's `specs/openspec-flow/spec.md`)

## 4. Documentation

- [ ] 4.1 Update `CLAUDE.md` Secrets section: document that `AGENT_GITHUB_TOKEN` must have `issues: write` on any repo listed in `OPENSPEC_CROSS_REPO_REPOS`
- [ ] 4.2 Update `CLAUDE.md` with a note explaining `OPENSPEC_CROSS_REPO_REPOS` (what it does, how to set it, security implications)
- [ ] 4.3 Add a comment header above the `OPENSPEC_CROSS_REPO_REPOS` env var in the workflow file explaining the allowlist format and the off-by-default contract

## 5. Verification

- [ ] 5.1 Verify the plan job runs with `OPENSPEC_CROSS_REPO_REPOS: ""` and the manifest-read step is a no-op (no new behavior)
- [ ] 5.2 Verify that a manifest with a non-allowlisted repo triggers the failure path (unit-testable as a shell script check)
- [ ] 5.3 Verify the safeguard comment is posted and pruned correctly on a re-run (marker-based prune-and-replace works for safeguard comments)
