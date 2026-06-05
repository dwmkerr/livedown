## ADDED Requirements

### Requirement: Source and preview panes stay scroll-synchronised in split mode
When the viewer is in `split` mode (both source and preview panes visible), scrolling either pane SHALL cause the other pane to scroll so that the same region of the document is visible in both. The pane the user is actively scrolling is the "driver"; the other pane is the "follower" and updates without driving sync back.

#### Scenario: scrolling the source pane scrolls the preview
- **WHEN** the viewer is in `split` mode and the user scrolls the source pane (CodeMirror) so that source line `L` is at the top of the visible source viewport
- **THEN** the preview pane scrolls so that the rendered block originating from line `L` (or the nearest preceding mapped line) is at the top of the visible preview viewport

#### Scenario: scrolling the preview pane scrolls the source
- **WHEN** the viewer is in `split` mode and the user scrolls the preview pane so that the rendered block originating from source line `L` is at the top of the visible preview viewport
- **THEN** the source pane scrolls so that line `L` is at the top of the visible source viewport

#### Scenario: follower scroll does not echo back to the driver
- **WHEN** the user scrolls the source pane and the preview pane follows
- **THEN** the preview's follow-scroll does NOT trigger an additional scroll on the source pane
- **AND** the source pane's scroll position is exactly where the user left it

### Requirement: Sync is disabled outside split mode
The viewer SHALL only synchronise scroll position when `panes.dataset.mode === 'split'`. In `code` or `preview` mode, scrolling the visible pane has no cross-pane effect.

#### Scenario: code-only mode does not drive sync
- **WHEN** the viewer is in `code` mode (preview hidden) and the user scrolls the source pane
- **THEN** no scroll updates are applied to the preview pane (which is not visible)

#### Scenario: preview-only mode does not drive sync
- **WHEN** the viewer is in `preview` mode (source hidden) and the user scrolls the preview pane
- **THEN** no scroll updates are applied to the source pane (which is not visible)

### Requirement: Source-line ↔ rendered-block mapping is built on every render
Every time `renderPreview()` regenerates `#preview-inner`, the viewer SHALL stamp `data-source-line="<n>"` (0-based) on every top-level rendered block (headings, paragraphs, lists, fenced code, blockquotes, tables, horizontal rules, raw HTML blocks, mermaid diagrams), where `n` is the source line where the originating markdown token starts. The viewer SHALL then rebuild an in-memory `[{ line, top }]` map used by the scroll handlers.

#### Scenario: top-level blocks carry source line attribute
- **WHEN** `renderPreview()` is called with markdown that contains a heading on line 0, a paragraph starting on line 2, and a fenced code block starting on line 5
- **THEN** `#preview-inner` contains an `<h*>` with `data-source-line="0"`, a `<p>` with `data-source-line="2"`, and a `<pre>` with `data-source-line="5"`

#### Scenario: mermaid replacement preserves the source line attribute
- **WHEN** `renderPreview()` is called with markdown containing a `mermaid` fenced code block originating on line `n`
- **THEN** the replacement `<div class="mermaid">` carries `data-source-line="n"` (the attribute survives the `<pre>` → `<div>` swap)

#### Scenario: line map rebuilds after asynchronous mermaid layout
- **WHEN** `window.mermaid.run()` resolves and the rendered mermaid diagrams reflow the preview pane
- **THEN** the line map is rebuilt so subsequent scrolls use the post-mermaid block offsets

### Requirement: Re-align on switching into split mode
When the user toggles into `split` mode from `code` or `preview`, the viewer SHALL perform one initial alignment pass so the two panes start in sync, using the previously-visible pane as the driver.

#### Scenario: preview → split re-aligns the source pane
- **WHEN** the viewer is in `preview` mode at preview `scrollTop = T` and the user clicks the `split` mode button
- **THEN** the source pane scrolls so that the line mapped to preview offset `T` is at the top of the source viewport

#### Scenario: code → split re-aligns the preview pane
- **WHEN** the viewer is in `code` mode with source line `L` at the top of the source viewport and the user clicks the `split` mode button
- **THEN** the preview pane scrolls so that the rendered block for line `L` is at the top of the preview viewport
