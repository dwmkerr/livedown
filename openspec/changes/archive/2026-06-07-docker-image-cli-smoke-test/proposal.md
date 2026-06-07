## Why

Issue #130's acceptance criteria explicitly require that `docker run --rm ghcr.io/dwmkerr/livedown:latest --help` print CLI usage on the published image. The companion change `multi-arch-docker-image` (already in `openspec/changes/`) lands the manifest plumbing (PR-time validate, release-time publish, multi-arch tags) and a manifest-inspect step that confirms both arches are listed — but it does **not** actually pull the published image, invoke `node /app/dist/cli.js --help`, and assert the CLI is wired up correctly. That gap means a release can ship a manifest that looks right (both arches present) while the image's entrypoint is broken (e.g., a missing `dist/` file, a bad `WORKDIR`, a stale `node_modules`). The "manual one-time" tasks in `multi-arch-docker-image/tasks.md` (item 6.3) confirm this is a known gap — the smoke test exists, but only as a post-release human check.

This change closes the gap by making the CLI smoke test a job step in `deploy-docker`, so a broken entrypoint fails the release deploy instead of being discovered by the first user to `docker pull`.

## What Changes

- Ship a new composite action `.github/actions/docker-smoke-test/action.yml` that encapsulates the smoke logic: `docker run --rm --platform linux/amd64 <image>:<version> --help`, capture stdout, and assert the substring `Usage:` is present. Takes `image`, `version`, optional `platform`, and optional `usage-marker` inputs.
- Extend the `deploy-docker` job (added by `multi-arch-docker-image`) so its final step calls `uses: ./.github/actions/docker-smoke-test` after the existing `docker buildx imagetools inspect` step. The wire-up itself lives in `multi-arch-docker-image`'s task list (since the host job is created there), but the composite action ships in this change so the smoke logic is reviewable and unit-testable on its own merits.
- The smoke test runs on `linux/amd64` only — emulating `arm64` via QEMU inside the runner solely to print `--help` would add minutes to every release for no extra coverage, since the same `dist/` and `node_modules` are baked into both arch images.
- Fail the `deploy-docker` job if either the `docker run` exits non-zero or the expected usage marker is absent from stdout. This converts the gap from "discovered by users" to "discovered by CI before the release notes go out".
- No changes to the Dockerfile, the CLI source, or the validation job in `cicd.yaml` — the smoke test runs against an already-published image, so it has to live in `deploy.yaml` after the publish step.
- Remove the manual `tasks.md` item 6.3 from `multi-arch-docker-image` (or supersede it) since it's now automated. The companion change's archival should reflect this.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `docker-usage`: add a requirement that the release deploy pipeline SHALL verify the published image's CLI entrypoint is invokable (not just that the manifest is well-formed) before the deploy job is allowed to succeed.

## Impact

- `.github/actions/docker-smoke-test/action.yml` — new composite action holding the smoke logic. Self-contained: takes `image` + `version` inputs, exits non-zero with diagnostic output if `--help` fails or the usage marker is missing.
- `.github/workflows/deploy.yaml` — the `deploy-docker` job (created by `multi-arch-docker-image`) gains a final `uses: ./.github/actions/docker-smoke-test` step. No new jobs, no new secrets, no new permissions (it pulls a public image from GHCR; no auth required once the package is public). **The actual edit to `deploy.yaml` is made by `multi-arch-docker-image`'s task list, not by this change, because the host job does not exist on `main` yet** — see `multi-arch-docker-image/tasks.md` step 3.5b (added by this change) for the wire-up.
- `openspec/changes/multi-arch-docker-image/tasks.md` — task 6.3 ("on an arm64 host, run `docker run … --help`") is now obsolete for amd64 coverage; the spec wording acknowledges this change supersedes the manual step. A new step 3.5b is added to call the composite action.
- `openspec/specs/docker-usage/spec.md` (via delta) — gains one new requirement and three scenarios covering the automated smoke test.
- No runtime code changes. No `Dockerfile` changes. No npm dependencies. No new GitHub Actions secrets.
- Depends on `multi-arch-docker-image` landing first (the `deploy-docker` job it introduces is the host for the new step). This change does NOT fully take effect as a standalone — the composite action ships here, but it only runs once the consuming job exists. Merge order: `multi-arch-docker-image` first (creates `deploy-docker` with the `uses:` call), then this change (ships the composite action). If this change merges first, the `multi-arch-docker-image` PR resolves the trivial coordination at merge time.
