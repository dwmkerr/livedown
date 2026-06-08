## ADDED Requirements

### Requirement: Bidirectional scroll alignment in split mode

The browser viewer SHALL keep the source pane (`#pane-source`, the CodeMirror editor) and the preview pane (`#pane-preview`, the rendered HTML) scroll-aligned whenever `#panes[data-mode]` is `split`. Alignment is by **source line**: the markdown line at the top of the source viewport SHALL correspond to the rendered block that originated from that line at the top of the preview viewport.

#### Scenario: Scrolling the source moves the preview
- **WHEN** the user scrolls `#pane-source` (mouse wheel, arrow keys, page-up/down, or trackpad) while `#panes[data-mode="split"]`
- **THEN** `#pane-preview` SHALL scroll so the rendered block whose `data-source-line` is the largest value less than or equal to the topmost visible source line is positioned at the top of the preview viewport
- **AND** the source pane SHALL NOT receive a programmatic counter-scroll from the preview's resulting `scroll` event

#### Scenario: Scrolling the preview moves the source
- **WHEN** the user scrolls `#pane-preview` while `#panes[data-mode="split"]`
- **THEN** the source pane SHALL scroll so the line indicated by `data-source-line` on the rendered block at the top of the preview viewport is positioned at the top of the source pane
- **AND** the preview pane SHALL NOT receive a programmatic counter-scroll from the source's resulting `scroll` event

#### Scenario: Sync is dormant in single-pane modes
- **WHEN** `#panes[data-mode]` is `code` or `preview`
- **THEN** scrolling the visible pane SHALL NOT trigger any programmatic scroll of the hidden pane
- **AND** no scroll-sync work SHALL run on `scroll` events from either pane

### Requirement: Leader is the pane the user last interacted with

The viewer SHALL designate the pane the user last interacted with as the **leader** for scroll-sync, and treat the other pane as the **follower**. Only the leader's scroll events drive the follower; the follower's scroll events do not drive the leader. Leadership is decided by user-input signals — `wheel`, `pointerdown`, `touchstart`, `keydown` (arrow / page navigation / space), and `focus` — not by which pane emitted the `scroll` event.

#### Scenario: Wheel on the source claims leadership
- **WHEN** a `wheel` event fires on `#pane-source` (or any descendant)
- **THEN** the source pane SHALL be the leader for the resulting scroll gesture
- **AND** any `scroll` event that fires on `#pane-preview` while the source is leader SHALL be ignored

#### Scenario: Pointerdown on the preview claims leadership
- **WHEN** a `pointerdown` or `touchstart` event fires on `#pane-preview` (or the preview's scrollbar)
- **THEN** the preview pane SHALL be the leader for the resulting scroll gesture

#### Scenario: Programmatic follower scroll does not flip leadership
- **WHEN** the controller programmatically scrolls the follower in response to the leader's gesture
- **THEN** the follower's `scroll` event SHALL be ignored
- **AND** leadership SHALL remain with the original leader for the gesture

### Requirement: Rendered blocks carry source-line annotations

When `renderPreview(content)` runs, every top-level rendered block element SHALL carry a `data-source-line` attribute whose value is the 0-indexed line in `content` where that block starts. Top-level blocks are: headings, paragraphs, lists (the `<ul>`/`<ol>` root, not each `<li>`), blockquotes, fenced and indented code blocks, raw HTML blocks, horizontal rules, and tables.

#### Scenario: Heading carries its source line
- **WHEN** the source contains `# Title` on line 3 (0-indexed)
- **AND** `renderPreview` runs on that source
- **THEN** the rendered `<h1>` SHALL have attribute `data-source-line="3"`

#### Scenario: Paragraph carries its source line
- **WHEN** the source contains a paragraph starting on line 7
- **THEN** the rendered `<p>` SHALL have attribute `data-source-line="7"`

#### Scenario: Mermaid block keeps its annotation after post-processing
- **WHEN** the source contains a fenced ```mermaid block starting on line 12
- **AND** the mermaid post-processor replaces the `<pre>` with a `<div class="mermaid">`
- **THEN** the resulting `<div class="mermaid">` SHALL retain `data-source-line="12"`

### Requirement: Sync survives re-renders

When `renderPreview` runs (because of a local edit push or an incoming remote push), the controller SHALL re-emit `data-source-line` annotations and re-align the follower to the current leader's scroll position so the rendered preview does not jump away from the user's location.

#### Scenario: Local edit re-renders without losing alignment
- **WHEN** the user is the leader and is editing the source pane
- **AND** the debounced push fires and `renderPreview` runs
- **THEN** the preview pane SHALL be re-positioned so its top still corresponds to the source pane's topmost visible line

#### Scenario: Incoming remote push re-renders without jumping
- **GIVEN** the preview pane is the leader (the user is reading the preview, not editing)
- **WHEN** a remote `push` message arrives and `renderPreview` runs on the new content
- **THEN** the preview pane SHALL stay scrolled to the rendered block with the largest `data-source-line` ≤ the prior anchor
- **AND** the source pane SHALL be re-aligned to that same anchor

### Requirement: Entering split mode realigns

When `#panes[data-mode]` transitions to `split` (from `code` or `preview`), the controller SHALL perform a one-shot realignment so the previously-hidden pane lands at the position corresponding to the visible pane's current top.

#### Scenario: Switch from preview-only to split
- **GIVEN** `#panes[data-mode="preview"]` and the preview is scrolled to the rendered block with `data-source-line="42"`
- **WHEN** the user activates the split mode button
- **THEN** `#panes[data-mode]` becomes `split`
- **AND** `#pane-source` SHALL be scrolled so line 42 is at the top of its viewport

#### Scenario: Switch from code-only to split
- **GIVEN** `#panes[data-mode="code"]` and the source's topmost visible line is line 18
- **WHEN** the user activates the split mode button
- **THEN** `#pane-preview` SHALL be scrolled to the rendered block whose `data-source-line` is the largest value less than or equal to 18

### Requirement: Sync failures degrade silently

If the controller cannot determine an anchor (e.g., the preview is empty, no `data-source-line` is found, or `cm.lineAtHeight` throws), the controller SHALL leave the follower's scroll position unchanged for that event and SHALL NOT throw, log a user-visible error, or interrupt editing.

#### Scenario: Empty document
- **WHEN** the document is empty and the user scrolls either pane in split mode
- **THEN** the follower SHALL remain at scrollTop 0
- **AND** no console error SHALL be raised

#### Scenario: No annotation matches
- **WHEN** the topmost visible source line is past the last `data-source-line` in the preview (e.g., trailing blank lines)
- **THEN** the preview SHALL stay at its current scroll position
- **AND** subsequent scrolls back into annotated lines SHALL resume sync normally
