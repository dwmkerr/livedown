## Context

The companion change `multi-arch-docker-image` introduces a `deploy-docker` job in `.github/workflows/deploy.yaml`. That job already runs a `docker buildx imagetools inspect` step that asserts both `linux/amd64` and `linux/arm64` are listed in the manifest. What it does **not** assert is whether the image's entrypoint actually works.

The image's entrypoint is `node /app/dist/cli.js`. Failure modes the manifest check misses:

- `dist/cli.js` accidentally excluded from the runtime stage's `COPY` (e.g., a `.dockerignore` regression).
- `node_modules` mis-pruned so a transitive `require` fails at startup.
- `WORKDIR` change that breaks the entrypoint's resolution of bundled assets.
- A `node:lts-alpine` minor bump that drops a glibc-compat shim the CLI imports indirectly.

None of these would fail `imagetools inspect` — the manifest is fine, both arches are present, the image is just broken at runtime. Issue #130's acceptance criterion `docker run --rm ghcr.io/dwmkerr/livedown:latest --help` exists precisely to catch this class of regression. Today that check is documented only as a manual post-release task (`multi-arch-docker-image/tasks.md` item 6.3). This change automates it.

## Goals / Non-Goals

**Goals:**

- Fail the release deploy if the published image's CLI entrypoint cannot print `--help`.
- Keep the smoke test cheap: one `docker run` against the just-pushed `:<version>` tag.
- Use the public GHCR pull path (no auth) so the test exercises what end users actually do.
- Verify the test runs in the same job as the publish, so a publish-without-verify state is structurally impossible.

**Non-Goals:**

- Verifying the arm64 entrypoint via QEMU. The Dockerfile bakes the same `dist/` and `node_modules` into both arches; the `--help` output is platform-agnostic. Emulating arm64 to print a usage string would add minutes per release for zero extra coverage. (If the threat model changes — e.g., we add a native binary — revisit.)
- Verifying full CLI functionality (sharing a file, opening a relay connection). `--help` is a startup-time smoke test, not an integration test. Integration testing the container belongs in a separate change.
- Verifying `:latest` separately from `:<version>`. They point at the same manifest digest by construction; testing one tests the other.
- Adding a pre-publish smoke test in `cicd.yaml`. The PR-time validation job builds with `push: false`, so there is no published image to pull. Loading the buildx output back into the daemon and running it locally is possible but complicates the composite action; out of scope for this change.

## Decisions

### 1. Smoke test runs in `deploy-docker`, after publish, before job success

The step is added at the end of the `deploy-docker` job, after the existing `imagetools inspect` step. Placing it in the same job means:

- The job's overall success/failure correctly reflects "image is published AND invokable".
- No new job → no extra runner spin-up cost, no new `needs:` edge, no new permissions block.
- If the smoke test fails, GHA still leaves the bad image published in GHCR. That's an accepted trade-off: rolling back a published tag is a manual `gh api -X DELETE` either way, and a failed release check is the signal we want to trigger the cleanup.

**Alternative:** a separate `verify-docker` job with `needs: [deploy-docker]`. Rejected — extra runner, longer wall time, no isolation benefit.

### 2. Pull explicitly with `--platform linux/amd64`

The runner is amd64. Without `--platform`, `docker run` would pull the host arch's image, which is what we want anyway. The explicit flag is for **future-proofing**: if we later move `deploy-docker` to a different runner type (e.g., a self-hosted arm64 box), the smoke step should still target amd64 unless someone deliberately changes it. Making the platform explicit also makes the log line self-documenting about what was tested.

### 3. Assertion on stdout substring, not exit code alone

