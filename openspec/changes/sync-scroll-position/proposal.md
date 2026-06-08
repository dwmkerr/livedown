## Why

In split mode the viewer renders the markdown source (`#pane-source`, a CodeMirror editor) and the rendered preview (`#pane-preview`) side by side, but they scroll independently. Once a document grows past a screen you constantly lose your place: scroll the source to find a heading and the preview stays at the top, scroll the preview to read a section and the editor cursor's surrounding lines drift offscreen. Issue #114 asks for the VS Code behaviour — when one pane scrolls, the other follows so the line you're editing and the rendered block you're reading stay aligned.

## What Changes

- Add a scroll-sync controller in the browser viewer that keeps `#pane-source` (CodeMirror) and `#pane-preview` aligned in split mode.
- Anchor the mapping on **source line numbers**: the markdown renderer annotates each top-level rendered block with the source line it came from, and the controller maps "topmost visible source line ↔ rendered block whose `data-source-line` matches (or brackets) that line".
- Sync is **bidirectional but non-recurrent**: whichever pane the user actually scrolled is the leader for that gesture; the follower is moved programmatically and its scroll event is suppressed so it cannot bounce back. Detection uses pointer / wheel / keyboard / focus signals on the pane, not just `scroll` events.
- Sync runs only when `#panes[data-mode="split"]`. In `code` or `preview` only modes the other pane is hidden and there is nothing to follow; switching back into split re-aligns the follower to the leader's current position once.
- Re-renders (incoming pushes, local edits debounced into `renderPreview`) re-emit `data-source-line` markers and re-run the alignment so the preview doesn't jump when content arrives.
- Non-goal: cross-viewer scroll sync (broadcasting one viewer's scroll position to other connected viewers). The protocol currently has no message for this and the issue text reads as the local editor/preview pairing VS Code provides. Out of scope; revisit separately if requested.

## Capabilities

### New Capabilities
- `scroll-sync`: Bidirectional, line-anchored scroll synchronisation between the source editor pane and the rendered preview pane in the browser viewer's split mode.

### Modified Capabilities
<!-- None. The existing specs (docker-usage, landing-page, mermaid-diagram-rendering, private-sharing) cover unrelated capabilities; no requirement-level behaviour in them changes. The viewer chrome described in docs/design.md is documentation, not an OpenSpec capability. -->

## Impact

- **Code**: `public/index.html` — the only place the viewer ships. The markdown render path (currently a single `marked.parse` into `#preview-inner`) gains source-line annotation on top-level blocks; new scroll-sync wiring attaches to `cm` and `#pane-preview`; the `applyMode` toggle calls into the controller when entering split mode.
- **Dependencies**: none added. `marked` already exposes the token stream needed to annotate blocks; CodeMirror 5 already exposes `lineAtHeight` / `heightAtLine` / the viewport API needed to compute the top visible source line. No new CDN scripts.
- **Tests**: extend the Playwright scenario in `CLAUDE.md` with a scroll-sync check on a long document (a new fixture under `tests/documents/`); add unit coverage for the line-to-block mapping helper.
- **Docs**: `docs/design.md` (viewer chrome section) and `docs/architecture.md` (browser state machine / viewer behaviour) both describe what the panes do — add a short note that split mode keeps the panes scroll-aligned. The Claude Design canvas / `design/` bundle does not need a new export because no visual chrome changes; behaviour-only updates are documented in prose.
- **Security**: none. Sync is purely client-side DOM/CodeMirror state inside one viewer; no new messages cross the WebSocket.
