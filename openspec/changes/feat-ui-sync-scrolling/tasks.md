## 1. Scroll Sync Core

- [ ] 1.1 Add `let isSyncing = false` flag in the viewer's JS scope (near other state variables in `public/index.html`)
- [ ] 1.2 Implement `syncEditorToPreview()`: reads `cm.getScrollInfo()`, computes fraction, sets `previewPane.scrollTop`, guarded by `isSyncing` and zero-denominator check
- [ ] 1.3 Implement `syncPreviewToEditor()`: reads `previewPane.scrollTop` / `scrollHeight` / `clientHeight`, computes fraction, calls `cm.scrollTo()`, guarded by `isSyncing` and zero-denominator check
- [ ] 1.4 Register `cm.on('scroll', ...)` handler that calls `syncEditorToPreview()` only when `panes.dataset.mode === 'split'`
- [ ] 1.5 Register `previewPane.addEventListener('scroll', ...)` handler that calls `syncPreviewToEditor()` only when `panes.dataset.mode === 'split'`

## 2. Feedback Loop Prevention

- [ ] 2.1 In both sync functions, set `isSyncing = true` before the programmatic scroll call and reset via `Promise.resolve().then(() => { isSyncing = false; })` after
- [ ] 2.2 At the top of each scroll handler, return early if `isSyncing` is `true`

## 3. Preview Scroll Preservation on Re-render

- [ ] 3.1 In `renderPreview()` (the function that replaces `#preview-inner` innerHTML), capture `const savedScrollTop = previewPane.scrollTop` before the innerHTML assignment
- [ ] 3.2 Immediately after the innerHTML assignment (and before any async mermaid call), restore `previewPane.scrollTop = savedScrollTop`

## 4. Verification

- [ ] 4.1 Run `npm run lint && npm run build && npm test` — all must pass
- [ ] 4.2 Manual split-mode test: scroll editor → verify preview tracks proportionally; scroll preview → verify editor tracks proportionally
- [ ] 4.3 Manual typing test: type in split mode with preview scrolled to mid-document — verify preview does not jump to top after debounce
- [ ] 4.4 Manual mode-switch test: switch to `code` mode, scroll editor, switch back to `split` — verify no errors
- [ ] 4.5 Manual short-document test: use a document short enough to fit in the viewport — verify no errors and no unexpected scroll behaviour
