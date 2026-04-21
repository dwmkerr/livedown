## Context

The livedown web viewer (`public/index.html`) renders markdown content using marked.js. Fenced code blocks tagged with `mermaid` are passed through as `<pre><code class="language-mermaid">` elements, which display as raw text. GitHub and most modern markdown environments render these as diagrams. Adding Mermaid v11 as a CDN dependency and post-processing the preview DOM after each render will close this gap with no changes to the relay, CLI, or data protocol.

## Goals / Non-Goals

**Goals:**
- Render ` ```mermaid ` fenced blocks as SVG diagrams in the preview pane
- Trigger re-render on every content update (same cadence as `renderPreview()`)
- Show a visible but non-disruptive error when a diagram fails to parse
- Use a pinned CDN URL with a major-version lock (e.g., `mermaid@11`) to avoid surprise breakage

**Non-Goals:**
- Mermaid syntax highlighting in the CodeMirror source editor
- Offline/bundled Mermaid (CDN-only for this change)
- Interactive diagram pan/zoom
- CSP header changes — the viewer is a static HTML file served from PartyKit; no server-side CSP headers to configure

## Decisions

### Decision: Use ESM CDN import, not UMD script tag

Mermaid v10+ ships an ESM build (`mermaid.esm.min.mjs`) as the primary distribution; the legacy UMD build is larger and less maintained. The viewer already uses inline ES module patterns. Loading via `<script type="module">` keeps the import self-contained.

Alternatives considered:
- UMD `<script src="...">`: works but loads synchronously and the bundle is larger
- Bundle locally: out of scope; adds a build step for a pure-HTML file

### Decision: Post-process the marked.js output instead of using a marked extension

marked.js renders ` ```mermaid ` as `<pre><code class="language-mermaid">`. Post-processing (find those elements, replace with `<div class="mermaid">`, call `mermaid.run()`) requires zero changes to how marked is configured and is robust to marked version changes.

Alternatives considered:
- marked renderer extension: more integrated but tightly couples Mermaid to the marked pipeline; the post-process approach is simpler and equally correct.

### Decision: Pin to `mermaid@11` major version

The latest stable is 11.x. Pinning to a major version on jsDelivr (`mermaid@11`) gives automatic patch/minor updates while avoiding a major-version breaking change landing silently.

### Decision: Error handling via `suppressErrors: false` with a visible fallback

When `mermaid.run()` encounters a syntax error it will throw. Wrapping the call in `try/catch` and rendering a styled error block (with the raw diagram text preserved) gives the author immediate feedback without crashing the viewer.

## Risks / Trade-offs

- **CDN availability**: If jsDelivr is unavailable, diagrams silently fall back to raw text (the `<pre><code>` was already replaced, so the element is a no-op `<div class="mermaid">`). Mitigation: use a SRI hash once the version is pinned to an exact release.
- **SVG injection**: Mermaid generates SVG from the diagram source. Content originates from the authenticated sharer (verified via Ed25519 signature before writing to disk), so the trust boundary is the same as the markdown body itself. Arbitrary viewer-supplied content never reaches Mermaid.
- **Performance on large documents**: `mermaid.run()` is called on every `renderPreview()` invocation (debounced at 400 ms). For documents with many diagrams this may be slow. Mitigation: `suppressErrors: true` avoids expensive error-path work; future optimization could diff the diagrams and only re-render changed ones.

## Open Questions

- Should a SRI hash be added to lock the exact Mermaid version? (nice-to-have, can be done in a follow-up once the pinned version is stable)
- Should the Mermaid theme be set to `neutral` or `default` to match the light preview pane? (implementation detail, not spec-blocking)
