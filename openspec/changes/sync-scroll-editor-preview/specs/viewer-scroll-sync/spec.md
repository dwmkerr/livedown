## ADDED Requirements

### Requirement: Rendered blocks carry source-line annotations

When the viewer renders markdown to HTML for the preview pane, every top-level rendered block element SHALL carry a `data-source-line` attribute whose value is the 1-based line number of the first source line that produced the block. Top-level blocks include headings, paragraphs, lists (the outer `<ul>`/`<ol>`), blockquotes, code blocks (the outer `<pre>`), tables (the outer `<table>`), and horizontal rules.

#### Scenario: heading carries its source line

- **WHEN** the source `\n\n# Hello\n` is rendered (the heading sits on source line 3)
- **THEN** the rendered `<h1>` element has `data-source-line="3"`

#### Scenario: paragraph carries the line of its first character

- **WHEN** a paragraph spans source lines 5 through 7
- **THEN** the rendered `<p>` element has `data-source-line="5"`

#### Scenario: code fence carries the opening fence line

- **WHEN** a fenced code block opens at source line 10 and closes at line 14
- **THEN** the rendered `<pre>` element has `data-source-line="10"`

#### Scenario: nested inline tokens do not carry annotations

- **WHEN** a paragraph contains an `**emphasis**` span
- **THEN** the `<strong>` element does not carry `data-source-line` (only the outer block does)

#### Scenario: re-rendering after a remote update re-annotates from scratch

- **WHEN** an `update` message arrives and `renderPreview` runs on the new content
- **THEN** the resulting blocks carry `data-source-line` attributes that reflect the *new* content's line numbers, not the previous render's

### Requirement: Source line to preview scroll mapping

The viewer SHALL provide a pure function that, given the list of source-line anchors currently in `#preview-inner` (each with its line number and `offsetTop`) and a target source line, returns the preview-pane `scrollTop` that places the corresponding block near the top of the viewport. Between two adjacent anchors the function SHALL interpolate linearly on line number.

#### Scenario: target line exactly matches an anchor

- **WHEN** anchors are `[{line:1, top:0}, {line:10, top:200}]` and the target line is `10`
- **THEN** the returned `scrollTop` equals `200` (minus any fixed top padding the implementation applies)

#### Scenario: target line falls between two anchors

- **WHEN** anchors are `[{line:1, top:0}, {line:11, top:200}]` and the target line is `6`
- **THEN** the returned `scrollTop` is `100` (halfway between the two anchors), within ±1px of fixed padding adjustment

#### Scenario: target line is before the first anchor

- **WHEN** the target line precedes every anchor
- **THEN** the returned `scrollTop` is `0`

#### Scenario: target line is after the last anchor

- **WHEN** the target line is past every anchor
- **THEN** the returned `scrollTop` is the `offsetTop` of the last anchor (the preview cannot scroll further than the last block's position)

#### Scenario: empty anchor list

- **WHEN** the anchor list is empty (e.g. empty document)
- **THEN** the returned `scrollTop` is `0` and the function does not throw

### Requirement: Preview scroll to source line mapping

The viewer SHALL provide the inverse mapping: given the same anchor list and a preview-pane `scrollTop`, return the source line number whose block aligns with that position. Between two adjacent anchors the mapping SHALL interpolate linearly on offsetTop.

#### Scenario: scrollTop exactly matches an anchor's top

- **WHEN** anchors are `[{line:1, top:0}, {line:10, top:200}]` and `scrollTop` is `200`
- **THEN** the returned line is `10`

#### Scenario: scrollTop falls between two anchor tops

- **WHEN** anchors are `[{line:1, top:0}, {line:11, top:200}]` and `scrollTop` is `100`
- **THEN** the returned line is `6`

#### Scenario: scrollTop is at the very top

- **WHEN** `scrollTop` is `0`
- **THEN** the returned line is `1` (or the first anchor's line)

#### Scenario: empty anchor list

- **WHEN** the anchor list is empty
- **THEN** the returned line is `1` and the function does not throw

### Requirement: Split mode synchronises scroll between source and preview

In Split mode (the `#panes` element has `data-mode="split"` or no `data-mode` attribute), a user-initiated scroll of either pane SHALL drive the other pane to the position computed by the mapping described above. Source-pane scroll events SHALL use CodeMirror's current top-line as input; preview-pane scroll events SHALL use the preview's `scrollTop` as input.

#### Scenario: scrolling the source moves the preview

- **WHEN** the viewer is in Split mode and the user scrolls the source pane so that source line `L` is at the top of the visible CodeMirror viewport
- **THEN** within one animation frame the preview pane scrolls so that the block annotated with the line closest to `L` is near the top of the preview viewport

#### Scenario: scrolling the preview moves the source

- **WHEN** the viewer is in Split mode and the user scrolls the preview pane to a position whose nearest annotated block is line `L`
- **THEN** within one animation frame the CodeMirror source pane scrolls so that line `L` is in the upper portion of its visible viewport

### Requirement: Sync is inert outside Split mode

When the viewer is in `code` mode (`#panes[data-mode="code"]`) or `preview` mode (`#panes[data-mode="preview"]`), scrolling the visible pane SHALL NOT trigger any scroll on the hidden pane and SHALL NOT throw or log errors. Sync handlers remain registered but bail at the top.

#### Scenario: code mode does not drive the preview

- **WHEN** the viewer is in `code` mode and the user scrolls the source pane
- **THEN** the preview pane's `scrollTop` does not change as a result

#### Scenario: preview mode does not drive the source

- **WHEN** the viewer is in `preview` mode and the user scrolls the preview pane
- **THEN** CodeMirror's scroll position does not change as a result

#### Scenario: switching back to Split resumes sync

- **WHEN** the user is in `code` mode, switches to `split`, then scrolls the source
- **THEN** the preview tracks the source from that point on, without requiring a page reload

### Requirement: Sync does not create a feedback loop

When sync moves pane B as a result of a scroll on pane A, the resulting scroll event on pane B SHALL NOT in turn move pane A. The implementation MUST distinguish a user-initiated scroll from a programmatic, sync-induced scroll.

#### Scenario: source-induced preview scroll does not bounce back

- **WHEN** a source scroll moves the preview
- **THEN** the preview's scroll event does not call the source-scroll handler in the same frame, and the source's scroll position is unchanged once the user's scroll input stops

#### Scenario: bursty scroll events collapse to one frame

- **WHEN** the user fires many scroll events on the source pane within a single animation frame (e.g. wheel fling)
- **THEN** the preview pane is updated at most once per animation frame to the latest target

### Requirement: Remote content updates do not move the user's scroll

When an `update` message from the relay causes `renderPreview` to rebuild `#preview-inner`, the user's preview scroll position SHALL be preserved across the re-render. The user's source scroll position is governed by CodeMirror's existing behaviour and is unaffected by this change.

#### Scenario: preview scrollTop survives a remote re-render

- **WHEN** the user has scrolled the preview to `scrollTop = 800`, and a remote `update` arrives that re-renders the preview
- **THEN** after the re-render the preview's `scrollTop` is `800` (or the maximum achievable scrollTop if the new content is shorter)

#### Scenario: scrollTop clamps for shorter content

- **WHEN** a remote `update` produces content shorter than the previous content, such that the previous `scrollTop` exceeds the new `scrollHeight - clientHeight`
- **THEN** the preview clamps to the new maximum `scrollTop` rather than producing a blank scroll area
