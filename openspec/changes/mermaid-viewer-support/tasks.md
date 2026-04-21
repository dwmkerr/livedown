## 1. Load Mermaid via CDN

- [ ] 1.1 Add `<script type="module">` tag in `public/index.html` `<head>` that imports `mermaid` from `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs` and calls `mermaid.initialize({ startOnLoad: false })`
- [ ] 1.2 Expose the `mermaid` instance to the rest of the inline script (e.g., assign to a module-scoped variable or `window.mermaid`)

## 2. Post-process Preview DOM

- [ ] 2.1 After `marked.parse()` sets `preview-inner.innerHTML`, query for all `pre > code.language-mermaid` elements produced by marked.js
- [ ] 2.2 For each matching element, replace the parent `<pre>` with a `<div class="mermaid">` containing the raw diagram source text
- [ ] 2.3 Call `mermaid.run({ querySelector: '.mermaid' })` wrapped in `try/catch` after the DOM replacement

## 3. Error Handling

- [ ] 3.1 In the `catch` block, iterate over any remaining `<div class="mermaid">` elements that were not replaced by an SVG and render them as styled error boxes showing the raw source
- [ ] 3.2 Add CSS rule for a `.mermaid-error` class (red-tinted box, monospace font, preserves whitespace)

## 4. Styling

- [ ] 4.1 Add CSS to `#preview-inner` scope ensuring Mermaid-generated SVGs are `display: block`, `max-width: 100%`, and centered
- [ ] 4.2 Verify diagrams render correctly at both narrow (mobile) and wide (desktop) preview pane widths

## 5. Testing

- [ ] 5.1 Add a test document `tests/documents/mermaid.md` containing at least one valid flowchart and one valid sequence diagram
- [ ] 5.2 Manual Playwright test: share `mermaid.md`, open viewer, confirm diagrams render as SVG (not raw text)
- [ ] 5.3 Manual Playwright test: add invalid mermaid syntax, confirm error box appears and valid diagrams still render
- [ ] 5.4 Manual Playwright test: edit a mermaid diagram live and confirm it re-renders after the debounce
