## Why

The marketing landing page added in #118 lives in `site/`, but partykit only serves `public/`. The new landing is therefore invisible on production (`livedown.dwmkerr.partykit.dev`) and on local dev — visitors to `/` see the viewer's own empty-state chrome instead. `site/` is an orphan with no deploy pipeline.

## What Changes

- Merge `site/index.html` landing markup, styles, and diagram into `public/index.html` as a single static document.
- Route by URL fragment in-document:
  - `/` (no hash) → render landing (`<main id="landing">`).
  - `/#<doc-key>` → render viewer (`<main id="viewer">`).
  - `hashchange` swaps modes live.
- Defer viewer-only assets (CodeMirror, marked, mermaid, tweetnacl) until viewer init — landing stays light.
- Remove the viewer's own empty-state landing chrome — now dead code.
- Delete `site/` directory.

No CLI, protocol, or share-URL change. Existing `https://livedown.dwmkerr.partykit.dev/#<key>` links continue to work unchanged.

## Capabilities

### New Capabilities
- `landing-page`: defines what the root URL (`/`) serves, how mode is selected from `location.hash`, and what assets each mode loads.

### Modified Capabilities
- none. Existing specs (`docker-usage`, `mermaid-diagram-rendering`, `private-sharing`) are unaffected — mermaid still renders inside the viewer, private sharing still works on hash-routed viewer URLs.

## Impact

- **Code**: `public/index.html` (merge + router + deferred-load shim). `site/` deleted.
- **Build/deploy**: none. `partykit.json` `serve.path = public` unchanged.
- **URLs**: none breaking. Hash-routing already in use.
- **Tests**: integration tests already drive viewer via hash; add one assertion that bare `/` shows landing hero.
- **Performance**: landing first paint improves (no CodeMirror/mermaid load). Viewer first paint unchanged (same deps, deferred fetch happens on hash present).
