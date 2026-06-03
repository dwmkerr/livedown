## Context

`public/index.html` is the viewer SPA served by partykit at every path (single-route static). `site/index.html` is a self-contained marketing landing with a system-diagram SVG centerpiece (PR #118). No build step or deploy target publishes `site/`. The share URL shape is `https://<host>/#<doc-key>` (see `src/cli.ts:38`), so the URL fragment is the natural mode signal.

The viewer currently has its own minimal landing chrome that runs when no hash is present. That chrome is what users see today on `/` — not the new diagram landing.

## Goals / Non-Goals

**Goals:**
- One static artifact (`public/index.html`) serves both landing (`/`) and viewer (`/#<key>`).
- Bare `/` renders the new diagram landing.
- Viewer behavior is byte-for-byte identical to today for any URL containing a hash.
- No change to share URL shape, CLI, or partykit config.
- Landing first paint does not pay viewer asset cost (CodeMirror, marked, mermaid, tweetnacl, codemirror markdown mode).
- `hashchange` switches modes in-place — no full reload required.

**Non-Goals:**
- Separate landing deploy (Pages, Workers Sites, second domain).
- Server-side routing in `src/party/livedown.ts`.
- Path-based viewer URLs (`/r/<id>`, `/?k=<id>`).
- Redesign of either landing or viewer content.
- Lazy-loading inside the viewer itself (deps stay inline once viewer mode is chosen).

## Decisions

### 1. Routing key: `location.hash`
Hash is already the doc-key carrier. Server cannot see it. Decision: route entirely in client. Top-of-body inline script reads `location.hash` synchronously before any deferred code runs, sets `document.body.dataset.mode` to `landing` or `viewer`, and CSS hides the inactive `<main>` via `[hidden]` / attribute selector. Zero FOUC.

Rejected: query-string routing (`/?k=`) — leaks key to server logs, breaks existing shares.
Rejected: path routing (`/r/<id>`) — needs Worker `onRequest` logic and breaks all existing shares.

### 2. Single file, two `<main>` blocks
Both landing and viewer markup live in `public/index.html`. Each wrapped in its own `<main id="landing">` / `<main id="viewer">`. CSS rules under each id-scope prevent style bleed. Shared CSS vars (`--ld-*` palette, fonts) declared once in `:root`.

Rejected: two separate HTML files with a redirect — adds a round-trip on landing→viewer transition, and partykit's static layer doesn't do path routing without a Worker.

### 3. Deferred viewer assets via dynamic injection
Viewer-only `<script src="…">` tags (CodeMirror core, markdown mode, marked, mermaid module, tweetnacl) move out of the static `<head>` into a `loadViewer()` function that injects them in order on first transition to viewer mode. Fonts and base CSS stay in `<head>` (both modes use them).

`loadViewer()` is idempotent and returns a promise that resolves when all viewer deps are ready. Viewer init waits on this promise.

Rejected: `<link rel="preload">` for landing — still downloads on landing-only sessions; doesn't save bytes.

### 4. `hashchange` listener
`window.addEventListener('hashchange', …)` re-evaluates mode. Landing→viewer triggers `loadViewer()` then runs viewer init. Viewer→landing (hash cleared) hides viewer markup and shows landing; viewer state is left in memory (no teardown) since this transition is rare and re-entering the same room should be instant.

### 5. Remove the viewer's empty-state landing
The viewer's existing "no doc loaded" chrome is now unreachable (hash-present ⇒ viewer; hash-absent ⇒ landing). Delete that markup and its associated JS branches.

### 6. Delete `site/`
After merge, `site/index.html` is redundant. Remove the directory.

## Risks / Trade-offs

- **Style bleed.** Both files use the `--ld-*` palette but with slightly different values (e.g., `--ld-bg` 0x17171f vs 0x1e1e2e). Mitigation: id-scope every diagram-specific rule under `#landing`, every viewer-specific rule under `#viewer`. CSS audit during implementation.
- **Bundle size for `/`.** Landing+viewer markup co-exist in one HTML file. Adds ~25KB of landing HTML/CSS to viewer page load. Acceptable: that's the diagram SVG + landing CSS, gzipped small, and viewer users open the file once per session.
- **Deferred loader complexity.** `loadViewer()` introduces a small async dependency-loading layer. Risk of double-load or out-of-order init. Mitigation: single `Promise` cached on first call; serial script tag injection with `onload` chains.
- **Hash-change UX.** Switching from viewer back to landing leaves viewer DOM in memory. Acceptable — it's a rare path (user manually clears hash).
- **SEO.** Landing is now at `/` (good for SEO). No change in robots/meta needed beyond what `site/index.html` already had.
- **Integration tests.** Tests that open the bare relay URL expecting the old empty viewer will now see landing. Audit `tests/integration/` and update assertions; share-URL flows (hash present) are unaffected.
