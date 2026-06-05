## 1. Stamp source line on rendered blocks

- [ ] 1.1 In `public/index.html`, register a `marked.use({ renderer })` block that overrides `heading`, `paragraph`, `list`, `code`, `blockquote`, `table`, `hr`, and `html` to emit `data-source-line="<n>"` on the outer element.
- [ ] 1.2 Add a small helper that walks `marked.lexer(content)` once and produces a `Map<token, startLine>` so each renderer override can look up its token's start line without re-parsing.
- [ ] 1.3 In the existing mermaid-replacement loop inside `renderPreview()`, copy `data-source-line` from the original `<pre>` to the replacement `<div class="mermaid">`.
- [ ] 1.4 Verify markup by hand on `tests/documents/empty.md` and a sample with a heading + paragraph + list + fenced code: every top-level child of `#preview-inner` carries `data-source-line`.

## 2. Build the line map

- [ ] 2.1 Add `buildLineMap()` that reads every child of `#preview-inner` with a `data-source-line` attribute, returns a sorted array `[{ line, top }]` using `element.offsetTop`.
- [ ] 2.2 Call `buildLineMap()` at the end of `renderPreview()` and cache the result in a module-scope `lineMap` variable.
- [ ] 2.3 After `window.mermaid.run()` resolves (existing `.then` / `.catch` block), call `buildLineMap()` again so post-mermaid offsets are correct.
- [ ] 2.4 Add a `window.addEventListener('resize', …)` that rebuilds the line map (the `top` values change with column width).

## 3. Bidirectional scroll coupling

- [ ] 3.1 Add a module-scope `syncDriver` (one of `null | 'source' | 'preview'`).
- [ ] 3.2 Add a `cm.on('scroll', …)` listener that: bails if `panes.dataset.mode !== 'split'`; bails if `syncDriver === 'preview'`; otherwise sets `syncDriver = 'source'`, computes the target preview `scrollTop` from `cm.lineAtHeight(...)` + `lineMap` interpolation, applies it, then clears `syncDriver` on the next `requestAnimationFrame`.
- [ ] 3.3 Add a `pane-preview.addEventListener('scroll', …)` listener that mirrors 3.2 with the inverse math: interpolate `lineMap` to find a source line from the preview's `scrollTop`, then `cm.scrollTo(null, cm.charCoords({ line, ch: 0 }, 'local').top)`.
- [ ] 3.4 Confirm there is no infinite loop by manual scroll testing in dev (`npm run relay:dev` + `npm start -- share`).

## 4. Re-align on mode change

- [ ] 4.1 In `applyMode()`, after the existing `cm.refresh()` call, when the new mode is `split` perform one alignment pass: if previous mode was `preview`, treat preview as driver and call the preview→source sync routine; if previous mode was `code`, treat source as driver and call the source→preview sync routine.

## 5. Tests

- [ ] 5.1 Add `tests/sync-pane-scrolling.test.ts` that loads `public/index.html` (or a fixture string of the renderer overrides) and asserts: every top-level rendered block carries `data-source-line` for fixture markdown covering heading, paragraph, list, fenced code, blockquote, table, hr, and a mermaid block.
- [ ] 5.2 Add a unit test covering `buildLineMap` returns entries sorted by line and that interpolation of a preview top between two map entries produces a line between them.
- [ ] 5.3 Run `npm run lint && npm run build && npm test` — all must pass before opening the PR (per `CLAUDE.md`).

## 6. Browser end-to-end check (manual)

- [ ] 6.1 With `npm start -- share ./tests/documents/empty.md`, paste in a longer markdown file (≥ 3 viewports), open the viewer, switch to `split`, and confirm: scrolling the source moves the preview, scrolling the preview moves the source, mode-toggling code→split and preview→split keeps alignment, switching to code or preview disables coupling.
- [ ] 6.2 Capture before/after screenshots of `split` mode showing matching scroll positions and attach to the PR (per `CLAUDE.md` "UI changes require before/after screenshots").

## 7. Docs

- [ ] 7.1 Update `docs/design.md` "Mode semantics" section to add one line noting that `split` mode keeps the panes scroll-synchronised.
- [ ] 7.2 Confirm no update is needed to `docs/architecture.md` (no protocol or lifecycle change) or `README.md` "How It Works".
