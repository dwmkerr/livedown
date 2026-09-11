## Why

In split mode the viewer (`public/index.html`) renders the CodeMirror source pane and the markdown preview pane side-by-side, but each scrolls independently. When the user reads or edits a long document they have to scroll both panes manually to keep them aligned. This is the behaviour the issue reporter calls out as different from VS Code's markdown preview, which keeps the source and rendered views in sync as either side scrolls. Issue #114: *"when i scroll either view, the other should stay in sync i think this is what vscode does"*.

## What Changes

- In split mode, scrolling the CodeMirror source pane SHALL scroll the preview pane so that the topmost visible source line corresponds to the topmost visible rendered block, and vice versa.
- Synchronisation SHALL be bidirectional: scrolling either pane drives the other.
- The mapping SHALL be best-effort line-to-element: rendered blocks (paragraphs, headings, lists, code blocks, tables, blockquotes, mermaid containers, etc.) are tagged with their originating source line so the viewer can translate between source scroll position and preview scroll position.
- Sync SHALL be suspended while the driven pane is being scrolled programmatically so the panes do not fight each other in a feedback loop.
- Sync SHALL be a no-op outside split mode (`code` and `preview` only show one pane, so there is nothing to mirror).
- After a content update (`renderPreview()` re-runs because the document changed), the line-to-element index SHALL be rebuilt so the mapping stays correct as the document grows.
- No changes to the relay, CLI, watcher, or message protocol — this is a pure browser-side viewer enhancement.

## Capabilities

### New Capabilities
- `synchronized-scrolling`: Browser viewer keeps the CodeMirror source pane and the rendered preview pane scroll positions aligned in split mode, in both directions.

### Modified Capabilities
<!-- None. The viewer chrome and split-pane layout are documented in docs/design.md
     but no existing OpenSpec capability owns the scroll behaviour, so this is
     additive rather than a delta. -->

## Impact

- `public/index.html`: add a marked.js renderer (or post-process hook) that stamps each top-level rendered block with a `data-source-line` attribute derived from the marked token's `raw` position. Add a sync controller that listens to CodeMirror's `scroll` event and the `#pane-preview` `scroll` event, maps positions through the line→element index, and applies the mirrored scroll with a re-entrancy guard. Rebuild the index at the end of each `renderPreview()` run.
- `docs/design.md`: mention sync-scrolling as part of split-mode behaviour (small addendum under "Mode semantics").
- No new dependencies — marked.js already exposes token positions and CodeMirror already exposes scroll events.
- No changes to `src/`, the relay, or the protocol.
- Manual Playwright verification per `CLAUDE.md` browser-test scenario, extended to cover scrolling a long document in split mode.
