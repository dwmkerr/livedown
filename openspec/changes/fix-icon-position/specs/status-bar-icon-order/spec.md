## ADDED Requirements

### Requirement: GitHub icon appears between profile and status dot
The status bar SHALL render its right-side segments in the order: profile (avatar + name + access) → GitHub icon link → status dot segment. The GitHub icon MUST NOT appear to the left of the profile segment.

#### Scenario: Visual order in rendered page
- **WHEN** the viewer page is loaded in a browser
- **THEN** the GitHub icon link is visually positioned after the profile segment and before the status dot

#### Scenario: DOM order in HTML source
- **WHEN** the HTML source of `public/index.html` is inspected
- **THEN** the `#profile` div appears before the GitHub icon `<a>` element, and the GitHub icon `<a>` element appears before `#sb-status` in the DOM
