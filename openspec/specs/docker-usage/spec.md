# docker-usage Specification

## Purpose

Describes how Livedown is packaged as a Docker image, published, and used.
## Requirements
### Requirement: Docker image is available
The project SHALL publish an official Docker image to GitHub Container Registry (`ghcr.io/dwmkerr/livedown`) on each versioned release, tagged with the release version and `latest`.

#### Scenario: Image is present after release
- **WHEN** a new version tag is pushed to the repository
- **THEN** a corresponding Docker image tag SHALL be published to GHCR within the CI/CD pipeline

### Requirement: CLI runs via docker run with a volume mount
The Docker image SHALL allow users to share a local markdown file by bind-mounting a local directory to `/data` inside the container and passing the file path as a CLI argument, with no Node.js installation required on the host.

#### Scenario: Sharing a local file
- **WHEN** a user runs `docker run --rm -v "$(pwd):/data" ghcr.io/dwmkerr/livedown share /data/notes.md`
- **THEN** the container SHALL start the livedown watcher, output a shareable URL, and stream live updates as the file changes on the host

#### Scenario: Passing CLI options
- **WHEN** a user appends supported CLI flags (e.g. `--editor`, `--relay`, `--edit-key`) to the docker run command
- **THEN** those flags SHALL be passed through to the livedown CLI unchanged and produce the same effect as running the CLI directly

### Requirement: Docker usage is documented in the README
The README SHALL include a Docker usage section explaining how to run Livedown with `docker run`, including the volume mount flag and an example command.

#### Scenario: User reads the README
- **WHEN** a user opens the README seeking a Docker-based workflow
- **THEN** they SHALL find a self-contained example `docker run` command with a volume mount that they can copy and run without reading any other documentation

#### Scenario: Platform limitation is disclosed
- **WHEN** the Docker usage section is read
- **THEN** it SHALL note that the published image targets `linux/amd64` and that ARM users may need to build the image locally

### Requirement: Published image CLI entrypoint is verified on every release
The release deploy pipeline SHALL pull the just-published image by its resolved version tag (e.g. `ghcr.io/dwmkerr/livedown:<version>`) and invoke its CLI entrypoint with `--help` as the final step of the publish job. The job SHALL fail if the `docker run` invocation exits non-zero or if the captured standard output does not contain the substring `Usage:`. The release SHALL NOT be reported as successful unless this verification passes.

#### Scenario: Published image is invokable
- **WHEN** the release deploy publishes a new image to `ghcr.io/dwmkerr/livedown:<version>` and the post-publish smoke step runs `docker run --rm --platform linux/amd64 ghcr.io/dwmkerr/livedown:<version> --help`
- **THEN** the invocation SHALL exit `0`, the captured standard output SHALL contain the substring `Usage:`, and the deploy job SHALL be reported as successful

#### Scenario: Published image is broken at runtime
- **WHEN** the release deploy publishes an image whose entrypoint cannot print CLI usage (for example, `dist/cli.js` is missing, a required dependency is mis-pruned, or the entrypoint exits non-zero)
- **THEN** the smoke step SHALL fail, the `deploy-docker` job SHALL be marked failed, and the release SHALL surface the failure as a red check before the image is treated as a successful release

#### Scenario: Smoke step targets the resolved version tag, not :latest
- **WHEN** the smoke step decides which image reference to pull
- **THEN** it SHALL use the version tag resolved by the metadata step (e.g. `:<version>`) and SHALL NOT pull `:latest`, so that a concurrent release cannot cause the smoke check to verify a different manifest than the one just published

### Requirement: Docker smoke logic lives in a composite action
The shell logic that runs `docker run … --help` and asserts the usage marker SHALL be implemented as a composite action under `.github/actions/docker-smoke-test/action.yml`. The `deploy-docker` job SHALL invoke this action via `uses:` rather than inlining the `docker run`, `grep`, and diagnostic-dump shell into the workflow file. Inline duplication of this logic in any workflow SHALL NOT exist.

#### Scenario: A workflow inlines the smoke shell instead of using the composite action
- **WHEN** a contributor proposes changes that inline `docker run … --help` and `grep` directly in a workflow `run:` block instead of calling `./.github/actions/docker-smoke-test`
- **THEN** the change SHALL be rejected as duplicative per the repository's GitHub workflows rules (CLAUDE.md rule #1)

#### Scenario: The composite action is callable with image + version inputs
- **WHEN** the `deploy-docker` job calls `uses: ./.github/actions/docker-smoke-test` with `image: ghcr.io/dwmkerr/livedown` and `version: ${{ steps.meta.outputs.version }}`
- **THEN** the action SHALL run the smoke step against `ghcr.io/dwmkerr/livedown:<version>` on `linux/amd64`, fail with a clear diagnostic (dumping the captured `--help` output to the job log) if the usage marker is missing, and succeed silently otherwise

