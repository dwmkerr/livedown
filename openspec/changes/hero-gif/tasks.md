## 1. VHS Tape Script

- [ ] 1.1 Install `vhs` locally (`brew install vhs` or `go install github.com/charmbracelet/vhs@latest`) and verify it can produce a GIF
- [ ] 1.2 Write `docs/hero.tape` — a VHS script that runs `livedown share` against a sample file, waits for the relay URL to appear, and ends with the URL prominently visible
- [ ] 1.3 Run `vhs docs/hero.tape` and confirm exit code 0 and that `docs/hero.gif` is produced

## 2. GIF Asset

- [ ] 2.1 Review the generated `docs/hero.gif` — confirm content shows the CLI invocation and the live-share URL, is readable at 720px width
- [ ] 2.2 Verify `docs/hero.gif` is ≤ 3 MB; if over budget, reduce `Framerate` or trim the tape script duration and regenerate
- [ ] 2.3 Commit `docs/hero.tape` and `docs/hero.gif` to the repo

## 3. README Integration

- [ ] 3.1 Add a centred `<img>` element to `README.md` pointing to `docs/hero.gif`, with descriptive alt text, placed after the closing `</p>` of the badge block and before `## Quickstart`
- [ ] 3.2 Preview the rendered README (GitHub preview or `grip`) and confirm the hero GIF appears above the Quickstart section with no layout issues
