## ADDED Requirements

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
