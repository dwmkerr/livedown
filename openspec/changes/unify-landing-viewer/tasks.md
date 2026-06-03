## 1. Merge landing into public/index.html

- [x] 1.1 Replace inner contents of the existing `<div id="landing">` block with the diagram-centric landing markup from `site/index.html`.
- [x] 1.2 Replace the existing `#landing`-scoped CSS rules with the landing CSS from `site/index.html`, prefixed under `#landing`. Redeclare landing palette vars inside `#landing { ... }` to avoid bleed into the viewer.
- [x] 1.3 Copy landing scripts (npm version + GH star + copy button + diagram scaler) into `initLandingUI()`. Keep existing IDs (`nav-version`, `gh-count`, `copy-cmd`).
- [x] 1.4 Add `window.addEventListener('hashchange', () => location.reload())` so address-bar hash edits switch modes.

## 2. Remove orphan

- [x] 2.1 Delete the `site/` directory.

## 3. Verify locally

- [x] 3.1 Restart `npm run relay:dev`. Confirm `http://localhost:1999/` shows the diagram landing.
- [x] 3.2 Confirm `http://localhost:1999/#test123` shows the viewer (room `test123`), no landing visible.
- [x] 3.3 Run `livedown share` against a test markdown file end-to-end; share URL still works. Verified: `node dist/cli.js share --dev tests/documents/empty.md` → viewer at `http://localhost:1999/#08e516/empty.md` rendered live content in split view, file pill green, lock pill shown.

## 4. Docs (required by CLAUDE.md)

- [ ] 4.1 Update `docs/design.md` landing section to reference the diagram landing as canonical.
- [ ] 4.2 Round-trip the design back to Claude Design canvas; export a new `design/design-bundle-N.zip` per CLAUDE.md rules.
- [ ] 4.3 Update `README.md` "How It Works" if its landing description changed.

## 5. Tests

- [x] 5.1 Audit `tests/integration/` for tests that hit bare relay URL with no hash; only `share-and-view.test.ts` exists and it asserts against `https://livedown.dwmkerr.partykit.dev/#<doc>` (hash always present). No change needed.
- [x] 5.2 Add a unit test (`tests/landing.test.ts`) asserting `public/index.html` contains the diagram caption ("3 humans · 2 agents · 1 file"), the diagram canvas IDs, the viewer chrome, and the hash router. Runs under default `npm test`.

## 6. Deferred (follow-up changes)

- [ ] 6.1 Move viewer assets (CodeMirror, marked, mermaid, tweetnacl) behind a hash-gated `loadViewer()` so landing-only sessions skip them. Requires refactoring the top-level CodeMirror init into an async path.
- [ ] 6.2 Replace `hashchange → reload` with in-page mode swap once viewer init is async-safe.
- [ ] 6.3 Decide whether to restore a "Join a room" CTA on the new landing (the previous landing had `nav-join` and `hero-join` triggers; the diagram landing does not). If yes, must round-trip through Claude Design first.
