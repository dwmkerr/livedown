# Design

Static design artifacts for the livedown viewer, landing page, and CLI surface.

The source of truth lives on **Claude Design** — edit there, re-export, replace this folder wholesale. Do not edit prototypes in place; they will be overwritten.

- **Canvas** — https://claude.ai/design/p/68395513-244f-402c-b6ee-77499c42f583?file=Livedown+Designs.html
- **Bundle re-export** — Claude Design → Export → save the resulting `livedown/` directory over `./design/`

## Contents

- `project/Livedown Designs.html` — entry point that loads the JSX prototypes
- `project/src/*.jsx` — viewer, landing, system-diagram, viewer-states, app shell
- `project/scratch/*.png` — landing iteration screenshots from the design canvas
- `project/uploads/` — reference screenshots used as design inputs

## Implementation rules

See [`../docs/design.md`](../docs/design.md) for the implementation contract (palette, header layout, mode semantics, guest numbering). Any visual change to the CLI output, viewer chrome, or landing page must update both the Claude Design canvas and `docs/design.md` in the same PR — the doc, the prototypes, and the shipped code stay in lockstep.

The scanner ignore at `.guardrails/ignore` excludes this whole tree from security scans because the prototypes are static design artifacts, never compiled into runtime code.
