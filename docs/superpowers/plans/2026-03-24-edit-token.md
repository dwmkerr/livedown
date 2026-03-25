# Edit Token Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "edit token" so the sharer controls who can push changes — viewers can read freely, but editing requires the token.

**Architecture:** The CLI generates a random edit token when sharing and prints it. The sharer's watcher sends a `set-token` message on connect to register the token with the relay. The relay stores it and rejects subsequent `push` messages that don't include a matching `editToken`. The browser viewer starts in read-only mode for protected rooms and prompts for the token when the user clicks an "unlock editing" button.

**Tech Stack:** TypeScript, PartyKit, WebSocket (`ws`), CodeMirror

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/token.ts` | Create | `generateEditToken()` — isolated, testable token generation |
| `src/token.test.ts` | Create | Tests for token generation |
| `src/party/livedown.ts` | Modify | Store edit token, validate `push` messages, reject unauthorized edits |
| `src/party/livedown.test.ts` | Create | Tests for relay auth logic (message validation) |
| `src/watcher.ts` | Modify | Accept edit token param, send `set-token` on connect, include token in `push` messages, handle `auth-error` |
| `src/cli.ts` | Modify | Generate token, print it, pass to watcher |
| `src/cli.test.ts` | Modify | Test that help text shows `--edit-token` option |
| `public/index.html` | Modify | Start read-only when protected, prompt for edit token, send token in `push` messages |

---

### Task 1: Token Generation Module

**Files:**
- Create: `src/token.ts`
- Create: `src/token.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/token.test.ts`:

```typescript
import { generateEditToken } from "./token";

