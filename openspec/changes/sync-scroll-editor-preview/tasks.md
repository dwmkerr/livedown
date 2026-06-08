## 1. Pure mapping module

- [ ] 1.1 Create `src/scroll-map.ts` exporting `lineToScrollTop(anchors, targetLine)` and `scrollTopToLine(anchors, scrollTop)`. `anchors` is `Array<{line: number, top: number}>` sorted ascending by line.
- [ ] 1.2 Implement linear interpolation between bracketing anchors per Decision 1, including the edge cases enumerated in the spec (target before first anchor → 0/first line, target past last anchor → last anchor's top/line, empty list → 0/1, exact match → exact value).
- [ ] 1.3 Add `src/scroll-map.test.ts` covering every scenario listed under "Source line to preview scroll mapping" and "Preview scroll to source line mapping" in the spec.
- [ ] 1.4 Run `npm test` and confirm new tests pass.

## 2. Annotate rendered blocks with source lines

- [ ] 2.1 In `public/index.html`, install a `marked.use({ walkTokens })` hook at viewer init (alongside the existing `mermaid.initialize`). The hook MUST run before the first `renderPreview` call.
- [ ] 2.2 In `walkTokens`, maintain a running source-line counter so each top-level token gets stamped with `token._line = <1-based line of its first source character>`. Only increment from `token.raw` at depth 0 — nested tokens inherit the parent's stamp but do not emit it.
- [ ] 2.3 Provide a custom `renderer` for `heading`, `paragraph`, `list`, `blockquote`, `code`, `table`, `hr` that prepends `data-source-line="<token._line>"` to the opening tag of each top-level block. Inline renderers are not overridden.
- [ ] 2.4 Confirm by manual inspection (DevTools) that a fixture document yields one `data-source-line` per top-level block and none on inline children.

## 3. Inline scroll-sync wiring in the viewer

- [ ] 3.1 Add an inline `scrollMap()` helper to `public/index.html` that reads `#preview-inner`'s annotated children and returns the `anchors` array (sorted by line). Cache the result and invalidate it whenever `renderPreview` runs.
- [ ] 3.2 Copy the bodies of `lineToScrollTop` / `scrollTopToLine` from `src/scroll-map.ts` into `public/index.html`'s IIFE with a comment pointing at the source of truth. Add a Jest test (`tests/scroll-map-inline-sync.test.ts`) that reads both files and asserts the two function bodies are byte-identical (whitespace-normalised).
- [ ] 3.3 Register a `cm.on('scroll', ...)` handler that: (a) bails if `#panes` is not in Split mode, (b) bails if `scrollingPane === 'preview'`, (c) sets `scrollingPane = 'source'`, (d) computes the top visible source line via `cm.lineAtHeight(cm.getScrollInfo().top, "local")`, (e) computes `targetTop` via `lineToScrollTop`, (f) schedules `#pane-preview.scrollTop = targetTop` on the next `requestAnimationFrame`, (g) clears `scrollingPane` after the frame.
- [ ] 3.4 Register the inverse `#pane-preview` scroll handler with the symmetric structure: bail outside Split mode, bail if `scrollingPane === 'source'`, set `scrollingPane = 'preview'`, compute `targetLine` via `scrollTopToLine`, call `cm.scrollTo(0, cm.heightAtLine(targetLine, "local") - cm.getScrollInfo().clientHeight * 0.25)` on the next rAF, clear `scrollingPane`.
- [ ] 3.5 Collapse bursty events: per-pane `rafScheduled` flag so only the latest target in a frame is applied.

## 4. Preserve preview scroll across remote updates

- [ ] 4.1 In `renderPreview`, capture `#pane-preview.scrollTop` before swapping `innerHTML`, then restore it after — clamping to `scrollHeight - clientHeight` to avoid overshoot when content shortens.
- [ ] 4.2 After restore, invalidate the cached anchors so the next sync event reads the freshly-annotated DOM.

## 5. Mode and event hygiene

- [ ] 5.1 Verify in DevTools that switching to `code` mode and scrolling the source does not change `#pane-preview.scrollTop`.
- [ ] 5.2 Verify in DevTools that switching to `preview` mode and scrolling the preview does not change CodeMirror's scroll.
- [ ] 5.3 Verify the `code → split → scroll` transition resumes sync without a reload.

## 6. Test documents and Playwright verification

- [ ] 6.1 Add `tests/documents/long.md`: a markdown fixture at least ~5x viewport height with a mix of headings, paragraphs, lists, code fences, a table, and one mermaid block.
- [ ] 6.2 Run the Playwright procedure in `CLAUDE.md` against `tests/documents/empty.md` and confirm: viewer loads in Split mode, no console errors, scrolling either pane on an empty document is a safe no-op.
- [ ] 6.3 Run the Playwright procedure against `tests/documents/long.md` and confirm: scrolling source moves preview to the matching block; scrolling preview moves source to the matching line; switching modes behaves per requirements.

## 7. Docs and design

- [ ] 7.1 Update `docs/design.md` "Mode semantics" — add a single line to the `split` entry noting that source and preview scroll in lockstep (line-anchored, VS Code parity).
- [ ] 7.2 Re-check `docs/architecture.md`'s "what must stay in sync" rules and confirm no update is needed (no protocol, message-type, role, relay-behaviour, CLI-output, or new-journey change). Leave a one-line note in the PR description.

## 8. CI gate

- [ ] 8.1 Run `npm run lint && npm run build && npm test` locally. All three MUST pass before opening / updating the PR (per `CLAUDE.md`).
- [ ] 8.2 Include before/after viewer screenshots in the PR (per `CLAUDE.md`'s UI-change rule).
