## Context

The livedown viewer (`public/index.html`) is a single static HTML file. In `split` mode it shows a CodeMirror editor on the left (`#pane-source`) and a rendered marked.js preview on the right (`#pane-preview` > `#preview-inner`). Each pane scrolls independently — CodeMirror manages its own `.CodeMirror-scroll` element, and `#pane-preview` has `overflow-y: auto`.

For documents longer than the viewport this means readers and editors have to pan both sides by hand to keep what they're reading on the right next to what they're editing on the left. VS Code, Cursor, and most modern markdown previewers solve this by tying source-line position to rendered-block position so scrolling one side scrolls the other. Issue #114 asks for the same behaviour.

The viewer already uses marked.js with a custom post-process pass (mermaid replacement). marked exposes per-token source positions via its lexer (each token carries the raw text and, with the `gfm`-friendly tokenizer, a starting line that can be derived from the cumulative `raw` lengths). CodeMirror exposes `scroll`, `charCoords(...)`, `getScrollInfo()`, and `scrollTo()`, which is everything we need on the source side.

## Goals / Non-Goals

**Goals:**
- In `split` mode, scrolling either pane scrolls the other so the topmost visible source line stays aligned with the topmost visible rendered block.
- Bidirectional and symmetric — source-drives-preview and preview-drives-source use the same line→element index.
- Best-effort: never throw if the index is empty, the document is shorter than the viewport, or a block has no source line attribution.
- Re-entrancy-safe: programmatic scroll on the driven side must not echo back and drive the driver.
- Survives content updates (`renderPreview()` re-runs on every push) by rebuilding the index at the end of each render.

**Non-Goals:**
- Pixel-perfect alignment of every line. Markdown rendering is many-to-one (e.g. a paragraph spans several source lines but is one rendered block) and many-to-many (e.g. a fenced code block with internal lines), so we anchor at block boundaries and interpolate within.
- Sync across viewer instances or across the relay. This is local viewer-only chrome.
- Sync when the user is actively typing (cursor-driven scroll). Out of scope; the existing edit flash + debounce is sufficient feedback.
- Adding a per-user toggle. Sync is on by default in `split` mode; revisit later if anyone complains.
- Changes to `code` mode (no preview visible) or `preview` mode (no source visible).
- Touching the protocol, relay, CLI, or watcher.

## Decisions

### Decision: Anchor on `data-source-line` attributes stamped during render

Each top-level rendered block (paragraph, heading, list, list item, blockquote, table, fenced code block, mermaid container, hr) gets a `data-source-line="<n>"` attribute where `n` is the 0-indexed source line where the block's first character lives.

The cleanest place to set this is a marked **renderer extension** that wraps the default renderer methods for block-level tokens. marked passes tokens whose `raw` text we can locate inside the original markdown to derive the start line. We pre-compute a `tokenIndex` keyed by `raw` content during `renderPreview()` so the renderer can look up the line cheaply.

Alternatives considered:
- **DOM walk after render, matching text to source lines.** Brittle: HTML escaping, mermaid replacement, and inline elements break naive matching.
- **Use marked's `walkTokens` to mutate token objects.** Possible but the renderer is the public extension point; `walkTokens` is documented as best-effort for traversal, not annotation.
- **Re-implement a positional markdown parser.** Massive overkill — we already ship marked and only need block-level granularity.

### Decision: Build a sorted `lineToBlock` array after every render

After `renderPreview()` finishes, iterate `#preview-inner > [data-source-line]` in document order and build `lineToBlock: Array<{ line: number, top: number, height: number }>`. The array is sorted by `line` (the DOM order should already be source-order; we re-sort defensively).

`top` is the block's `offsetTop` inside `#pane-preview` (we read `el.offsetTop` minus `#preview-inner` padding). `height` is `el.offsetHeight`. Heights handle blocks like fenced code spans that occupy multiple source lines.

Rebuilding from the DOM (instead of caching tokens) handles mermaid post-processing transparently — the `data-source-line` attribute is copied onto the replacement `<div class="mermaid">` so the index points at the right element after the mermaid swap.

### Decision: Map by linear interpolation between block anchors

