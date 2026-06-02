# Design

Snapshots of the Claude Design canvas for the livedown viewer, landing page, and CLI surface.

The canvas itself is the source of truth — edit there, re-export, drop a new zip in this folder. Do not edit prototypes in place; they will be overwritten.

- **Canvas** — https://claude.ai/design/p/68395513-244f-402c-b6ee-77499c42f583?file=Livedown+Designs.html
- **Re-export** — Claude Design → Export → drop the resulting bundle as `design-bundle-N.zip` (incrementing N) so older snapshots stay available.

## Bundles

- `design-bundle-1.zip` — first export (viewer V2 Reader-primary, landing hero, system-diagram variants).
- `design-bundle-2.zip` — landing refresh: leaner hero (52pt, no blurb), system-diagram lifted to centerpiece between hero and how-it-works, commit-ritual row below diagram, dropped Join-a-room nav/modal, dropped three-journeys section.

## Working with a bundle

Unpack on demand into a scratch dir; never check the unpacked contents back in.

```bash
unzip design/design-bundle-1.zip -d scratch/design-bundle-1
open "scratch/design-bundle-1/project/Livedown Designs.html"
```

Each bundle ships with a self-contained HTML entry point that loads the JSX prototypes via Babel-in-browser (no build step).

## Implementation rules

See [`../docs/design.md`](../docs/design.md) for the implementation contract (palette, header layout, mode semantics, guest numbering). Any visual change to the CLI output, viewer chrome, or landing page must update both the Claude Design canvas and `docs/design.md` in the same PR — the doc, the canvas, and the shipped code stay in lockstep.
