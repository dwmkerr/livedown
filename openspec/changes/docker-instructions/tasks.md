## 1. Dockerfile

- [ ] 1.1 Add a multi-stage `Dockerfile` at the project root using `node:lts-alpine` for both builder and runtime stages
- [ ] 1.2 Stage 1 (`builder`): copy source, install all dependencies, compile TypeScript (`npm ci && npm run build`)
- [ ] 1.3 Stage 2 (`runtime`): copy compiled output and production `node_modules`; set `WORKDIR /app` and `ENTRYPOINT ["node", "dist/cli.js"]`
- [ ] 1.4 Add `/data` as the default working-directory volume convention (create the directory in the image)
- [ ] 1.5 Verify the image builds locally: `docker build -t livedown-local .`
- [ ] 1.6 Verify basic smoke test: `docker run --rm livedown-local --help` prints usage without errors

## 2. CI/CD Integration

- [ ] 2.1 Add a `docker` job to the CI/CD workflow (`.github/workflows/cicd.yaml`) triggered on `push` of version tags (`v*`)
- [ ] 2.2 Use `docker/login-action` to authenticate to GHCR with `GITHUB_TOKEN`
- [ ] 2.3 Use `docker/build-push-action` to build and push `ghcr.io/dwmkerr/livedown:<version>` and `ghcr.io/dwmkerr/livedown:latest`
- [ ] 2.4 Confirm image appears in the repository's GHCR package list after a test release tag

## 3. Documentation

- [ ] 3.1 Add a "Docker" section to `README.md` with a self-contained `docker run` example using a bind-mount volume
- [ ] 3.2 Include the `--rm -v "$(pwd):/data"` pattern and a note on passing optional flags (`--editor`, `--edit-key`)
- [ ] 3.3 Add a platform note that the published image targets `linux/amd64`; ARM users should build locally
- [ ] 3.4 Review README for consistency — ensure the new section fits naturally alongside the Quickstart and Commands sections