To convert `sourceLine → previewScrollTop`:
1. Binary-search `lineToBlock` for the largest entry with `line <= sourceLine`. Call it `anchor`; the next entry is `next`.
2. If no `next`, return `anchor.top`.
3. `t = (sourceLine - anchor.line) / (next.line - anchor.line)` clamped to `[0, 1]`.
4. Return `anchor.top + t * ((next.top + next.height) - anchor.top)`.

To convert `previewScrollTop → sourceLine`:
1. Binary-search `lineToBlock` for the largest entry with `top <= scrollTop`. Same `anchor`/`next` pair.
2. If no `next`, return `anchor.line`.
3. `t = (scrollTop - anchor.top) / ((next.top + next.height) - anchor.top)` clamped to `[0, 1]`.
4. Return `Math.round(anchor.line + t * (next.line - anchor.line))`.

Linear interpolation gives a smooth feel for paragraphs that span several source lines without paying for a more elaborate model (heights are already in the index).

Alternatives considered:
- **Snap-to-anchor only.** Cheaper but produces visible jumps mid-paragraph; users would notice the wrongness.
- **Per-character offset mapping.** Overkill; markdown is line-oriented and the gain over per-line interpolation is invisible.

### Decision: Re-entrancy guard via a `syncingFrom` token, not booleans

A simple `isSyncing` boolean races: if `requestAnimationFrame` defers the scroll write, a second human scroll on the same side can fire before we clear the flag. Instead, hold `syncingFrom: 'source' | 'preview' | null`. Both scroll handlers early-return if `syncingFrom === <their own pane>`; the handler clears `syncingFrom` to `null` inside the *target* pane's next `scroll` event (which it triggered) or on a 100 ms safety timeout.

Alternatives considered:
- **Naive boolean.** As above — drops human scrolls when timing is bad.
- **Suppress scroll events on the target instead of guarding the source.** Doesn't compose with CodeMirror, which fires synthetic events from its own scroller.

### Decision: Only attach handlers in `split` mode; rebind on mode change

The mode toggle (`code` / `split` / `preview`) is persisted in `localStorage('livedown:mode')` and applied via `#panes[data-mode=...]` (see `docs/design.md`). The sync controller observes mode transitions and:
- On `→ split`: attach `cm.on('scroll', ...)` and `pane-preview.addEventListener('scroll', ...)`. Run an initial sync from source → preview so opening split mode lines up immediately.
- On `→ code` or `→ preview`: detach both handlers. Mode changes never animate sync.

This keeps the scroll listeners off the hot path in single-pane modes and prevents a hidden pane from desyncing the visible one.

### Decision: Throttle with `requestAnimationFrame`, not `setTimeout`

Scroll events fire frequently. Wrap the target-side write in `requestAnimationFrame` so we coalesce within a frame. CodeMirror's scrollbar paint already runs in rAF, and `pane-preview` repaint does too, so the visible feel stays smooth.

## Risks / Trade-offs

- **marked tokens don't carry a source line directly.** Mitigation: pre-walk the markdown once to build a `rawString → startLine` map by tracking cumulative `raw` lengths in the order marked emits tokens. This is O(n) over the document and matches marked's own parse cost.
- **Mermaid post-processing replaces `<pre>` with `<div class="mermaid">`.** Mitigation: copy `data-source-line` from the original `<pre>` to the new `<div>` during replacement (touch the existing mermaid post-process loop).
- **Long code blocks or tables can dominate the index sparsely.** A 200-line fenced block is one block. Linear interpolation across it is approximate — scrolling inside the rendered block won't pull the source through every line. Acceptable: VS Code has the same behaviour. Users can switch to `code` mode for fine-grained navigation.
- **`offsetTop` reads force layout.** Mitigation: build the index once per render (not on every scroll), and read positions in a single pass.
- **Mode changes mid-scroll could leave a stale handler.** Mitigation: the mode-change hook always detaches both handlers before reattaching for the new mode.
- **Documents with zero `data-source-line` anchors (very short files).** Mitigation: sync handlers early-return when the index is empty.

## Migration Plan

Pure additive viewer change. No data migration, no protocol bump, no flag. Ships behind the existing `split` mode default. Rollback is reverting the PR.
