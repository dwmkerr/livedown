## Why

Users who prefer containerised workflows have no supported path to run Livedown without installing Node.js or npx locally. Providing a Docker image with a simple `docker run` volume-mount invocation lowers the barrier to entry and makes the tool accessible in locked-down or ephemeral environments.

## What Changes

- Add a `Dockerfile` that builds a minimal production image of the Livedown CLI.
- Publish the image to a container registry (e.g. Docker Hub or GitHub Container Registry) as part of CI/CD.
- Add a `docker-usage` section to the README documenting the `docker run` invocation with a volume mount so the container can read the local markdown file.
- No changes to the CLI behaviour, relay, or browser viewer — this is packaging and documentation only.

## Capabilities

### New Capabilities

- `docker-usage`: How to run Livedown via `docker run` with a bind-mount volume, covering the minimal command, the volume flag, and any required environment variables (e.g. relay host, edit key).

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- New `Dockerfile` at the project root.
- CI/CD workflow extended to build and push the Docker image on release.
- `README.md` gains a Docker usage section (no architectural changes).
- No runtime code changes; no new npm dependencies.
