## Context

A `Dockerfile` already exists at the repo root (multi-stage, `node:lts-alpine` builder + runtime, `ENTRYPOINT ["node", "dist/cli.js"]`, `/data` as the mount convention). The `docker-usage` spec already exists at `openspec/specs/docker-usage/spec.md`. What is missing is the CI/CD plumbing the spec implies:

- `cicd.yaml` has no Docker validation step — a broken `Dockerfile` (e.g., a build that no longer succeeds on `arm64`) would only be caught when someone manually runs `docker build` or when a release goes out and fails.
- `deploy.yaml` has no Docker publish step. The current spec requirement "the project SHALL publish an official Docker image to GitHub Container Registry on each versioned release" is unenforced; no published image exists.
- The README documents `ghcr.io/dwmkerr/livedown:latest` and tells ARM users they have to build locally — both of which become wrong the moment we add multi-arch publish.

The split-workflow model (`cicd.yaml` internal, `deploy.yaml` external) and the "duplication is a bug, extract a composite action first" rule from `CLAUDE.md` constrain how this lands.

## Goals / Non-Goals

**Goals:**

- Catch a broken `Dockerfile` at PR time on the same architectures we publish (multi-arch buildx, no push).
- Publish `linux/amd64` + `linux/arm64` images to GHCR on every release, tagged `<version>` and `latest`.
- Share the buildx setup + build step between the validate and publish jobs via a composite action, so adding a third arch later (or changing the cache strategy) is a one-file change.
- Keep both jobs fast enough that GHA cache hits dominate cold builds.

**Non-Goals:**

- Changing the `Dockerfile`. The existing multi-stage Alpine image is fine for both arches; arm64 has first-class `node:lts-alpine` support.
- Publishing image flavors (no `-slim`, no `-debug`, no per-arch tags). One manifest list per release, two arches inside it.
- Signing the image (cosign / sigstore). Out of scope for this issue; revisit if the threat model changes.
- Docker Hub mirror. GHCR-only, matching the existing spec.
- Per-commit / `main`-branch tags (`:main`, `:sha-<...>`). Adds publish traffic and registry clutter for no clear consumer.

## Decisions

### 1. Composite action `.github/actions/docker-build/action.yml`

Both the validate job (in `cicd.yaml`) and the publish job (in `deploy.yaml`) need to:

1. `actions/checkout@v5`
2. `docker/setup-qemu-action@v3` (required for cross-arch builds on the amd64 runner)
3. `docker/setup-buildx-action@v3`
4. `docker/build-push-action@v6` with `platforms: linux/amd64,linux/arm64`, `cache-from: type=gha`, `cache-to: type=gha,mode=max`

That's four near-identical steps in two jobs. `CLAUDE.md` rule #1 ("Duplicative content is a bug … extract **before** the second copy is written") makes a composite action mandatory, not optional.

The composite takes inputs:

- `push` (boolean string, default `'false'`) — passed straight to `build-push-action`.
- `tags` (newline- or comma-separated, optional) — only meaningful when `push: 'true'`.
- `registry-username` / `registry-password` (optional) — when set, the action runs `docker/login-action@v3` against `ghcr.io` first; the validate job leaves them empty.

Rationale for keeping login inside the composite: a publish-time login step that lives in the workflow but uses inputs from the composite splits the auth concern across two files. Cleaner to gate login on whether credentials were passed in.

**Alternatives considered**:

- *Inline in both workflows*: violates the explicit rule. Rejected.
- *Shell script under `.github/workflows/scripts/`*: rejected per `CLAUDE.md` rule #2 ("Prefer composite actions over shell scripts").
- *Reusable workflow (`workflow_call`)*: heavier than needed; reusable workflows are right when you need separate runners or matrices. Here we want four steps inlined into an existing job.

### 2. Validate-job placement: separate `docker` job in `cicd.yaml`, not folded into `validate`

The existing `validate` job runs a Node matrix (22.x, 24.x) and uploads coverage. The Docker build is independent of the Node version matrix — running it twice wastes ~3–5 minutes per PR. A sibling job parallelises with `validate` and fails the PR check independently, which is also easier to read in the GitHub UI.

The new job does **not** gate `release`. `release` already depends on `validate`; if we want Docker to gate release as well, that's a one-line `needs: [validate, docker]` change, but tying release-please to a Docker build introduces a failure mode where a flaky buildx cache blocks a release. Decided: keep `release` gated on `validate` only. PR-time Docker breakage is still a red check, which is what we actually need.

### 3. Publish-job placement: new `deploy-docker` job in `deploy.yaml`, parallel to existing two

The deploy workflow already runs npm and partykit in parallel with independent timeouts and preflights. Docker fits the same pattern. Independent failure modes — a broken GHCR token shouldn't block npm publish, and vice versa.

`deploy-docker` gets:

