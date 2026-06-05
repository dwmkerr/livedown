## Why

In `split` mode the source pane (CodeMirror) and the preview pane (rendered HTML) scroll independently. A user reading the rendered preview cannot tell which source line is in view — and a user editing in the source cannot tell which rendered section the cursor is currently looking at. Issue #114 asks for the VSCode/Cursor-style behaviour: scrolling either pane keeps the other pane aligned so the same region of the document is visible in both.

This is a `split`-mode quality-of-life feature. The two panes are already visually paired; right now they drift, which makes reviewing live edits and navigating long documents fiddly.

## What Changes

- In `split` mode, the source pane and the preview pane SHALL stay scroll-synchronised: scrolling one pane scrolls the other to the corresponding region of the document.
- Synchronisation is bidirectional and driven by whichever pane the user is actively scrolling — the inactive pane follows without echoing the scroll back.
- Synchronisation is based on a source-line ↔ rendered-block mapping built when the preview is rendered (each top-level rendered block carries its originating source line number).
- `code`-only and `preview`-only modes are unaffected — there is only one pane visible, so there is nothing to sync.
- When the source content changes (local edit or remote `update`), the line ↔ block mapping is rebuilt as part of `renderPreview()`.
- No new CLI flag, no new message type, no relay change. Scroll position is a local viewer concern and is never broadcast.

## Capabilities

### New Capabilities
- `synchronised-pane-scrolling`: defines when the source and preview panes stay scroll-synchronised, how the line ↔ block mapping is built, and how scroll events propagate without ping-pong.

### Modified Capabilities
- none. The viewer's mode toggle, roster, lock pill, edit flow, and protocol behaviour are unchanged.

## Impact

- **Code**: `public/index.html` only — adds (a) a `marked` renderer hook that stamps `data-source-line` on top-level rendered blocks, (b) a `buildLineMap()` step called from `renderPreview()`, (c) `scroll` listeners on the CodeMirror scroller and `#pane-preview` with a "who's driving" lock to suppress feedback loops.
- **Protocol / relay / CLI**: none.
- **Tests**: add a unit test that asserts `renderPreview()` stamps `data-source-line` on top-level blocks for representative markdown (headings, paragraphs, lists, code blocks). Browser/E2E coverage of the actual scroll coupling stays manual (Playwright scenario added to `CLAUDE.md` testing checklist).
- **Docs**: `docs/design.md` "Mode semantics" section adds one line noting that `split` mode keeps the two panes scroll-synchronised. `docs/architecture.md` is unaffected (no protocol or lifecycle change). README's "How It Works" is unaffected.
- **Design canvas**: no visual change — no new chrome, no new affordance. Scroll behaviour only. No `design/design-bundle-N.zip` bump required.
- **Performance**: scroll handlers run on user-driven scroll events only; the line map is rebuilt once per render (already O(n) over preview blocks). No measurable cost on documents of realistic size.
