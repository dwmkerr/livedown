## Context

The browser viewer (single file, `public/index.html`) renders the document twice in split mode:

- `#pane-source` — a CodeMirror 5 instance (`cm`) wrapping the markdown text. Its scroller is `.CodeMirror-scroll`.
- `#pane-preview` — a flex container whose own `overflow-y: auto` provides the scrolling, holding `#preview-inner` populated by `marked.parse(content)` inside `renderPreview()` (line 1549).

The mode toggle (`#mode-toggle`) flips `#panes[data-mode]` between `code`, `split`, and `preview`; the non-split modes hide one pane entirely (lines 263–266). Edits go through CodeMirror's `change` event, debounce 400ms, then call `push()` which calls `renderPreview()` on the local copy. Remote pushes arrive over the WebSocket and also call `renderPreview()` (line 1673, 1710). Mermaid blocks are post-processed after `marked.parse`.

There is no existing line→DOM mapping; `marked.parse` returns plain HTML.

## Goals / Non-Goals

**Goals:**
- In split mode, scrolling either pane drives the other so the source line at the top of the editor viewport aligns with the rendered block that came from that line (and vice versa).
- Sync is driven by **user intent**, not by raw `scroll` events. Programmatic scrolls of the follower do not feed back into the leader.
- Sync survives re-renders triggered by local edits, remote pushes, and mode toggles.
- Sync degrades cleanly: if mapping fails for a position, the follower simply doesn't move that tick — never throws, never blocks editing.
- Sync stays off when there's nothing to sync (single-pane modes; document empty; preview not yet rendered).

**Non-Goals:**
- Cross-viewer scroll sync. The protocol has no `scroll` message and the issue doesn't ask for it (#114 is the VS Code editor↔preview behaviour). Reconsider as a separate change.
- Sub-line accuracy / per-character mapping. Aligning by source line is sufficient and matches VS Code.
- Smooth animated easing. Programmatic scrolls are instantaneous so the panes track 1:1 with the gesture.
- Touch-momentum heuristics; we trust the user's last interaction signal.
- Persisting scroll position across reloads.

## Decisions

### Decision 1: Annotate rendered blocks with their source line via `marked` token walker

**Choice:** Wrap top-level rendered blocks in elements that carry `data-source-line="<n>"`, where `n` is the 0-indexed line in the markdown source the block starts on.

**How:** Use `marked.Lexer.lex(content)` to produce a token list, then walk the tokens. `marked` v5+ tokens carry `raw` text; we recompute the starting line by tracking a running offset through the source. For each top-level token (heading, paragraph, list, blockquote, code, html, table, hr, space) we wrap or tag the corresponding rendered HTML.

A `marked` extension/renderer is cleaner than post-parsing HTML: the renderer hook receives the token, knows the source line we attached, and can write `data-source-line` directly on the wrapper element. We hook `paragraph`, `heading`, `list`, `blockquote`, `code`, `html`, `hr`, `table` — the eight top-level block kinds the existing docs use.

**Alternatives considered:**
- *Diff the rendered output by counting `\n` in element `textContent`* — fragile under wrapped lines, lists, fenced code that contains blanks.
- *Markdown-it with `source-map` plugin* — would mean swapping the parser. `marked` is already on the page and the existing mermaid post-processing depends on its output shape. Not worth the swap.
- *Render two passes and align by token order alone* — works for headings but loses paragraph granularity.

### Decision 2: Compute the leader's anchor from CodeMirror APIs, not raw scrollTop

For the editor: `cm.lineAtHeight(cm.getScrollInfo().top, 'local')` gives the top visible line. For the preview: find the rendered element whose top is at or just above `pane.scrollTop`; its `data-source-line` is the anchor.

For the follower:
- Editor → Preview: find the rendered element with the **largest** `data-source-line` ≤ anchor; set `pane-preview.scrollTop = el.offsetTop`.
- Preview → Editor: call `cm.scrollIntoView({ line: anchor, ch: 0 }, /*margin*/ 0)` then nudge to put that line at the top via `cm.scrollTo(null, cm.heightAtLine(anchor, 'local'))`.

