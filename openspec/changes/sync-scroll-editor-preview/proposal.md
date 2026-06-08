## Why

In Split mode the viewer shows the markdown source on the left and the rendered preview on the right, but the two panes scroll independently. As soon as a document is longer than the viewport, the reader has to manually re-align the two views every time they jump around — a known papercut from VS Code's markdown preview that VS Code itself solved by synchronising scroll between the source and the rendered output. Issue #114 asks for the same behaviour.

Synchronised scrolling makes the Split mode actually usable for long documents (specs, designs, READMEs — exactly the high-trust documents livedown targets) and is a pure UI affordance: it does not touch the protocol, the relay, signing, or the watcher.

## What Changes

- Split mode SHALL keep the source pane (`#pane-source`, CodeMirror) and the preview pane (`#pane-preview`) approximately aligned: scrolling either pane drives the other to the corresponding position.
- Alignment is driven by **source line number ↔ rendered block** mapping, mirroring VS Code's markdown preview model. Each top-level block produced by `marked` is annotated with the source line it came from; the viewer interpolates between annotated blocks to pick a scroll target.
- A guard against feedback loops: a scroll triggered programmatically by sync logic MUST NOT re-trigger sync on the opposite pane in the same frame.
- The feature SHALL be inert outside Split mode (in `code` and `preview` modes only one pane is visible, so there is nothing to sync).
- Remote `update` messages SHALL NOT change the user's scroll position — sync continues to react to the local user's scrolling, not to incoming content edits.
- No new chrome, no new toggle, no new keybinding. The behaviour is on by default in Split mode. (A future preference can be layered on if it turns out to be controversial; the issue explicitly asks for the VS Code default.)

## Capabilities

### New Capabilities

- `viewer-scroll-sync`: source ↔ preview scroll synchronisation in the browser viewer's Split mode, including the line-to-block mapping, the active-pane lock that prevents feedback, and the no-op behaviour in non-Split modes.

### Modified Capabilities

None. No existing spec in `openspec/specs/` covers Split-mode behaviour, scroll, or pane layout, so this is purely additive.

## Impact

- **Code:** `public/index.html` only. Touch points: the `renderPreview` function (annotate rendered blocks with source line numbers via a `marked` renderer extension), a new `setupScrollSync()` initialiser wired up alongside the existing CodeMirror setup, and a small amount of CSS only if needed for measuring (no visual changes).
- **Protocol / relay / watcher / CLI:** unchanged. No new message types, no new signed payloads. `docs/architecture.md` does not need an update under its own "what must stay in sync" rules — none of the listed triggers (protocol, message types, roles, relay behavior, CLI output, new journeys) apply.
- **Design doc:** `docs/design.md` describes mode semantics (`code` / `split` / `preview`) but says nothing about scroll behaviour today. The Split-mode entry should gain a single line noting that the panes scroll in lockstep, so the doc and the shipped behaviour stay aligned (per the repo's design-doc-is-source-of-truth rule).
- **Dependencies:** none. `marked` is already loaded; CodeMirror 5 already exposes the scroll APIs we need (`getScrollInfo`, `scrollTo`, `lineAtHeight`, `heightAtLine`, and the `scroll` event).
- **Tests:** add a Jest unit test for the pure line-to-block mapping (input: an annotated DOM-ish fixture, output: target scrollTop). Full DOM scroll behaviour is verified manually via the Playwright procedure in `CLAUDE.md` plus a new step in `tasks.md`.
- **Performance:** scroll handlers throttle to `requestAnimationFrame` so they cost at most one mapping lookup per frame on the active pane.
