## Why

The README lacks a single at-a-glance demonstration of the livedown workflow. New visitors see two separate static assets (a terminal SVG and a browser screenshot), but nothing that shows the end-to-end experience — run a command, get a live browser view — in one motion. A hero GIF bridges that gap and dramatically reduces time-to-understanding for first-time visitors.

## What Changes

- A new animated GIF (`docs/hero.gif`) is added, recorded with [vhs](https://github.com/charmbracelet/vhs) from a `.tape` script committed to the repo.
- A new `docs/hero.tape` VHS tape script is added, encoding the exact recording steps so the GIF is reproducible.
- `README.md` is updated to display `docs/hero.gif` as a hero image near the top (after the badge row, before the Quickstart section).
- The existing `docs/terminal-share.svg` and `docs/livedown-share-architecture-doc-browser-screenshot.png` remain in place; the hero GIF supplements rather than replaces them.

## Capabilities

### New Capabilities

- `hero-gif`: A reproducible animated GIF and its VHS tape source that demonstrate the full livedown workflow (CLI share command → browser live view), embedded as the README hero.

### Modified Capabilities

<!-- No existing spec-level behavior changes. This is a documentation/assets addition only. -->

## Impact

- `README.md` — one new `<img>` element added after the badge block.
- `docs/hero.tape` — new VHS script (source of truth for regenerating the GIF).
- `docs/hero.gif` — new binary asset committed to the repo.
- No code, API, or protocol changes.
