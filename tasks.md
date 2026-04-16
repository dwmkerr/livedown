1. if openspec not installed, then pr install openspec
2. gitlab version
3. reduce noise on issue — collapse / delete stale breadcrumb comments and label-flip events when superseded (e.g. only keep the latest failure comment; remove old ones on retrigger)
4. easier cancel — let a comment (`/cancel`) or label change (e.g. add `openspec:cancel`) cancel the in-flight run, instead of using `gh run cancel`
