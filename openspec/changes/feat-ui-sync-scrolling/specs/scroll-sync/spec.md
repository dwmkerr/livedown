## ADDED Requirements

### Requirement: Editor scroll drives preview scroll in split mode
When the user scrolls the CodeMirror editor pane in split mode, the preview pane SHALL scroll to the proportionally equivalent position.

The scroll fraction is computed as:
```
fraction = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
```
The preview's `scrollTop` SHALL be set to `fraction × (preview.scrollHeight - preview.clientHeight)`.

When `editor.scrollHeight - editor.clientHeight` is zero (content fits in the viewport), no synchronisation SHALL occur.

#### Scenario: Editor scroll syncs preview
- **WHEN** the viewer is in split mode and the user scrolls the editor pane to the middle of the document
- **THEN** the preview pane SHALL scroll to approximately the same proportional position

#### Scenario: Short document (no overflow) does not error
- **WHEN** the document is short enough that the editor has no scrollable overflow
- **THEN** scrolling produces no error and the preview position is unchanged

### Requirement: Preview scroll drives editor scroll in split mode
When the user scrolls the preview pane in split mode, the CodeMirror editor SHALL scroll to the proportionally equivalent position using `cm.scrollTo()`.

The scroll fraction is computed as:
```
fraction = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
```
The editor SHALL be scrolled to `fraction × (editor.scrollHeight - editor.clientHeight)`.

When `preview.scrollHeight - preview.clientHeight` is zero, no synchronisation SHALL occur.

#### Scenario: Preview scroll syncs editor
- **WHEN** the viewer is in split mode and the user scrolls the preview pane
- **THEN** the editor pane SHALL scroll to approximately the same proportional position

### Requirement: Scroll synchronisation is bidirectional without feedback loops
Programmatic scroll updates triggered by the sync mechanism SHALL NOT re-trigger the sync handler, preventing infinite scroll loops.

#### Scenario: No infinite scroll loop
- **WHEN** the editor scroll event fires and synchronises the preview
- **THEN** the resulting preview scroll event SHALL NOT trigger another editor synchronisation

#### Scenario: No infinite scroll loop from preview to editor
- **WHEN** the preview scroll event fires and synchronises the editor
- **THEN** the resulting editor scroll event SHALL NOT trigger another preview synchronisation

### Requirement: Scroll synchronisation is inactive outside split mode
The scroll synchronisation SHALL have no effect when the viewer is in `code` mode or `preview` mode (i.e., when only one pane is visible).

#### Scenario: Code mode — no sync
- **WHEN** the viewer is in code mode and the user scrolls the editor
- **THEN** no synchronisation to the (hidden) preview SHALL occur

#### Scenario: Preview mode — no sync
- **WHEN** the viewer is in preview mode and the user scrolls the preview
- **THEN** no synchronisation to the (hidden) editor SHALL occur

### Requirement: Preview scroll position is preserved across content re-renders
When the debounced preview re-render fires (replacing `#preview-inner` innerHTML), the preview pane's scroll position SHALL be restored to its value before the render, preventing a jump to the top on each keystroke.

#### Scenario: Typing does not reset preview scroll
- **WHEN** the viewer is in split mode, the preview is scrolled to mid-document, and the user types a character
- **THEN** after the debounce period, the preview SHALL remain at approximately the same scroll position

#### Scenario: Large structural deletion clamps scroll safely
- **WHEN** a large portion of the document is deleted, making the preview shorter than the saved scroll position
- **THEN** the preview SHALL scroll to the end of the (now shorter) document without error (browser clamping behaviour)