`docker run … --help` exits 0 on success. Asserting `exit 0` is necessary but not sufficient — a broken entrypoint could `exec` something that prints nothing and exits 0 (e.g., a wrapper script with a typo). We grep the captured stdout for the substring `Usage:` (the `commander` library's standard usage-line marker, which `cli.ts` inherits).

If `commander`'s help output format changes upstream, the test fails noisily — that's a deliberate canary. Better to update one grep than to ship an image whose CLI is silently broken.

**Alternative:** assert exit 0 only. Rejected — too easy to false-pass.

**Alternative:** parse JSON output via `--help --json`. Rejected — `commander` doesn't support `--help --json`, and `cli.ts` doesn't bolt one on. Adding it just for this test is more change surface than the grep.

### 4. Tag selection: use `steps.meta.outputs.version`, not `latest`

The publish step already exposes the resolved version via `docker/metadata-action`'s `version` output (e.g., `1.2.3`). Pulling `:<version>` instead of `:latest` guarantees we test the exact manifest that was just pushed. `:latest` is a mutable tag — if two release deploys ran concurrently (a `gh workflow run` race), pulling `:latest` could test the wrong manifest. Pulling `:<version>` is race-free.

### 5. No retry / no backoff on the pull

GHCR is hit immediately after the push. There's a theoretical CDN-propagation window where the new tag isn't yet visible. In practice, GHCR is read-after-write consistent within a single registry session, and `imagetools inspect` already ran successfully against the same tag in the prior step — so if `imagetools inspect` saw it, `docker pull` will see it.

If this turns out to be flaky in production, the mitigation is a 5–10s sleep before the smoke step, not a retry loop. Retry loops mask intermittent failures we'd rather see.

## Risks / Trade-offs

- **`commander`'s `Usage:` string format changes in a future major version** → the grep starts failing on otherwise-healthy images. Mitigation: pin the substring to something stable (`Usage:` has been in `commander` since v2). If `commander` ever rewords it, we update the grep in the same PR that bumps `commander`.
- **The smoke test pulls a public image, but the package starts private on first publish** → first-ever release would fail the smoke step because the runner's anonymous pull is denied. Mitigation: the `multi-arch-docker-image` task list already includes the one-time "flip to public" step. Document the ordering: flip-to-public happens before the *second* release (the first release is the one that publishes the package; visibility can only be flipped after that).
   - Alternative mitigation: log in to GHCR for the pull too (the job already has `GITHUB_TOKEN`). Slightly heavier; only useful if we want to keep the package private long-term. Out of scope; revisit if/when private-package distribution becomes a goal.
- **Smoke step depends on shell parsing of `docker run` output** → quoting edge cases. Mitigation: write to a temp file (`docker run … > "$RUNNER_TEMP/help.txt"`) and grep the file, instead of piping inline. Avoids escaping pitfalls.
- **`--platform linux/amd64` ignored on an amd64 runner** → no-op on the current runner, which is fine. The flag's value is in the log line, not the runtime behaviour.

## Migration Plan

This change cannot land before `multi-arch-docker-image`. Ordering:

1. `multi-arch-docker-image` merges → composite action + `deploy-docker` job land on `main`.
2. The first release runs `deploy-docker`, publishes the image, flips the package to public (manual one-time, per the companion change's task 6.1).
3. This change merges → adds the smoke-test step to `deploy-docker`.
4. The next release exercises the smoke test end-to-end against a known-good (now-public) image.

Rollback: revert the PR. The added step is additive; removing it restores the prior behaviour. Already-published images are unaffected.

If this lands before `multi-arch-docker-image` for any reason, the workflow will fail to parse (`deploy-docker` job doesn't exist yet). The proposal's "depends on multi-arch-docker-image" note is load-bearing; the merge order matters.

## Open Questions

- **Should we also smoke-test that `share` produces a join URL?** Out of scope here. That requires a port mapping, a relay (or a mock), and either a timeout-driven kill or a `--dry-run` flag the CLI doesn't currently have. Open issue if we want it.
- **Should the smoke step also run on every push to `main` against a hypothetical `:main` tag?** Only if we start publishing a `:main` tag, which `multi-arch-docker-image`'s non-goals explicitly rejected. No change here.
