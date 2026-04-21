## Why

Mermaid diagrams in markdown files render as plain fenced code blocks in the livedown web viewer, whereas GitHub's markdown preview renders them as actual diagrams. Users sharing markdown files that contain Mermaid diagrams get a degraded experience that does not match what they see in GitHub or other modern markdown viewers.

## What Changes

- Load the Mermaid library via CDN (`https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs`) in `public/index.html`
- After each call to `renderPreview()`, detect any `<pre><code class="language-mermaid">` blocks produced by marked.js and replace them with `<div class="mermaid">` containers, then call `mermaid.run()` to render them as SVGs
- Add CSS to `public/index.html` to display Mermaid SVGs correctly within the preview pane and to show a visible error state when a diagram fails to parse
- No changes to the relay, CLI, watcher, or data protocol — this is a pure browser-side rendering enhancement

## Capabilities

### New Capabilities

- `mermaid-diagram-rendering`: Browser viewer detects fenced ```mermaid code blocks in the rendered HTML and renders them as Mermaid SVG diagrams using the Mermaid v11 library loaded via CDN

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `public/index.html`: add Mermaid CDN script tag, post-process preview DOM after each `renderPreview()` call, add CSS for Mermaid output and error state
- No changes to `src/`, relay, or protocol
- New CDN dependency: `cdn.jsdelivr.net/npm/mermaid@11`
- CSP considerations: Mermaid renders SVG inline; existing inline-script and CDN allowances already cover this
