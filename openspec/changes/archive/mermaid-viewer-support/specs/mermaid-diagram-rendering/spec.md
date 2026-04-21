## ADDED Requirements

### Requirement: Mermaid fenced blocks render as diagrams
The viewer SHALL render fenced code blocks tagged with the `mermaid` language identifier as SVG diagrams in the preview pane, matching the output a user would see in GitHub's markdown preview.

#### Scenario: Valid mermaid block renders as SVG
- **WHEN** the markdown content contains a fenced block tagged ` ```mermaid ` with valid Mermaid syntax
- **THEN** the preview pane SHALL display an SVG diagram in place of the raw code block text

#### Scenario: Raw code block is not displayed
- **WHEN** the markdown content contains a fenced block tagged ` ```mermaid `
- **THEN** the preview pane SHALL NOT display the raw diagram source as a code block

### Requirement: Mermaid diagrams re-render on every content update
The viewer SHALL re-render all Mermaid diagrams each time the preview content is updated, with no additional user interaction required.

#### Scenario: Diagram updates when content changes
- **WHEN** the sharer or a collaborator edits the markdown and the preview is updated
- **THEN** any Mermaid diagrams in the new content SHALL be rendered in the updated preview without requiring a page reload

### Requirement: Malformed Mermaid blocks show an error state
The viewer SHALL display a visible, non-disruptive error message in place of a diagram when the Mermaid syntax is invalid, preserving the raw source text for debugging.

#### Scenario: Invalid mermaid syntax shows error
- **WHEN** the markdown content contains a fenced block tagged ` ```mermaid ` with invalid or unparseable Mermaid syntax
- **THEN** the preview pane SHALL display an error indicator (e.g., a styled error box) with the raw diagram source text
- **AND** the rest of the markdown preview SHALL continue to render normally

#### Scenario: One invalid diagram does not break other diagrams
- **WHEN** a document contains multiple Mermaid blocks and one has invalid syntax
- **THEN** the viewer SHALL render the valid diagrams as SVGs and show the error state only for the invalid block
