## Why

In split mode, the editor and preview panes scroll independently, forcing the user to manually find their position in both panes. Synchronised scrolling — matching VS Code's markdown preview behaviour — removes that friction and makes split mode genuinely useful for editing and reviewing simultaneously.

## What Changes

- **New behaviour**: Scrolling the CodeMirror editor pane in split mode proportionally scrolls the preview pane to the matching position, and vice-versa (bidirectional).
- **Feedback-loop guard**: Programmatic scroll updates do not re-trigger the sync handler, preventing infinite loops.
- **Preview content stability**: After a debounced preview re-render, the scroll position is restored to avoid jarring jumps on each keystroke.
- **Split-mode scoped**: Sync is active only when both panes are visible (mode = `split`). Single-pane modes (`code`, `preview`) are unaffected.

## Capabilities

### New Capabilities

- `scroll-sync`: Bidirectional proportional scroll synchronisation between the CodeMirror source pane and the rendered preview pane in split mode.

### Modified Capabilities

<!-- None — no existing spec-level requirements change. -->

## Impact

- **`public/index.html`**: New scroll event listeners on the CodeMirror instance (`cm.on('scroll', ...)`) and on `#pane-preview`. New `isSyncing` guard flag. Preview render function (`renderPreview`) updated to capture and restore scroll position.
- **No new dependencies** — uses CodeMirror's existing scroll API and standard DOM scroll events.
- **No protocol/message changes** — entirely client-side.
- **No CLI changes**.
