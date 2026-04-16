## MODIFIED Requirements

### Requirement: CLI share command accepts one or more paths
The `livedown share` command SHALL accept one or more `<paths>` positional arguments (variadic). When exactly one path is given and it is a file, the command SHALL behave identically to the previous single-file interface: the session URL, edit-key prompt, and keyboard shortcuts are unchanged.

#### Scenario: Single file path works as before
- **WHEN** the user runs `livedown share README.md`
- **THEN** the CLI starts a session with one file, prints the viewer URL and edit key, and behaves identically to the pre-multi-file release

#### Scenario: No path given falls back to interactive prompt
- **WHEN** the user runs `livedown share` with no arguments in a TTY
- **THEN** the CLI prompts `File or directory to share:` and accepts a path

#### Scenario: Zero arguments in non-TTY exits with error
- **WHEN** the user runs `livedown share` with no arguments and stdin is not a TTY
- **THEN** the CLI prints a usage error and exits with code 1
