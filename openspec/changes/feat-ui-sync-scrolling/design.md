## Context

The livedown browser viewer (`public/index.html`) presents a split pane: a CodeMirror editor on the left (`#pane-source`, `overflow: hidden`, scroll managed by CodeMirror) and a rendered markdown preview on the right (`#pane-preview`, `overflow-y: auto`). Both panes are independently scrollable but have no relationship.

The viewer is a single self-contained HTML file with no build step. All logic is vanilla JS. CodeMirror 5 is loaded from CDN. The preview is regenerated via `marked.parse()` on a 400 ms debounce after each edit, replacing `#preview-inner`'s entire innerHTML.

## Goals / Non-Goals

**Goals:**
- Bidirectional proportional scroll sync in split mode only.
- Stable scroll position during preview re-renders (no jump-to-top on each keystroke).
- Zero new dependencies.
- No impact on `code` or `preview` single-pane modes.

**Non-Goals:**
- Line-mapped sync (injecting `data-line` attributes into preview HTML à la VS Code's deep implementation) — disproportionate complexity for v1; proportional is accurate enough.
- User-facing toggle to enable/disable sync — always-on in split mode for v1.
- Persisting scroll position across page refresh or mode switches.

## Decisions

### Decision 1: Proportional scroll fraction (not line-mapped)

**Chosen**: Normalise each pane's scroll position to a fraction `[0, 1]` and apply the same fraction to the other pane.

```
fraction = scrollTop / (scrollHeight - clientHeight)   // guard: denominator > 0
```

**Alternatives considered**:
- *Line-mapped*: Inject `data-line="N"` into every block element emitted by `marked`, then find the nearest element in the preview whose `data-line` is closest to CodeMirror's first visible line. Accurate for uneven content (e.g., a short heading followed by a long code block). Rejected: requires a custom `marked` renderer, changes the preview HTML structure, and adds significant complexity for a v1 feature.
- *Character-offset map*: Track byte offset in the source and map to rendered DOM nodes. Even more complex.

Proportional is the standard first-pass approach used by many editors (Typora, StackEdit). It degrades gracefully and matches the user's intuition for most documents.

### Decision 2: `isSyncing` flag for feedback-loop prevention

**Chosen**: A module-level boolean `let isSyncing = false`. The sync handler sets it to `true` before calling the other pane's scroll API, then resets it in the next microtask (`Promise.resolve().then(() => isSyncing = false)`).

**Alternatives considered**:
- *Remove and re-add listeners*: Listener teardown/reattachment on every sync event is expensive and racey.
- *Timestamp debounce*: Track `lastScrollTime` and ignore events within N ms of a programmatic scroll. Fragile — timing varies across devices.
- *`requestAnimationFrame` reset*: Acceptable alternative to `Promise.resolve()`. Using a microtask is slightly tighter (fires before the next paint).

### Decision 3: Restore preview scroll after re-render

**Chosen**: In `renderPreview()`, capture `previewPane.scrollTop` before replacing innerHTML, then restore it immediately after (synchronously, before the next paint).

```js
const savedTop = previewPane.scrollTop;
previewPane.innerHTML = ...;   // marked.parse()
previewPane.scrollTop = savedTop;
```

**Why synchronous restore works**: Browsers do not immediately reflow between these two synchronous statements; by the time layout runs, `scrollTop` is already set.

**Caveat**: After a large structural edit (e.g., deleting half the document), restoring the old `scrollTop` may place the preview past the new end of content. The browser clamps `scrollTop` to `scrollHeight - clientHeight`, so this is safe — the preview will just show the end of the shorter document, which is reasonable behaviour.

**Alternatives considered**:
- *Don't restore*: Preview jumps to top on every keystroke in split mode — poor UX.
- *Restore via `requestAnimationFrame`*: Allows a visible flash of top-position before restore. Synchronous is better.

### Decision 4: Sync only when mode is `split`

**Chosen**: Both scroll handlers check `document.getElementById('panes').dataset.mode === 'split'` and return early otherwise.

This is the simplest guard. No listener attach/detach on mode toggle needed — the handlers are cheap and always registered, just no-ops in other modes.

## Risks / Trade-offs

- **Proportional mismatch on asymmetric content** → Accepted. A short source line that expands to a large rendered block (e.g., a Mermaid diagram) will cause the preview to "jump ahead" relative to the editor. This is inherent to proportional sync and well-understood by users of tools that use this approach. Line-mapped sync is a future enhancement path.

- **Mermaid re-render timing** → `renderPreview()` calls `window.mermaid.run()` asynchronously after setting innerHTML. Mermaid diagrams expand after the synchronous scroll restore, potentially shifting the preview's scrollable height. This could cause a one-time scroll drift after an edit that adds/removes a diagram. Mitigation: the drift only occurs on the render that introduces/removes a diagram, and the user can simply re-scroll. Acceptable for v1.

- **CodeMirror 5 scroll event frequency** → `cm.on('scroll', ...)` fires on every pixel of scroll movement. The sync handler is cheap (two property reads and one write), so no throttling is needed. If profiling shows cost, `requestAnimationFrame` throttling can be added later.

## Open Questions

None blocking implementation.
