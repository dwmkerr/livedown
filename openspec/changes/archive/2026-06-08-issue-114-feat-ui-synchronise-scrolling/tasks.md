## 1. Annotate rendered blocks with source line

- [x] 1.1 In `public/index.html`, inside `renderPreview()`, walk the markdown content once before `marked.parse()` to build a `tokenLines` map (`raw text → starting 0-indexed source line`) by accumulating `raw` lengths across marked's lexer output (`marked.lexer(content)`).
- [x] 1.2 Register a marked **renderer extension** that overrides block-level methods (`paragraph`, `heading`, `list`, `blockquote`, `code`, `table`, `hr`) so each rendered HTML opening tag includes ` data-source-line="<n>"` looked up from `tokenLines`.
- [x] 1.3 In the existing mermaid post-process loop, copy the `data-source-line` attribute from the original `<pre>` onto the replacement `<div class="mermaid">` so the index still resolves to the mermaid block after the swap.
- [x] 1.4 Verify with the empty-document test fixture (`tests/documents/empty.md`) that `renderPreview('')` does not throw and emits no `data-source-line` attributes.

## 2. Build the line→block index

- [x] 2.1 Add a `lineToBlock: Array<{ line: number, top: number, height: number }>` module-scoped state holder beside the existing viewer state in `public/index.html`.
- [x] 2.2 At the end of `renderPreview()` (after mermaid post-processing), iterate `#preview-inner > [data-source-line]` in document order and populate `lineToBlock` with `{ line, top: el.offsetTop, height: el.offsetHeight }`, sorted by `line`.
- [x] 2.3 Add helper `sourceLineToPreviewTop(line)` doing a binary search + linear interpolation against `lineToBlock` as described in `design.md`.
- [x] 2.4 Add helper `previewTopToSourceLine(top)` doing the inverse binary search + linear interpolation against `lineToBlock`.
- [x] 2.5 Both helpers SHALL early-return `0` when `lineToBlock` is empty so short documents are a no-op.

## 3. Wire scroll listeners with re-entrancy guard

- [x] 3.1 Add a `syncingFrom: 'source' | 'preview' | null` state variable, defaulted to `null`.
- [x] 3.2 Add `onSourceScroll()`: read CodeMirror's top visible line via `cm.getScrollInfo()` + `cm.lineAtHeight(scrollInfo.top, 'local')`, translate via `sourceLineToPreviewTop`, then `requestAnimationFrame(() => { syncingFrom = 'source'; panePreview.scrollTop = target; })`.
- [x] 3.3 Add `onPreviewScroll()`: read `panePreview.scrollTop`, translate via `previewTopToSourceLine`, then `requestAnimationFrame(() => { syncingFrom = 'preview'; cm.scrollIntoView({ line, ch: 0 }, 0); })` (or `cm.scrollTo(null, cm.charCoords({ line, ch: 0 }, 'local').top)`).
- [x] 3.4 Both handlers SHALL early-return when `syncingFrom === <their own pane>` and SHALL clear `syncingFrom` to `null` in a `setTimeout(0)` / next `scroll` event so a subsequent user scroll on the same side is honoured.
- [x] 3.5 Add a 100 ms safety timeout that force-clears `syncingFrom` so a missed echo never freezes sync permanently.

## 4. Wire up mode transitions

- [x] 4.1 In the existing mode-toggle handler (the code that sets `#panes[data-mode=...]`), call a new `attachSyncScroll()` when entering `split` and `detachSyncScroll()` when leaving it.
- [x] 4.2 `attachSyncScroll()` SHALL bind `cm.on('scroll', onSourceScroll)` and `panePreview.addEventListener('scroll', onPreviewScroll, { passive: true })`, then run one immediate source→preview sync so the panes align as split opens.
- [x] 4.3 `detachSyncScroll()` SHALL remove both listeners and reset `syncingFrom = null`.
- [x] 4.4 Trigger `attachSyncScroll()` on initial load if the persisted mode (`localStorage('livedown:mode')`) is `split` (the default).

## 5. Documentation

- [x] 5.1 Update `docs/design.md` "Mode semantics" section to note that `split` mode keeps the source and preview scroll positions synchronised in both directions.
- [x] 5.2 No `docs/architecture.md` update is needed — sync-scrolling is viewer chrome, not part of the protocol, roles, or state machine called out in the architecture doc.

## 6. Manual verification (Playwright)

- [x] 6.1 Create or pick a long markdown test document (longer than the viewport — e.g. ≥120 lines with a mix of paragraphs, headings, code blocks, and a table).
- [x] 6.2 Run `npm start -- share <doc>`, open the join URL in the browser, confirm `split` mode is active.
- [x] 6.3 Scroll the source pane to roughly the middle of the document; confirm the preview pane scrolls to the matching rendered block.
- [x] 6.4 Scroll the preview pane back to the top; confirm the source pane scrolls back to the top.
- [x] 6.5 Switch to `code` mode, scroll, switch to `preview` mode; confirm no errors are thrown and that the preview pane scroll position is unaffected by the source-only scrolling that happened while in `code` mode.
- [x] 6.6 Edit the document live (locally or via a second viewer); confirm sync still aligns after the edit lands.
- [x] 6.7 Take before/after screenshots of split mode at the top, middle, and bottom of a long doc and attach them to the PR as required by `CLAUDE.md`.

## 7. CI gates

- [x] 7.1 Run `npm run lint && npm run build && npm test` and confirm all three pass before opening the PR.
