# synchronized-scrolling Specification

## Purpose
TBD - created by archiving change issue-114-feat-ui-synchronise-scrolling. Update Purpose after archive.
## Requirements
### Requirement: Source-driven preview scroll in split mode
In `split` view mode the viewer SHALL scroll the preview pane in response to the user scrolling the CodeMirror source pane so that the topmost visible source line aligns with the topmost visible rendered block.

#### Scenario: Scrolling source scrolls preview
- **WHEN** the user is in `split` mode viewing a document longer than the viewport
- **AND** the user scrolls the CodeMirror source pane downward
- **THEN** the preview pane SHALL scroll downward so that the rendered block corresponding to the topmost visible source line is at or near the top of the preview viewport

#### Scenario: Scrolling source upward also scrolls preview
- **WHEN** the user scrolls the CodeMirror source pane upward
- **THEN** the preview pane SHALL scroll upward to the corresponding rendered block

### Requirement: Preview-driven source scroll in split mode
In `split` view mode the viewer SHALL scroll the CodeMirror source pane in response to the user scrolling the preview pane so that the topmost visible rendered block aligns with the topmost visible source line.

#### Scenario: Scrolling preview scrolls source
- **WHEN** the user is in `split` mode viewing a document longer than the viewport
- **AND** the user scrolls the preview pane
- **THEN** the CodeMirror source pane SHALL scroll so that the source line corresponding to the topmost visible rendered block is at or near the top of the source viewport

### Requirement: Synchronised scroll is loop-free
The viewer SHALL NOT enter a feedback loop in which a sync-triggered scroll on one pane echoes back and drives the other pane indefinitely.

#### Scenario: Programmatic scroll does not re-trigger sync
- **WHEN** the sync controller scrolls the preview pane in response to a source-pane scroll event
- **THEN** the resulting preview-pane scroll event SHALL NOT cause the source pane to be scrolled again

#### Scenario: User can still interrupt with a fresh scroll
- **WHEN** the sync controller is mid-write to one pane
- **AND** the user starts scrolling the other pane within the same frame
- **THEN** the controller SHALL accept the new user scroll and resume sync from the new driver pane within ~100 ms

### Requirement: Sync is inactive outside split mode
The viewer SHALL NOT attempt to synchronise scroll positions in `code` or `preview` mode.

#### Scenario: Code mode has no sync
- **WHEN** the user is in `code` mode (source pane visible, preview pane hidden)
- **AND** the user scrolls the source pane
- **THEN** no scroll write SHALL be issued against the preview pane

#### Scenario: Preview mode has no sync
- **WHEN** the user is in `preview` mode (preview pane visible, source pane hidden)
- **AND** the user scrolls the preview pane
- **THEN** no scroll write SHALL be issued against the source pane

#### Scenario: Switching into split mode initialises alignment
- **WHEN** the user switches the mode toggle to `split`
- **THEN** the preview pane SHALL be scrolled to match the source pane's current top visible line so the two panes are aligned the moment split mode is shown

### Requirement: Sync survives content updates
The viewer SHALL keep source-to-preview alignment correct after the document content changes (push from sharer, local edit, or remote edit).

#### Scenario: New content rebuilds the source-line index
- **WHEN** the preview is re-rendered because the markdown content changed
- **THEN** the viewer SHALL rebuild its source-line-to-rendered-block index from the updated DOM before processing the next scroll event

#### Scenario: Sync after edit continues to align
- **WHEN** a remote edit is applied while the user is in `split` mode
- **AND** the user subsequently scrolls either pane
- **THEN** the panes SHALL stay aligned according to the updated content

### Requirement: Rendered blocks expose their source line
The viewer SHALL annotate each top-level rendered markdown block with the 0-indexed source line where that block begins, so the sync controller can map between source and preview positions.

#### Scenario: Block-level elements carry data-source-line
- **WHEN** the preview pane finishes rendering a non-empty markdown document
- **THEN** every direct top-level child of `#preview-inner` that originated from a block-level markdown token (paragraph, heading, list, blockquote, fenced code block, table, horizontal rule, mermaid diagram container) SHALL carry a `data-source-line` attribute whose integer value is the 0-indexed source line on which the block begins

#### Scenario: Mermaid replacement preserves the source line
- **WHEN** the viewer replaces a `<pre><code class="language-mermaid">` block with a `<div class="mermaid">` container
- **THEN** the `data-source-line` attribute SHALL be copied from the original element onto the replacement so the index continues to point at the mermaid block

