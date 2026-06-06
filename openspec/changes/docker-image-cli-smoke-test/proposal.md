## Why

Issue #130's acceptance criteria explicitly require that `docker run --rm ghcr.io/dwmkerr/livedown:latest --help` print CLI usage on the published image. The companion change `multi-arch-docker-image` (already in `openspec/changes/`) lands the manifest plumbing (PR-time validate, release-time publish, multi-arch tags) and a manifest-inspect step that confirms both arches are listed — but it does **not** actually pull the published image, invoke `node /app/dist/cli.js --help`, and assert the CLI is wired up correctly. That gap means a release can ship a manifest that looks right (both arches present) while the image's entrypoint is broken (e.g., a missing `dist/` file, a bad `WORKDIR`, a stale `node_modules`). The "manual one-time" tasks in `multi-arch-docker-image/tasks.md` (item 6.3) confirm this is a known gap — the smoke test exists, but only as a post-release human check.

This change closes the gap by making the CLI smoke test a job step in `deploy-docker`, so a broken entrypoint fails the release deploy instead of being discovered by the first user to `docker pull`.

## What Changes

- Extend the `deploy-docker` job (added by `multi-arch-docker-image`) with a post-publish CLI smoke test step that runs `docker run --rm --platform linux/amd64 ghcr.io/dwmkerr/livedown:<version> --help` and asserts the output contains a known CLI usage marker (e.g., the substring `Usage:` or the `share` subcommand name).
- The smoke test runs on `linux/amd64` only — emulating `arm64` via QEMU inside the runner solely to print `--help` would add minutes to every release for no extra coverage, since the same `dist/` and `node_modules` are baked into both arch images.
- Fail the `deploy-docker` job if either the `docker run` exits non-zero or the expected usage marker is absent from stdout. This converts the gap from "discovered by users" to "discovered by CI before the release notes go out".
- No changes to the Dockerfile, the CLI source, the composite action, or the validation job in `cicd.yaml` — the smoke test runs against an already-published image, so it has to live in `deploy.yaml` after the publish step.
- Remove the manual `tasks.md` item 6.3 from `multi-arch-docker-image` (or supersede it) since it's now automated. The companion change's archival should reflect this.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `docker-usage`: add a requirement that the release deploy pipeline SHALL verify the published image's CLI entrypoint is invokable (not just that the manifest is well-formed) before the deploy job is allowed to succeed.

## Impact

- `.github/workflows/deploy.yaml` — the `deploy-docker` job gains a post-publish smoke-test step. No new jobs, no new secrets, no new permissions (it pulls a public image from GHCR; no auth required once the package is public).
- `openspec/changes/multi-arch-docker-image/tasks.md` — task 6.3 ("on an arm64 host, run `docker run … --help`") is now obsolete for amd64 coverage; the spec wording acknowledges this change supersedes the manual step.
- `openspec/specs/docker-usage/spec.md` (via delta) — gains one new requirement and two scenarios covering the automated smoke test.
- No runtime code changes. No `Dockerfile` changes. No npm dependencies. No new GitHub Actions secrets.
- Depends on `multi-arch-docker-image` landing first (the `deploy-docker` job it introduces is the host for the new step). This change does NOT make sense as a standalone — it amends an artifact that doesn't exist on `main` yet.
