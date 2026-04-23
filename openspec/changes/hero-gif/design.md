## Context

The README currently shows two separate static assets to communicate the livedown experience:
- `docs/terminal-share.svg` — an SVG animation of the CLI output
- `docs/livedown-share-architecture-doc-browser-screenshot.png` — a static browser screenshot

These assets are scattered through the Quickstart section and do not convey the flow as a single unified story. A hero GIF at the top of the README shows CLI → browser in one motion, the standard pattern for developer CLI tools.

The recording tool chosen is **[vhs](https://github.com/charmbracelet/vhs)** by Charmbracelet: it takes a declarative `.tape` script and renders a reproducible GIF or WebM. The `.tape` script is the source of truth — anyone can regenerate the GIF by installing `vhs` and running it.

## Goals / Non-Goals

**Goals:**
- Ship a `docs/hero.gif` that shows `livedown share` being invoked and the resulting browser view becoming live.
- Commit `docs/hero.tape` so the GIF is reproducible and version-controlled.
- Embed the GIF in `README.md` as a hero image, between the badge row and the Quickstart heading.

**Non-Goals:**
- Replacing the existing `terminal-share.svg` or browser screenshot (they remain).
- Automating GIF regeneration in CI (the tape script is sufficient for manual regeneration; CI automation is a separate concern).
- Showing the collaborative editing flow in the hero (keep it simple: share → view).

## Decisions

### VHS over asciinema / screen recording

| Tool | Reproducible | Browser capture | Output | Verdict |
|---|---|---|---|---|
| vhs | ✓ (tape script) | limited (via `Screenshot`) | GIF/WebM | **chosen** |
| asciinema | ✓ | ✗ (terminal only) | `.cast` (needs player) | rejected — no static GIF |
| Screen recording | ✗ (manual) | ✓ | MP4 → GIF (lossy pipeline) | rejected — not reproducible |

VHS is the right tradeoff: scripted, terminal-native, outputs a usable GIF directly.

### Browser portion: static screenshot composited into terminal frame

VHS can capture a `Screenshot` of the terminal at a point in time, but cannot open a browser window and capture it. The browser portion will be handled by compositing a browser screenshot (taken during recording) alongside the terminal output in the tape, or by sequencing terminal output → instructional text pointing to the browser URL. Given "best effort" scoping in the issue, an approach of **terminal recording only, with the browser URL prominently shown** is acceptable for v1. A follow-up can add side-by-side compositing.

### Placement in README

Between the badge row (`</p>`) and the `## Quickstart` heading. This is the conventional "hero" position — visible without scrolling, above the instructional prose.

### File size

GIFs can be large. Target under 3 MB. VHS produces reasonable sizes at 80×24 terminal dimensions with a short (15-20 second) script. If the output exceeds 3 MB, trim the script or reduce frame rate in the tape (`Framerate 15`).

## Risks / Trade-offs

- **GIF binary in git** — Committing a binary asset increases repo size. Mitigation: keep the GIF under 3 MB; this is standard practice for README assets.
- **Staleness** — The GIF will drift from the real UI over time. Mitigation: the tape script makes regeneration straightforward; update it alongside breaking UI changes.
- **vhs not installed in CI** — If the GIF needs regenerating in CI, vhs must be installed. Not in scope for this change (manual regeneration only).
