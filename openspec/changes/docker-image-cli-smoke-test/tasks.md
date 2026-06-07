## 1. Pre-requisites

- [ ] 1.1 Confirm `multi-arch-docker-image` has landed on `main` (composite action + `deploy-docker` job present in `.github/workflows/deploy.yaml`). If not, block this change until that one merges.
- [ ] 1.2 Confirm the first release after `multi-arch-docker-image` has succeeded and the `ghcr.io/dwmkerr/livedown` package visibility has been flipped to public. The smoke step uses an anonymous pull; a private package would 401.

## 2. Add post-publish smoke step to `deploy-docker`

- [ ] 2.1 In `.github/workflows/deploy.yaml`, in the `deploy-docker` job, add a new step **after** the existing `docker buildx imagetools inspect` step and **before** the job ends. Name it `Smoke-test CLI from published image`.
- [ ] 2.2 The step SHALL run `docker run --rm --platform linux/amd64 "ghcr.io/dwmkerr/livedown:${{ steps.meta.outputs.version }}" --help` and redirect stdout to `"$RUNNER_TEMP/cli-help.txt"` (avoid inline pipe-grep quoting issues per design decision §3 / Risks).
- [ ] 2.3 After the `docker run`, add a `grep -q '^Usage:' "$RUNNER_TEMP/cli-help.txt"` (or equivalent fixed-string check) and exit non-zero with a clear diagnostic if the marker is missing. Print the captured `--help` output to the job log on failure to make debugging cheap.
- [ ] 2.4 Confirm the step does NOT add new permissions or secrets. It pulls a public image; the existing `permissions: { contents: read, packages: write }` block is unchanged.
- [ ] 2.5 Do not add the smoke step to the PR-time `cicd.yaml` `docker` job (per design Non-Goals — no published image to pull at PR time).

## 3. Supersede the manual smoke check

- [ ] 3.1 Once this change lands, mark task 6.3 in `openspec/changes/multi-arch-docker-image/tasks.md` as superseded (or delete it during that change's archival). The amd64 smoke is now automated. The arm64-native manual check remains useful for a one-time post-public-flip sanity pass but is no longer a recurring per-release task.
- [ ] 3.2 If `multi-arch-docker-image` has already archived before this change merges, note the supersession in `openspec/changes/docker-image-cli-smoke-test/proposal.md`'s Impact section and skip step 3.1.

## 4. Verify locally before opening PR

- [ ] 4.1 Run `npm run lint && npm run build && npm test` per CLAUDE.md. All three MUST pass.
- [ ] 4.2 Run `npx openspec validate docker-image-cli-smoke-test --strict` and confirm clean.
- [ ] 4.3 (Optional but recommended) Simulate the smoke step locally against an already-published tag: `docker run --rm --platform linux/amd64 ghcr.io/dwmkerr/livedown:<latest-released-version> --help | head -1` — confirm it starts with `Usage:`. This validates the grep pattern against a real image before CI sees it.

## 5. Post-merge verification

- [ ] 5.1 On the first release after this change merges, confirm the `deploy-docker` job log shows the smoke step ran and passed, with the `Usage:` line visible in the captured output.
- [ ] 5.2 If the smoke step fails on a release, the rollback is: revert this PR (the step is additive) OR manually delete the bad image tag via `gh api -X DELETE` and cut a patch release with the fix. Document whichever path was taken in the release notes for that version.
