# Mermaid Diagram Test

This document tests Mermaid diagram rendering in the livedown viewer.

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Sharer
    participant Relay
    participant Viewer

    Sharer->>Relay: push(content, signature)
    Relay->>Relay: verify signature
    Relay->>Viewer: update(content)
    Viewer->>Viewer: renderPreview()
```

## Regular Code Block (should not be rendered as a diagram)

```js
console.log("Hello, world!");
```
