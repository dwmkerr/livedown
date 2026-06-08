## Context

The viewer in `public/index.html` runs Split mode by default: a dark CodeMirror 5 source pane (`#pane-source`) on the left, a rendered HTML preview (`#pane-preview` → `#preview-inner`, output of `marked.parse`) on the right, with a draggable `#divider`. Each pane has its own scrollbar today:

- `#pane-source` is `overflow: hidden` and hosts a CodeMirror instance; CodeMirror provides scroll via `CodeMirror-scroll`.
- `#pane-preview` is `overflow-y: auto`.

There is no link between the two scroll positions. For documents that fit the viewport this is fine; for anything longer (and most of the documents people share are spec-or-design-shaped), the reader constantly re-aligns by hand.

Issue #114 calls out the VS Code markdown preview as the model. VS Code uses a "source-line ↔ rendered-block" mapping: every top-level rendered block remembers the source line it came from, and scroll on either side is translated to a target on the other side via linear interpolation between the two nearest annotated lines.

Constraints worth naming up front:

- **No build step.** `public/index.html` is shipped as-is by partykit. No bundler, no TypeScript, no JSX. Anything we add is plain inline ES5/ES2017 inside the existing IIFE.
- **`marked` is already loaded** from a CDN. We can configure it but cannot replace it without expanding the dependency surface — see Decision 2.
- **CodeMirror 5** is in use (5.65.17 from cdnjs). Its API gives us `getScrollInfo()`, `scrollTo(x, y)`, `lineAtHeight(top, "local")`, `heightAtLine(n, "local")`, and a `scroll` event on the instance. That is exactly what we need.
- **Mode is toggled by `#panes[data-mode=...]`** which CSS-hides the inactive pane. Sync must check the mode at scroll time, not just at init.
- **Remote edits arrive via `update` messages** that go through `cm.setValue`, which fires `change` with `origin === 'setValue'`. These re-paint the preview but must not move the user's scroll. The push handler already short-circuits `setValue` changes — we just have to make sure sync runs off of *scroll* events, not *content* events.

The visible scope is one file: `public/index.html`. There is no test harness for the viewer beyond Jest unit tests of separable Node-side modules; viewer behaviour is verified manually with the Playwright procedure in `CLAUDE.md`. We can still extract the pure mapping function into an importable module if it makes sense, but the wiring is in `public/index.html`.

## Goals / Non-Goals

**Goals:**

- In Split mode, scrolling the source pane drives the preview pane to the corresponding rendered block, and vice-versa, with no visible lag for human-speed scrolling.
- Mapping is anchored to source line numbers stamped onto rendered blocks at parse time, so it survives re-renders (every `update` message re-parses the document).
- Sync is robust to feedback loops: a programmatic scroll on pane B (triggered by a scroll on pane A) must not bounce back and re-scroll pane A.
- Sync is inert in `code` and `preview` modes; it costs nothing when only one pane is visible.
- Remote `update` messages never move the local user's scroll position. The user's scroll is theirs.
- The implementation lives entirely in `public/index.html` and adds zero new runtime dependencies.

**Non-Goals:**

- **No shared scroll across clients.** Each viewer's scroll is local. We do not broadcast scroll position over the relay. (That would be a different feature, and would need protocol design.)
- **No cursor-position sync.** Clicking a heading in the preview does not move the CodeMirror cursor. Out of scope here.
- **No new UI affordances.** No toggle, no preference, no keybinding. The behaviour is on whenever Split mode is on.
- **No animated easing.** VS Code does plain `scrollTo`; so do we. Smooth-scroll easing is a separate polish task and can regress feedback-loop guards if done carelessly.
- **No mapping for every inline span.** Granularity is top-level block (paragraph, heading, list, code block, table, blockquote, hr). VS Code does the same.
- **No support for nested iframes or mermaid SVG internal scroll.** Mermaid renders into a `.mermaid` block; that block participates in the line map like any other element, but we do not try to align inside it.

## Decisions

### Decision 1: Mapping anchor is source line → rendered block top

Each top-level rendered block carries the source line of its first token as `data-source-line="<n>"`. To scroll the preview to source line `L`:

