## MODIFIED Requirements

### Requirement: Docker image is available
The project SHALL publish an official Docker image to GitHub Container Registry (`ghcr.io/dwmkerr/livedown`) on each versioned release as a multi-architecture manifest list covering `linux/amd64` and `linux/arm64`, tagged with the release version and `latest`.

#### Scenario: Image is present after release
- **WHEN** a new version tag is pushed to the repository and the release deploy workflow runs to completion
- **THEN** a corresponding Docker image tag SHALL be published to GHCR at `ghcr.io/dwmkerr/livedown:<version>` and the `:latest` tag SHALL be updated to point at the same manifest

#### Scenario: Image manifest covers amd64 and arm64
- **WHEN** the published manifest for `ghcr.io/dwmkerr/livedown:<version>` is inspected (e.g. `docker buildx imagetools inspect`)
- **THEN** it SHALL list both `linux/amd64` and `linux/arm64` platform entries

#### Scenario: ARM users pull natively
- **WHEN** a user on `linux/arm64` (e.g. Apple Silicon, Raspberry Pi) runs `docker pull ghcr.io/dwmkerr/livedown:latest`
- **THEN** Docker SHALL select the `linux/arm64` image automatically without emulation and without requiring a local build

### Requirement: Docker usage is documented in the README
The README SHALL include a Docker usage section explaining how to run Livedown with `docker run`, including the volume mount flag, an example command, and a statement of the platforms covered by the published image.

#### Scenario: User reads the README
- **WHEN** a user opens the README seeking a Docker-based workflow
- **THEN** they SHALL find a self-contained example `docker run` command with a volume mount that they can copy and run without reading any other documentation

#### Scenario: Multi-arch coverage is disclosed
- **WHEN** the Docker usage section is read
- **THEN** it SHALL state that the published image covers `linux/amd64` and `linux/arm64` and SHALL NOT instruct ARM users to build the image locally

## ADDED Requirements

### Requirement: Docker image build is validated on every PR
The CI workflow SHALL build the Docker image multi-architecture (`linux/amd64` and `linux/arm64`) on every pull request and on every push to the default branch, without pushing to any registry. A failed Docker build SHALL fail the PR check.

#### Scenario: PR with a broken Dockerfile
- **WHEN** a pull request introduces a change that breaks the Docker build (for either supported architecture)
- **THEN** the Docker validation job in CI SHALL fail and the PR SHALL show a failing required check

#### Scenario: PR with a working Dockerfile
- **WHEN** a pull request leaves the Docker build functional on both supported architectures
- **THEN** the Docker validation job SHALL succeed and SHALL NOT push any image to a registry

### Requirement: Docker build pipeline shares a single composite action
The repository SHALL define one composite action under `.github/actions/` that encapsulates the Docker buildx setup and build step, and BOTH the PR-time validation job and the release-time publish job SHALL invoke this action via `uses:`. Inline duplication of buildx setup, login, or build steps across the two workflows SHALL NOT exist.

#### Scenario: A second copy of the build steps is introduced
- **WHEN** a contributor proposes changes that inline the buildx setup or build-push steps in a workflow instead of calling the composite action
- **THEN** the change SHALL be rejected as duplicative per the repository's GitHub workflows rules

#### Scenario: Build configuration changes are made in one place
- **WHEN** the supported platform list, cache strategy, or buildx version needs to change
- **THEN** the change SHALL be applied in the composite action and both jobs SHALL pick it up without further modification
