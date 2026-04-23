## ADDED Requirements

### Requirement: Hero GIF asset exists in docs
The repository SHALL include `docs/hero.gif`, an animated GIF demonstrating the `livedown share` workflow (CLI invocation → live browser URL displayed).

#### Scenario: Asset file present
- **WHEN** the repository is checked out
- **THEN** the file `docs/hero.gif` SHALL exist and be a valid GIF image

#### Scenario: Asset is within size budget
- **WHEN** `docs/hero.gif` is committed
- **THEN** its file size SHALL be no greater than 3 MB

### Requirement: VHS tape script committed alongside GIF
The repository SHALL include `docs/hero.tape`, a [vhs](https://github.com/charmbracelet/vhs) tape script that, when executed with `vhs docs/hero.tape`, regenerates `docs/hero.gif` without manual intervention.

#### Scenario: Tape script present
- **WHEN** the repository is checked out
- **THEN** the file `docs/hero.tape` SHALL exist

#### Scenario: Tape script is valid VHS syntax
- **WHEN** `vhs docs/hero.tape` is executed on a machine with vhs installed
- **THEN** the command SHALL exit with code 0 and produce `docs/hero.gif`

### Requirement: Hero GIF embedded in README
`README.md` SHALL display `docs/hero.gif` as a centred hero image, positioned between the badge row and the `## Quickstart` heading.

#### Scenario: Hero image visible in rendered README
- **WHEN** a visitor views the README on GitHub
- **THEN** the hero GIF SHALL appear before any prose or code blocks, immediately after the badges

#### Scenario: Image has descriptive alt text
- **WHEN** `docs/hero.gif` is embedded in `README.md`
- **THEN** the `<img>` or `![]()` element SHALL include alt text describing the content (e.g., "livedown demo: share a file and view it live in the browser")