1. Find the largest annotated line `Lo ≤ L` and the smallest annotated line `Lh ≥ L` (the "low" and "high" anchors that bracket `L`).
2. Read their `offsetTop` relative to `#pane-preview`.
3. Linearly interpolate: `target = topLo + (topLh - topLo) * (L - Lo) / max(1, Lh - Lo)`.
4. `pane.scrollTop = target - <some small top padding>` to land the block near the top of the viewport rather than glued to the edge.

To scroll the source to a preview position `Y` (the current `scrollTop` of `#pane-preview`):

1. Walk annotated blocks to find the two whose `offsetTop` brackets `Y`.
2. Interpolate the corresponding source lines.
3. Use `cm.scrollTo(0, cm.heightAtLine(targetLine, "local") - cm.getScrollInfo().clientHeight * 0.25)` to put the target line roughly in the upper quarter of the editor — matching where the eye is when the user looks at a paragraph in the preview.

This is the algorithm VS Code uses. It is robust because it never depends on character-level mapping, only on top-level block boundaries that `marked` can hand us directly.

**Alternative considered: heading-anchor mapping only.** Cheaper but jumps coarsely between headings; users notice the snap. Rejected — the issue points at VS Code as the model and VS Code does the fine-grained version.

**Alternative considered: same-percentage scroll (`pane.scrollTop / pane.scrollHeight` is equal on both sides).** Trivial but wrong as soon as the panes have meaningfully different total heights (rendered HTML is almost always much taller than the source code). Rejected on first principles.

### Decision 2: Annotate blocks via a marked tokenizer/renderer hook, not post-parse DOM walking

`marked` lets us provide a custom renderer that wraps each token's render call. Two viable paths:

- **(a) Custom renderer extension.** Override the renderers for `heading`, `paragraph`, `list`, `blockquote`, `code`, `table`, `hr`. Each top-level renderer receives a token object that includes `token.lineNumber` when `marked` is run with `{ ...defaults, gfm: true }` and we use `marked.lexer` + `marked.parser` to keep line metadata. We use `token.raw`'s position (via a small wrapper that tracks line counts) and prepend `data-source-line="<n>"` to the opening tag.
- **(b) Walk `#preview-inner` after `marked.parse` and infer line numbers by matching block text to lines in the source.** Brittle (duplicate text, list re-indentation, code blocks containing markdown) and slower. Rejected.

We go with **(a)**, but to keep the change small we avoid switching from `marked.parse(src)` to the lexer/parser pair. Instead we install a `marked.use({ walkTokens })` hook that walks every token, computes a running line counter by accumulating `token.raw.split('\n').length - 1`, and stamps the count onto `token` as `token._line`. We then override block renderers (`heading`, `paragraph`, `list`, `code`, `blockquote`, `table`, `hr`) to inject the attribute. This stays in keeping with `marked`'s public API and does not require touching the parser.

`marked.use` is idempotent enough that calling it once at viewer init is safe.

**Risk:** `walkTokens` is called depth-first; nested tokens get their parent's stamp re-applied. Mitigation: only top-level (depth 0) tokens contribute to the counter, and only top-level renderer overrides emit the attribute. Inline tokens are untouched.

### Decision 3: Active-pane lock prevents feedback loops

Naïve sync ping-pongs: pane A's scroll → set pane B's scrollTop → pane B fires `scroll` → set pane A's scrollTop → loop. Two complementary guards:

1. **`scrollingPane` token.** When a user scroll handler on pane A fires, set `scrollingPane = 'A'`. The handler on pane B early-returns when `scrollingPane === 'A'`. We clear `scrollingPane` on the next animation frame after the programmatic scroll completes.
2. **`rafScheduled` flag per pane.** Within a frame, only the latest scroll target is applied. This bounds CPU and also collapses bursty wheel events into one mapping lookup per frame.

The combination is standard for scroll-linked UIs and is what VS Code itself uses (see `markdown-language-features/src/preview/scrolling.ts` in the VS Code repo for prior art).

**Alternative considered: detect "programmatic" scroll by storing the last-set scrollTop and comparing.** Fragile when CSS or zoom round-trips the value. Rejected.

