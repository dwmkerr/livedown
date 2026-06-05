## Why

The current Docker image targets only `linux/amd64`, leaving Apple Silicon and other ARM users to build locally — the README literally tells them to. The image also has no CI coverage: there is no Docker job in `cicd.yaml` (so a broken `Dockerfile` lands on `main` undetected) and no Docker job in `deploy.yaml` (so the "image is published on each release" spec requirement is, in practice, manual). Issue #130 asks us to fix both gaps: validate the image on every PR, publish `linux/amd64` + `linux/arm64` to GHCR on release.

## What Changes

- Add a `docker` job to `.github/workflows/cicd.yaml` that runs on PRs and pushes to `main`, building the image multi-arch with `push: false` and GHA-cached layers. This validates the `Dockerfile` without publishing.
- Add a `deploy-docker` job to `.github/workflows/deploy.yaml`, parallel to `deploy-npm` and `deploy-partykit`, that logs in to GHCR with `GITHUB_TOKEN`, builds `linux/amd64` + `linux/arm64`, and pushes `ghcr.io/dwmkerr/livedown:<version>` plus `:latest`.
- Both new jobs use `docker/setup-buildx-action@v3` and `docker/build-push-action@v6` with `cache-from: type=gha` / `cache-to: type=gha,mode=max`.
- Update the README Docker section: remove the "ARM users build locally" caveat and note that the published image covers `linux/amd64` and `linux/arm64`.
- No changes to the `Dockerfile` itself, the CLI, the relay, or the browser viewer — packaging, CI plumbing, and documentation only.

## Capabilities

### New Capabilities

<!-- None. This change extends an existing capability. -->

### Modified Capabilities

- `docker-usage`: the published image must cover `linux/amd64` and `linux/arm64` (currently amd64 only); the image build must be validated on every PR (currently only built on release, in spec — not at all, in practice); the README's platform caveat is replaced with a multi-arch coverage note.

## Impact

- `.github/workflows/cicd.yaml` — gains a `docker` validation job (PR + push to main, no push to registry).
- `.github/workflows/deploy.yaml` — gains a `deploy-docker` job that publishes multi-arch tags to GHCR on release.
- `README.md` — Docker section updated to drop the amd64-only caveat.
- `CLAUDE.md` "GitHub workflows and actions" rules: the buildx-setup + build-push step sequence is duplicated across the new `cicd` validation job and the `deploy-docker` job, so it MUST be extracted into a composite action under `.github/actions/docker-build/` and called via `uses:` from both workflows. Inline duplication across two jobs is explicitly disallowed.
- New GHCR package permission: `deploy-docker` needs `packages: write` on the job's `GITHUB_TOKEN` (set at the job-level `permissions:` block, not workflow-wide).
- No runtime code changes. No new npm dependencies. No `Dockerfile` changes.