describe("generateEditToken", () => {
  it("should return a 32-character hex string", () => {
    const token = generateEditToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should return unique values on each call", () => {
    const a = generateEditToken();
    const b = generateEditToken();
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=token`
Expected: FAIL — cannot find module `./token`

- [ ] **Step 3: Write minimal implementation**

Create `src/token.ts`:

```typescript
import crypto from "crypto";

export function generateEditToken(): string {
  return crypto.randomBytes(16).toString("hex");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=token`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/token.ts src/token.test.ts
git commit -m "feat: add edit token generation module"
```

---

### Task 2: Relay Auth Enforcement

**Files:**
- Modify: `src/party/livedown.ts`
- Create: `src/party/livedown.test.ts`

**Note:** The `partykit/server` types are only available at runtime, not in jest. We extract the pure `validatePush` function so it can be tested without importing PartyKit types. The test file imports only the pure function.

- [ ] **Step 1: Write the failing tests**

Create `src/party/livedown.test.ts`:

```typescript
import { validatePush } from "./livedown";

describe("validatePush", () => {
  it("should accept push when no edit token is set (owner init)", () => {
    const result = validatePush(undefined, "abc123");
    expect(result).toBe(true);
  });

  it("should accept push with matching edit token", () => {
    const result = validatePush("abc123", "abc123");
    expect(result).toBe(true);
  });

  it("should reject push with wrong edit token", () => {
    const result = validatePush("abc123", "wrong");
    expect(result).toBe(false);
  });

  it("should reject push with missing edit token when one is set", () => {
    const result = validatePush("abc123", undefined);
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=livedown`
Expected: FAIL — `validatePush` is not exported

**Note:** If the test fails because `partykit/server` cannot be resolved in the test environment, add a Jest `moduleNameMapper` to `package.json` or `jest.config.*`:

```json
"moduleNameMapper": {
  "^partykit/server$": "<rootDir>/src/__mocks__/partykit-server.ts"
}
```

Create `src/__mocks__/partykit-server.ts`:

```typescript
export {};
```

- [ ] **Step 3: Extract and export validatePush, update relay logic**

Modify `src/party/livedown.ts` to:

```typescript
import type * as Party from "partykit/server";

export function validatePush(
  roomToken: string | undefined,
  msgToken: string | undefined
): boolean {
  if (!roomToken) return true;
  return !!msgToken && roomToken === msgToken;
}

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;
  editToken: string | undefined = undefined;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    this.guestCounter++;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conn as any).guestId = this.guestCounter;

    conn.send(
      JSON.stringify({
        type: "init",
        content: this.latestContent,
        meta: this.latestMeta,
        guestId: this.guestCounter,
        protected: !!this.editToken,
      })
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);

      // Owner registers the edit token via a dedicated message type
      if (msg.type === "set-token" && !this.editToken && msg.editToken) {
        this.editToken = msg.editToken;
        // Notify all existing connections that the room is now protected
        this.room.broadcast(
          JSON.stringify({ type: "protected", protected: true })
        );
        return;
      }

      if (msg.type !== "push") return;

      if (!validatePush(this.editToken, msg.editToken)) {
        sender.send(JSON.stringify({ type: "auth-error" }));
        return;
      }

      this.latestContent = msg.content;
      this.latestMeta = msg.meta || {};

      this.room.broadcast(
        JSON.stringify({
          type: "update",
          content: msg.content,
          meta: msg.meta || {},
        }),
        [sender.id]
      );
    } catch {
      /* ignore malformed */
    }
  }
}
```

Key changes:
- `editToken` field on the room, initially `undefined`
- Dedicated `set-token` message type — only the first `set-token` is accepted, preventing hijacking by a viewer that connects before the sharer
- Subsequent pushes must include a matching token or get `auth-error`
- `init` message includes `protected: true/false` so the viewer knows whether a token is needed

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=livedown`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/party/livedown.ts src/party/livedown.test.ts
# If partykit mock was needed:
git add src/__mocks__/partykit-server.ts
git commit -m "feat: relay enforces edit token on push messages"
```

---

### Task 3: Watcher Sends Edit Token

**Files:**
- Modify: `src/watcher.ts`

- [ ] **Step 1: Add editToken parameter, send set-token on connect, include in pushes, handle auth-error**

Modify `src/watcher.ts`:

1. Change the `startWatcher` function signature to accept `editToken`:

```typescript
export function startWatcher(
  filePath: string,
  doc: string,
  roomUrl: string,
  editor: string,
  editToken: string
): void {
```

2. Add `editToken` to the `push` function's JSON payload (inside the object passed to `JSON.stringify`):

```typescript
    ws.send(
      JSON.stringify({
        type: "push",
        content,
        editToken,
        meta: {
          ...meta,
          editor,
          editedAt: new Date().toISOString(),
          file: doc,
        },
      })
    );
```

3. In the `ws.on("open", ...)` handler, send `set-token` before the first push:

```typescript
    ws.on("open", () => {
      console.log("Connected to room");
      ws!.send(JSON.stringify({ type: "set-token", editToken }));
      push(fs.readFileSync(filePath, "utf8"));
    });
```

4. In the `ws.on("message", ...)` handler, add handling for `auth-error`:

```typescript
        if (msg.type === "auth-error") {
          console.error("Edit token rejected by relay — check your --edit-token value");
          return;
        }
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/watcher.ts
git commit -m "feat: watcher sends set-token and includes edit token in pushes"
```

---

### Task 4: CLI Generates and Prints Edit Token

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/cli.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/cli.test.ts`:

```typescript
  it("should show edit-token option in share help", () => {
    const output = execSync(`npx ts-node ${cli} share --help`, {
      encoding: "utf8",
    });
    expect(output).toContain("--edit-token");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=cli`
Expected: FAIL — output does not contain `--edit-token`

- [ ] **Step 3: Update CLI to generate token and pass to watcher**

Modify `src/cli.ts`:

1. Add import at top:

```typescript
import { generateEditToken } from "./token";
```

2. Add `--edit-token` option to the `share` command (after the `--doc` option):

```typescript
  .option("-t, --edit-token <token>", "Edit token (auto-generated if omitted)")
```

3. Update `startSharing` opts type and body:

```typescript
function startSharing(
  file: string,
  opts: { relay: string; editor: string; doc?: string; editToken?: string }
): void {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const doc = opts.doc || `${shortId()}/${filename}`;
  const editToken = opts.editToken || generateEditToken();
  const viewerUrl = buildViewerUrl(opts.relay, doc);
  const roomUrl = buildRoomUrl(opts.relay, doc);

  console.log(`\n  Watching  ${filePath}`);
  console.log(
    `  Join      \x1b[4m\x1b]8;;${viewerUrl}\x07${viewerUrl}\x1b]8;;\x07\x1b[24m`
  );
  console.log(`  Edit key  \x1b[33m${editToken}\x1b[0m\n`);

  startWatcher(filePath, doc, roomUrl, opts.editor, editToken);
}
```

The no-subcommand fallback path doesn't need changes — `editToken` is optional and will be auto-generated inside `startSharing`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: All tests PASS (including the new one)

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts src/cli.test.ts
git commit -m "feat: CLI generates and prints edit token"
```

---

### Task 5: Browser Viewer Edit Token Prompt

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Add edit token UI elements**

Add CSS for the edit token modal (inside the existing `<style>` block, before the closing `</style>`):

```css
    /* ── Edit-token modal ────────────────────────────────────── */
    #token-modal {
      display: none; position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.55);
      justify-content: center; align-items: center;
    }
    #token-modal.open { display: flex; }
    #token-box {
      background: #1e1e2e; border: 1px solid #313244; border-radius: 8px;
      padding: 1.5rem; width: 340px; text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #cdd6f4;
    }
    #token-box h3 { margin: 0 0 .5rem; font-size: 1.1em; }
    #token-box p { margin: 0 0 1rem; font-size: .85em; color: #a6adc8; }
    #token-input {
      width: 100%; padding: .5rem; border: 1px solid #313244;
      border-radius: 4px; background: #313244; color: #cdd6f4;
      font-family: 'SFMono-Regular', Consolas, monospace; font-size: .9em;
      text-align: center; outline: none;
    }
    #token-input:focus { border-color: #89b4fa; }
    #token-input.error { border-color: #f38ba8; }
    #token-submit {
      margin-top: .8rem; padding: .45rem 1.5rem;
      background: #89b4fa; color: #1e1e2e; border: none; border-radius: 4px;
      font-weight: 600; cursor: pointer; font-size: .9em;
    }
    #token-submit:hover { background: #74c7ec; }
    #token-cancel {
      margin-top: .5rem; padding: .3rem 1rem;
      background: none; color: #6c7086; border: none; cursor: pointer;
      font-size: .8em;
    }
    #token-cancel:hover { color: #cdd6f4; }
    #token-error-msg {
      color: #f38ba8; font-size: .8em; margin-top: .5rem;
      display: none;
    }
```

- [ ] **Step 2: Add the modal HTML**

Add this immediately after the `<div id="edits-popover"></div>` line:

```html
<div id="token-modal">
  <div id="token-box">
    <h3>Edit key required</h3>
    <p>This document is protected. Enter the edit key to make changes.</p>
    <input id="token-input" type="text" placeholder="Paste edit key" autocomplete="off" spellcheck="false">
    <div id="token-error-msg">Incorrect edit key. Try again.</div>
    <br>
    <button id="token-submit">Unlock editing</button>
    <br>
    <button id="token-cancel">View only</button>
  </div>
</div>
```

- [ ] **Step 3: Add edit token logic to the JavaScript**

Add the following variables near the top of the IIFE (after the `myColor` declaration at line ~340):

```javascript
  let editToken = null;
  let isProtected = false;
  let editUnlocked = false;
  let lastRemoteContent = '';
```

**Use `readOnly` mode for gating edits** — set CodeMirror to read-only when the room is protected and the token hasn't been entered. This avoids reverting inside the `change` handler which corrupts undo history.

After the CodeMirror instantiation (after `extraKeys: { Tab: false },`), the editor starts writable. We'll set it to read-only once we learn the room is protected (in the `init` handler).

Add the token modal interaction logic (after the `escHtml` function, around line ~445):

```javascript
  // ── Edit token modal ─────────────────────────────────────────
  const tokenModal  = document.getElementById('token-modal');
  const tokenInput  = document.getElementById('token-input');
  const tokenSubmit = document.getElementById('token-submit');
  const tokenCancel = document.getElementById('token-cancel');
  const tokenError  = document.getElementById('token-error-msg');

  function showTokenModal() {
    tokenModal.classList.add('open');
    tokenInput.value = '';
    tokenInput.classList.remove('error');
    tokenError.style.display = 'none';
    tokenInput.focus();
  }

  function hideTokenModal() {
    tokenModal.classList.remove('open');
  }

  tokenSubmit.addEventListener('click', function () {
    var val = tokenInput.value.trim();
    if (!val) { tokenInput.classList.add('error'); return; }
    editToken = val;
    editUnlocked = true;
    cm.setOption('readOnly', false);
    hideTokenModal();
  });

  tokenInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tokenSubmit.click();
  });

  tokenCancel.addEventListener('click', function () {
    hideTokenModal();
  });
```

Replace the existing `cm.on('change', ...)` handler with:

```javascript
  cm.on('beforeChange', (instance, changeObj) => {
    if (changeObj.origin === 'setValue') return;
    if (isProtected && !editUnlocked) {
      changeObj.cancel();
      showTokenModal();
    }
  });

  cm.on('change', (instance, changeObj) => {
    if (changeObj.origin === 'setValue') return;
    lastLocalEdit = Date.now();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(cm.getValue()), 400);
  });
```

Using `beforeChange` to cancel + show modal is cleaner than reverting in `change`. But since we also set `readOnly` when protected, the `beforeChange` handler serves as a belt-and-suspenders fallback.

Update the `push` function to include `editToken`:

```javascript
  function push(content) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({
      type: 'push',
      content,
      editToken: editToken,
      meta: {
        editor:   myGuestName,
        editedAt: new Date().toISOString(),
        file:     docName,
        color:    myColor,
      },
    }));
    renderPreview(content);
    recordEdit(myGuestName, new Date().toISOString(), content);
  }
```

Update the `ws.onmessage` handler:

In the `msg.type === 'init'` block, add after `setMeta(msg.meta)`:
```javascript
        isProtected = !!msg.protected;
        lastRemoteContent = msg.content || '';
        if (isProtected && !editUnlocked) {
          cm.setOption('readOnly', true);
        }
```

In the `msg.type === 'update'` block, add:
```javascript
        lastRemoteContent = msg.content || '';
```

Add new handlers after the `update` block (before the closing `};` of `ws.onmessage`):

```javascript
      if (msg.type === 'auth-error') {
        editUnlocked = false;
        editToken = null;
        cm.setOption('readOnly', true);
        tokenInput.classList.add('error');
        tokenError.style.display = 'block';
        showTokenModal();
        return;
      }

      if (msg.type === 'protected') {
        isProtected = !!msg.protected;
        if (isProtected && !editUnlocked) {
          cm.setOption('readOnly', true);
        }
      }
```

- [ ] **Step 4: Manually verify in browser** (cannot be unit tested)

1. Run `npx ts-node src/cli.ts share test.md` — note the edit key printed
2. Open the viewer URL in a browser
3. Try to type — editor should be read-only, modal should appear
4. Enter wrong token — relay sends `auth-error`, modal shows error state
5. Enter correct token — editor becomes writable, editing works
6. Open a second browser tab — should start read-only until token entered

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat: browser viewer prompts for edit token"
```

---

### Task 6: Final Integration Verification

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No errors (fix any that appear)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Clean build with no errors

- [ ] **Step 4: Commit any fixes**

If lint or build required changes:
```bash
git add -A
git commit -m "fix: lint and build fixes for edit token feature"
```