**Alternative considered:** percentage-based mapping (`previewScrollTop / previewScrollHeight` = `editorScrollTop / editorScrollHeight`). Cheap but visibly wrong on documents with long code blocks or tall images — the two panes have very different total heights per line. Rejected for the same reason VS Code rejected it.

### Decision 3: Identify the leader by **last user-input pane**, not by which pane fired `scroll`

A `scroll` event fires whether the user scrolled or our code scrolled. Filtering with an `isProgrammatic` flag is the usual trick but it's racey: layout reflow on the follower can re-emit `scroll` asynchronously and flip leadership.

Instead, we track the leader explicitly. The leader switches when the user touches a pane:
- `wheel`, `keydown` (arrow / pageup / pagedown / space), `pointerdown`, `touchstart`, `focus` on a pane sets `leader = thatPane`.
- `scroll` on the leader runs the sync; `scroll` on the follower is ignored.

This survives layout-triggered scroll storms on the follower because the follower is never the leader during the gesture. After ~150ms of no user-input signals the leader designation expires (so the next gesture, whichever pane it lands on, takes over cleanly).

### Decision 4: Run sync only in split mode, re-sync on mode entry and on re-render

`applyMode(mode)` is the single entry point for mode changes. It sets `panes.dataset.mode`. The controller subscribes to a `MutationObserver` on `#panes`' `data-mode` attribute (one source of truth — no second copy of the mode in JS state). On transition to `split` it calls a one-shot `realign(leaderPane)` using whichever pane currently holds focus / last-input (default: editor).

`renderPreview()` is called both for local pushes (line 1605) and remote pushes (line 1673, 1710). We invoke the annotator inside `renderPreview` and then call `realign(leader)` so the preview re-binds to current scroll position after content changes. This is the same hook mermaid post-processing already uses, so the shape is familiar.

### Decision 5: rAF coalescing for scroll handlers

Wheel / keyboard scroll fires many events per gesture. The handler stashes the desired target scrollTop and a single `requestAnimationFrame` writes to the follower. This avoids fighting the browser's scroll smoothing and keeps CPU low on long documents.

## Risks / Trade-offs

- **Wrapped lines in CodeMirror** → CodeMirror's `lineAtHeight` returns the document line, not the visible row, so wrapping doesn't break anchoring. Mitigation: verified in Playwright with a paragraph that wraps to multiple screen rows.
- **Tokens `marked` doesn't expose start-line for** → recomputing line offsets from `raw` text breaks if `marked` ever strips whitespace before exposing `raw`. Mitigation: unit test the annotator against a fixture covering all eight top-level block kinds and assert each `data-source-line` matches the actual source line.
- **Mermaid blocks rewrite the DOM after annotation** → the mermaid post-processor replaces `<pre>` with `<div class="mermaid">`. Mitigation: copy `data-source-line` over when replacing; keep the line number on the wrapper, not the inner element.
- **Loop where editor scroll moves preview, preview's resize moves editor** → ruled out by Decision 3 (the follower never leads during a gesture). Defence in depth: a 50ms suppression window on the follower after a programmatic scroll, as a belt to the suspenders.
- **Performance on very large documents** → annotation walks tokens once per render (already O(n)); scroll handler is rAF-coalesced. No measurable hit expected; if a 10k-line document regresses we can throttle to one realign per 16ms explicitly.
- **Mode toggle while mid-gesture** → leaving split mode cancels any pending rAF; entering split re-aligns from the current leader once. No drift.

## Migration Plan

- All changes are additive in `public/index.html`. No protocol changes, no relay changes, no CLI changes.
- No feature flag needed: behaviour is purely additive and limited to split mode; if mapping fails the panes simply don't move in sync (the current behaviour).
- Rollback: revert the PR. There is no persisted state to clean up.

## Open Questions

- *Should the editor cursor (not just the scroll position) be the anchor when the editor is focused?* — VS Code uses cursor when typing, scroll otherwise. Worth doing but the simpler "topmost visible line" gets us 90% of the value; revisit after shipping if the cursor-based feel is wanted.
- *Sync behaviour during incoming remote edits that the remote user is scrolling through* — out of scope (no cross-viewer scroll). Local user's leader designation always wins locally.
