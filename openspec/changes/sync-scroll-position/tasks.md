## 1. Markdown source-line annotator

- [ ] 1.1 In `public/index.html`, add a `annotateSourceLines(content)` helper that calls `marked.lexer(content)` and walks the token stream, tagging each top-level block token (heading, paragraph, list, blockquote, code, html, hr, table, space) with its starting 0-indexed source line by tracking a running offset through `content`.
- [ ] 1.2 Convert the existing `marked.parse(content)` call site in `renderPreview` to use a custom renderer (or post-walk) that emits `data-source-line="<n>"` on the outermost rendered element for each annotated token. List items inherit their list's `data-source-line` only on the `<ul>`/`<ol>` root, not on each `<li>`.
- [ ] 1.3 Update the mermaid post-processor in `renderPreview` so when it replaces `<pre>` with `<div class="mermaid">`, it copies `data-source-line` from the `<pre>` (or its wrapper) onto the new `<div>`.
- [ ] 1.4 Add a Jest unit test for `annotateSourceLines` against a fixture markdown file covering all eight top-level block kinds plus a mermaid block; assert each rendered element's `data-source-line` matches the expected line number.

## 2. Scroll-sync controller

- [ ] 2.1 Add a `ScrollSync` controller (an IIFE / module block inside `public/index.html`) that owns three pieces of state: current leader (`'source' | 'preview' | null`), an expiry timestamp for that leadership, and a pending rAF handle.
- [ ] 2.2 Wire user-input listeners on `#pane-source` and `#pane-preview` (`wheel`, `pointerdown`, `touchstart`, `keydown` filtered to scroll-relevant keys, `focus`) that set the leader and refresh its expiry (150ms).
- [ ] 2.3 Wire `scroll` listeners on both panes that ignore non-leader events and schedule one rAF that computes the follower's target scrollTop and writes it.
- [ ] 2.4 Implement `anchorFromSource()` using `cm.getScrollInfo()` + `cm.lineAtHeight(top, 'local')` to return the topmost visible source line.
- [ ] 2.5 Implement `anchorFromPreview()` by scanning `#preview-inner [data-source-line]` for the element whose `offsetTop` is the largest value ≤ `pane-preview.scrollTop`, returning its `data-source-line`.
- [ ] 2.6 Implement `scrollPreviewTo(line)` and `scrollSourceTo(line)` using `el.offsetTop` and `cm.heightAtLine(line, 'local')` respectively; both must wrap their writes in a 50ms suppression window that ignores `scroll` events on the follower as a defence-in-depth measure.
- [ ] 2.7 Gate every public entry point on `#panes.dataset.mode === 'split'`; do not even register active listeners in other modes (or short-circuit on entry).

## 3. Integration with existing viewer hooks

- [ ] 3.1 In `applyMode(mode)`, after writing `panes.dataset.mode`, if the new mode is `split` call `ScrollSync.realign()` once on next animation frame (give layout time to settle). For non-split modes, call `ScrollSync.suspend()` so no listeners fire.
- [ ] 3.2 At the end of `renderPreview(content)`, after the mermaid block has run, call `ScrollSync.onRerender()` to re-bind to the current anchor.
- [ ] 3.3 Verify nothing in the `change` / `beforeChange` / `setValue` paths interferes with scroll-sync (programmatic `setValue` during a remote push should not trigger a leadership flip).

## 4. Failure handling

- [ ] 4.1 Wrap each anchor lookup in `try/catch`; on failure, return null and skip the follower write for that tick. Do not log to console at error level.
- [ ] 4.2 Add a guard for empty documents: if `#preview-inner` has no element with `data-source-line`, `scrollPreviewTo` is a no-op.
- [ ] 4.3 Add a guard for anchors past the last annotated block: leave the preview at its current `scrollTop` rather than snapping to the bottom.

## 5. End-to-end tests

- [ ] 5.1 Add `tests/documents/long.md` — a fixture roughly 200 lines covering headings, paragraphs, lists, a fenced code block, a table, and a blockquote, sized so each pane scrolls in split mode.
- [ ] 5.2 Add a Playwright scenario (per `CLAUDE.md`'s browser-test section) that loads `long.md`, switches to split mode, scrolls the source to a known line, and asserts the preview's top rendered block has the matching `data-source-line`.
- [ ] 5.3 Add a Playwright scenario that scrolls the preview to a heading and asserts CodeMirror's first visible line matches the heading's `data-source-line`.
- [ ] 5.4 Add a Playwright scenario that types into the source while scrolled past the top and asserts the preview re-renders without snapping back to scrollTop 0.

## 6. Documentation

- [ ] 6.1 Update `docs/architecture.md` viewer / state-machine section with one paragraph: split mode keeps source and preview aligned by `data-source-line`; leadership follows last user input; no protocol change.
- [ ] 6.2 Update `docs/design.md` viewer-chrome section to note that split mode is scroll-synced (visual chrome unchanged, so the Claude Design canvas / `design/` bundle does not need a new export).
- [ ] 6.3 Update `README.md` "How It Works" only if the split-mode behaviour is user-visible enough to mention there; otherwise leave alone.

## 7. Validate and ship

- [ ] 7.1 Run `npm run lint && npm run build && npm test` per `CLAUDE.md`.
- [ ] 7.2 Run the Playwright scenarios from section 5 manually against `npm start -- share tests/documents/long.md`.
- [ ] 7.3 Run `openspec validate sync-scroll-position --strict` and resolve any findings.
- [ ] 7.4 Attach before/after screenshots of split-mode scrolling to the PR description per the repo's UI-change convention.
