## 1. Composite action

- [ ] 1.1 Create `.github/actions/docker-build/action.yml` with `name`, `description`, and `inputs` for `push` (default `'false'`), `tags` (optional), `labels` (optional), `registry-username` (optional), and `registry-password` (optional).
- [ ] 1.2 Add composite steps in order: `docker/setup-qemu-action@v3`, `docker/setup-buildx-action@v3`, conditional `docker/login-action@v3` (only when `registry-password` input is non-empty, targeting `ghcr.io`), then `docker/build-push-action@v6` with `context: .`, `platforms: linux/amd64,linux/arm64`, `push: ${{ inputs.push }}`, `tags: ${{ inputs.tags }}`, `labels: ${{ inputs.labels }}`, `cache-from: type=gha`, `cache-to: type=gha,mode=max`.
- [ ] 1.3 Verify the `action.yml` parses cleanly (e.g. `yq . .github/actions/docker-build/action.yml` or local `act` dry-run).

## 2. PR-time validation job in `cicd.yaml`

- [ ] 2.1 Add a `docker` job to `.github/workflows/cicd.yaml`, sibling to `validate` (no `needs:`), running on `ubuntu-latest`.
- [ ] 2.2 Steps: `actions/checkout@v5` then `uses: ./.github/actions/docker-build` with no inputs (defaults to `push: 'false'`, no login).
- [ ] 2.3 Confirm the new job appears as a required check name consistent with branch-protection conventions (do not change branch protection — just verify the name is sensible).
- [ ] 2.4 Confirm `release` job's `needs: [validate]` is NOT changed to include `docker` (per design decision 2).

## 3. Release-time publish job in `deploy.yaml`

- [ ] 3.1 Add a `deploy-docker` job to `.github/workflows/deploy.yaml`, parallel to `deploy-npm` and `deploy-partykit`, with `runs-on: ubuntu-latest`, `timeout-minutes: 15`, and job-level `permissions: { contents: read, packages: write }`.
- [ ] 3.2 First step: `actions/checkout@v5` with `ref: ${{ inputs.ref || github.ref }}` (mirroring existing jobs).
- [ ] 3.3 Add `docker/metadata-action@v5` step with `images: ghcr.io/dwmkerr/livedown` and tag rules `type=semver,pattern={{version}},value=${{ inputs.ref || github.ref_name }}` plus `type=raw,value=latest`. Capture its `tags` and `labels` outputs.
- [ ] 3.4 Call `uses: ./.github/actions/docker-build` with `push: 'true'`, `tags: ${{ steps.meta.outputs.tags }}`, `labels: ${{ steps.meta.outputs.labels }}`, `registry-username: ${{ github.actor }}`, `registry-password: ${{ secrets.GITHUB_TOKEN }}`.
- [ ] 3.5 Add a final smoke-test step: `docker buildx imagetools inspect "ghcr.io/dwmkerr/livedown:${{ steps.meta.outputs.version }}"` and grep for both `linux/amd64` and `linux/arm64` in the output; fail the job if either is missing.
- [ ] 3.5b After the `imagetools inspect` step, add a `uses: ./.github/actions/docker-smoke-test` step that passes `image: ghcr.io/dwmkerr/livedown` and `version: ${{ steps.meta.outputs.version }}`. This wires in the CLI smoke action shipped by the `docker-image-cli-smoke-test` change so the release fails fast if the published image's entrypoint cannot print `--help`. The composite action MUST be the final step of the job so the job's success reflects "image is published AND invokable".
- [ ] 3.6 Add an inline comment near the metadata step warning that manual dispatch with a non-tag `ref` will produce only the `:latest` tag (semver pattern matches nothing).

## 4. README

- [ ] 4.1 In `README.md`, replace the "**Platform note:** The published image targets `linux/amd64`..." blockquote with a "**Platforms:**" note stating that published images cover `linux/amd64` and `linux/arm64` and Docker selects the right arch automatically.
- [ ] 4.2 Leave the `docker run` example commands unchanged.
- [ ] 4.3 Sanity-check that the section still flows after the edit (no orphan sentences, no dangling "build locally" guidance).

## 5. Lint / build / test

- [ ] 5.1 Run `npm run lint && npm run build && npm test` (mandatory before opening the PR per `CLAUDE.md`). Confirm all three pass.
- [ ] 5.2 Run `openspec validate multi-arch-docker-image --strict` and confirm clean.

## 6. Manual one-time follow-up (post-merge, post-release)

- [ ] 6.1 After the first successful `deploy-docker` run, flip the `ghcr.io/dwmkerr/livedown` package visibility to "Public" in the GHCR UI (one-time setting; subsequent releases inherit it).
- [ ] 6.2 Verify the published manifest from a clean machine: `docker buildx imagetools inspect ghcr.io/dwmkerr/livedown:latest` lists both arches.
- [ ] 6.3 ~~Verify the smoke run: on an arm64 host, `docker run --rm ghcr.io/dwmkerr/livedown:latest --help` prints CLI usage with no emulation warning.~~ **Superseded by `docker-image-cli-smoke-test`**, which automates the amd64 `--help` check inside `deploy-docker` via the `./.github/actions/docker-smoke-test` composite action. The arm64-native variant remains useful as a one-time post-public-flip sanity pass but is no longer a recurring per-release manual task.
