## Context

Livedown is currently distributed solely via npm (`npx @dwmkerr/livedown`). Users who run containerised development environments, CI runners without Node.js, or security-locked machines cannot use the tool today. The request (issue #2) is specifically for a `docker run` workflow with a volume mount so the container can read a local markdown file.

The project already has a CI/CD pipeline (`.github/workflows/cicd.yaml`) and a Node.js CLI entry point (`src/cli.ts`). There are no external services to containerise — the relay runs on PartyKit/Cloudflare, so the image only needs to ship the CLI.

## Goals / Non-Goals

**Goals:**
- Provide a `Dockerfile` that produces a minimal, working image of the Livedown CLI.
- Document the `docker run -v` invocation in the README so users can share a local file without installing Node.js.
- Integrate image build/push into CI/CD so the image stays current with each release.

**Non-Goals:**
- Docker Compose or multi-container setups.
- A separate relay image — the relay stays on PartyKit/Cloudflare.
- Changing any CLI behaviour, signing logic, or relay protocol.

## Decisions

### Base image: `node:lts-alpine`

Alpine gives the smallest practical image (~50 MB) while keeping a standard Node.js runtime. The alternative (`node:lts-slim` / Debian) is larger with no benefit for a CLI-only image.

### Build strategy: multi-stage build

Stage 1 (`builder`): install all dependencies and compile TypeScript.
Stage 2 (`runtime`): copy only the compiled output and production `node_modules`.
This keeps build tools (TypeScript compiler, dev dependencies) out of the final image.

### Volume mount convention: `/data`

The container exposes `/data` as the working directory for user files. Users bind-mount their local directory to `/data` and pass the filename as an argument:

```
docker run --rm -v "$(pwd):/data" ghcr.io/dwmkerr/livedown share /data/notes.md
```

This is a familiar pattern (matches tools like Pandoc, Hugo) and requires no environment variables beyond what the CLI already supports.

### Registry: GitHub Container Registry (GHCR)

GHCR is already available in the repo's GitHub Actions context via `GITHUB_TOKEN` — no additional secrets needed. Docker Hub would require a separate access token secret.

### CI trigger: on release tag push (`v*`)

The image is built and pushed only when a release tag is pushed, keeping CI fast on PRs. A `latest` tag is also updated alongside the versioned tag.

## Risks / Trade-offs

- **Platform matrix** → Default GitHub Actions runners are `linux/amd64`. ARM users (Apple Silicon, Raspberry Pi) will need to build locally or use `--platform` emulation. Mitigation: document this limitation; add `linux/arm64` via `docker buildx` in a follow-up if demand arises.
- **Image staleness** → If only tag-triggered, a long gap between releases leaves the image behind `main`. Mitigation: acceptable for a documentation-only change; the npm package remains the primary distribution channel.
- **Volume mount security** → The container writes nothing to the mount; it only reads the markdown file. Livedown's existing signing model means even a tampered container cannot forge updates that the watcher on the host would accept.