### Decision 4: Sync only in Split mode; bail in `code` and `preview`

Both event handlers check `#panes[data-mode]` at the top and bail unless the value is `split` (or unset, which currently means split). This is cheaper than tearing handlers down on mode change and avoids a class of subtle bugs where a stale handler fires after the mode toggle.

### Decision 5: Remote `update` re-renders preserve scroll

`renderPreview` rebuilds `#preview-inner.innerHTML` on every `update` message. After replacing the HTML, the browser resets `#pane-preview.scrollTop` to whatever the layout demands — usually 0 if the document grew. We record `pane-preview.scrollTop` before swapping innerHTML and restore it after. This is independent of sync (the user's scroll position is sticky regardless), but it's the natural moment to also re-run the source→preview mapping if the source has not moved, so the panes stay aligned even though the rendered heights changed.

CodeMirror's `setValue` already preserves scroll position by default for short documents but resets for large ones; the existing code does not normalise this, and we do not change that behaviour in this scope.

### Decision 6: Mapping function extracted; wiring inline

The pure mapping (given a list of `{ line, top }` anchors and a target line or top, return the target top or line) is small and testable. We extract it to `src/scroll-map.ts` (a new file) and Jest-test it. The DOM wiring (event handlers, raf scheduling, mode check, marked hooks) stays inline in `public/index.html` because that file is not bundled — importing from `src/` would require either a build step or duplicating the function. We duplicate it: the canonical version lives in `src/scroll-map.ts` with tests; the inline copy in `public/index.html` is a verbatim transcription, with a comment pointing at the source of truth. A lint test asserts the two stay in sync (a simple `npm test` check that compares the function bodies as strings).

**Alternative considered: introduce a bundler so `public/index.html` can `import` from `src/`.** Out of scope for this change — a bundler is a much bigger decision and the rest of the viewer doesn't need one yet.

## Risks / Trade-offs

- **Risk: mapping is wrong for tokens `marked` doesn't expose cleanly (HTML blocks, mermaid).** → Mitigation: the walker stamps every top-level token it sees; unrecognised renderers fall back to passing the attribute through. Worst case the anchor density drops near a mermaid block and the alignment jumps coarsely across it. Acceptable.
- **Risk: a future move to `marked@>=12`'s new tokenizer API breaks the walker.** → Mitigation: pin the inline `data-source-line` shape in `src/scroll-map.ts` tests so a marked upgrade can refactor the stamper without breaking the consumer. Document the marked-version constraint in a comment near the hook.
- **Risk: `requestAnimationFrame`-throttled handlers feel laggy on trackpad fling.** → Mitigation: one frame of lag is invisible at 60Hz. If we ever see complaints we can switch to handling `wheel` directly, but VS Code uses rAF and nobody complains.
- **Risk: very long documents (10k+ lines) make linear anchor lookup slow.** → Mitigation: anchors are top-level blocks, typically O(hundreds) even for big specs. Linear scan is fine. If profiling ever shows otherwise, the anchor list is sorted by line so binary search is a five-line change.
- **Trade-off: no preference toggle.** Users who actively dislike sync-scroll cannot opt out. The issue explicitly asks for VS Code parity and VS Code makes this the default with a `markdown.preview.scrollPreviewWithEditor` setting. We accept the lack of a setting for now; if it turns out to bother people we add a preference in a follow-up.

## Migration Plan

No data, no schema, no protocol changes. Pure UI. Ship in one PR. Rollback is `git revert`.

Verification:
1. Local: run the Playwright procedure in `CLAUDE.md` against `tests/documents/empty.md` (sync is a no-op when content is empty — still must not error) and against a long markdown fixture we add at `tests/documents/long.md`.
2. Manually scroll source → confirm preview tracks; scroll preview → confirm source tracks; toggle to `code` → confirm scrolling does not affect preview; toggle to `preview` → confirm scrolling does not error.
3. Trigger a remote edit while scrolled half-way down → confirm scroll position is preserved.

## Open Questions

- Should we land the `tests/documents/long.md` fixture in this change or as a follow-up? Leaning yes, in this change, because the Playwright procedure in `CLAUDE.md` needs *something* to scroll. Decision deferred to implementation.
