## ADDED Requirements

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