- `permissions: { contents: read, packages: write }` at the job level. Workflow-level permissions stay minimal; only this job needs `packages: write`.
- `timeout-minutes: 15` — multi-arch builds with cold cache are slower than amd64-only. 15 minutes is generous; cached builds finish in 2–3.
- Preflight: a step that runs `echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin` and exits non-zero if the login fails, mirroring the `npm whoami` / `partykit whoami` pattern. Actually — `docker/login-action@v3` already errors clearly on bad credentials, so the explicit preflight is redundant. Skip it; rely on the action.

### 4. Tag derivation

The deploy workflow is triggered with `inputs.ref` set to a tag like `v1.2.3` (from `cicd.yaml`'s dispatch step) or via manual `gh workflow run`. We need the publish tag to be `1.2.3` (no leading `v`) plus `latest`.

Use `docker/metadata-action@v5`:

```yaml
- uses: docker/metadata-action@v5
  with:
    images: ghcr.io/dwmkerr/livedown
    tags: |
      type=semver,pattern={{version}},value=${{ inputs.ref }}
      type=raw,value=latest
```

`type=semver,pattern={{version}}` strips the leading `v` and produces `1.2.3`. The composite action takes the resulting `tags` and `labels` and forwards them to `build-push-action`.

**Alternative**: hand-roll `${REF#v}` in a shell step. Rejected — metadata-action also produces OCI labels (`org.opencontainers.image.source`, etc.) we'd otherwise have to hand-author.

### 5. GHA cache, scoped by ref

`cache-from: type=gha` and `cache-to: type=gha,mode=max` use the GitHub Actions cache, scoped by `ref` (branch/tag) by default. The validate job (running on a PR branch) and the deploy job (running on a tag) won't share cache by default — that's fine, because the PR-time cache warms branch-scoped storage, and `main` pushes warm the `main`-scoped cache that release builds inherit via the fallback chain GHA already implements.

If the cache miss rate on releases turns out to be high, we can pin `scope: main-docker` later. Not worth pre-optimising.

### 6. README updates

Replace the blockquote:

> **Platform note:** The published image targets `linux/amd64`. ARM users (Apple Silicon, Raspberry Pi) should build locally: `docker build -t livedown-local .`

with:

> **Platforms:** Published images cover `linux/amd64` and `linux/arm64`. Docker selects the right arch automatically; Apple Silicon and Raspberry Pi pull `arm64` natively.

This is the only README diff. Keep the `docker run` examples as-is — they don't change.

## Risks / Trade-offs

- **arm64 emulation is slow on amd64 runners** → first cold build can take 10+ minutes. Mitigation: GHA cache + `cache-to: type=gha,mode=max`. Acceptable for a release-time job; if it bites in practice we can move to a self-hosted arm64 runner.
- **GHCR token rotation surprises** → unlike `NPM_TOKEN` / `PARTYKIT_TOKEN`, GHCR uses the auto-issued `GITHUB_TOKEN`, so there's nothing to rotate. The risk is the opposite: a workflow that forgets `packages: write` and publishes nothing on release. Mitigation: smoke-test step at the end of `deploy-docker` that pulls the manifest and asserts both arches are listed (`docker buildx imagetools inspect ghcr.io/dwmkerr/livedown:<version>`). Cheap, catches the "publish succeeded but only one arch landed" failure mode.
- **Manifest-list visibility on GHCR** → the package starts private by default. First-time publish needs a manual visibility flip to "Public" in the GHCR UI. Document this in `tasks.md` as a one-time step.
- **`metadata-action` semver parsing on non-tag dispatches** → if someone runs `gh workflow run deploy.yaml --ref main`, `value=main` is not a valid semver and `type=semver` emits nothing. The job would then only push `:latest`. Acceptable — manual deploys of `main` shouldn't be claiming a release version anyway — but worth a comment in the workflow.
- **Composite action lives in this repo, not a separate published action** → if another repo wants the same pattern later they have to copy or vendor it. Acceptable; matches how `CLAUDE.md` says to extract.

## Migration Plan

1. Land the composite action + the two job additions + README update behind a single PR.
2. PR CI exercises the validation job end-to-end (it pushes nothing; failure surfaces as a red check).
3. After merge, the first `main` push runs the same validation job again (still no publish).
4. The next release (release-please tag) triggers `deploy.yaml`, which runs `deploy-docker` for real. The smoke-test step (item under Risks) is what tells us multi-arch actually published.
5. Manual one-time: flip the GHCR package to public visibility.

Rollback: revert the PR. The composite action and both jobs are additive — no existing workflow paths change. A revert restores the prior (broken-but-unused) behaviour exactly.

## Open Questions

- None blocking. The "should release gate on Docker validation?" question (decision 2) is answered no for this change; revisit if a future broken Dockerfile actually slips through to a release.
