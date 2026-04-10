import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";
import WebSocket from "ws";
import { signContent } from "../../src/token";

const TEST_FILE = path.resolve(__dirname, "../documents/empty.md");
const CLI_PATH = path.resolve(__dirname, "../../dist/cli.js");
const STARTUP_TIMEOUT = 15000;
const MSG_TIMEOUT = 5000;

interface CliInfo {
  proc: ChildProcess;
  roomUrl: string;
  viewerUrl: string;
  editKey: string;
}

function startCli(): Promise<CliInfo> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [CLI_PATH, "share", TEST_FILE], {
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`CLI did not start in ${STARTUP_TIMEOUT}ms: ${stdout}`));
    }, STARTUP_TIMEOUT);

    proc.stdout!.on("data", (data: Buffer) => {
      stdout += data.toString();
      // Strip ANSI escape codes for parsing
      const clean = stdout.replace(
        /\x1b\[[0-9;]*[a-zA-Z]|\x1b\]8;;[^\x07]*\x07/g,
        ""
      );
      const urlMatch = clean.match(
        /https:\/\/livedown\.dwmkerr\.partykit\.dev\/#([a-z0-9]+\/[^\s]+)/
      );
      const keyMatch = clean.match(/Edit key\s+([a-f0-9]{64})/);
      if (urlMatch && keyMatch) {
        clearTimeout(timeout);
        const doc = urlMatch[1];
        resolve({
          proc,
          viewerUrl: `https://livedown.dwmkerr.partykit.dev/#${doc}`,
          roomUrl: `wss://livedown.dwmkerr.partykit.dev/parties/main/${encodeURIComponent(doc)}`,
          editKey: keyMatch[1],
        });
      }
    });

    proc.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`CLI exited early with code ${code}: ${stdout}`));
    });
  });
}

function connectViewer(roomUrl: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(roomUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Viewer WebSocket did not open"));
    }, MSG_TIMEOUT);
    ws.on("open", () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.on("error", (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

function waitForMessage(
  ws: WebSocket,
  type: string,
  timeoutMs = MSG_TIMEOUT
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for '${type}' message`));
    }, timeoutMs);
    const handler = (data: WebSocket.Data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === type) {
        clearTimeout(timeout);
        ws.removeListener("message", handler);
        resolve(msg);
      }
    };
    ws.on("message", handler);
  });
}

describe("integration: share and view", () => {
  let cli: CliInfo;
  let viewer: WebSocket;
  let originalContent: string;

  beforeAll(async () => {
    originalContent = fs.readFileSync(TEST_FILE, "utf8");
    // Build first to make sure dist/cli.js exists
    expect(fs.existsSync(CLI_PATH)).toBe(true);
  });

  afterAll(() => {
    fs.writeFileSync(TEST_FILE, originalContent, "utf8");
  });

  afterEach(() => {
    if (viewer && viewer.readyState === WebSocket.OPEN) viewer.close();
    if (cli?.proc && !cli.proc.killed) cli.proc.kill();
  });

  it("full share/view/edit/offline lifecycle", async () => {
    // 1. Start the CLI sharing the test file
    cli = await startCli();
    expect(cli.editKey).toMatch(/^[a-f0-9]{64}$/);
    expect(cli.roomUrl).toContain("livedown.dwmkerr.partykit.dev");

    // 2. Connect as a viewer
    viewer = await connectViewer(cli.roomUrl);

    // 3. Verify init message
    const init = await waitForMessage(viewer, "init");
    expect(init.hasSharer).toBe(true);
    expect(init.protected).toBe(true);
    expect(init.publicKey).toBeTruthy();

    // 4. Push without signature - expect auth-error
    viewer.send(
      JSON.stringify({
        type: "push",
        content: "unsigned attempt",
        meta: { editor: "attacker" },
      })
    );
    const authError = await waitForMessage(viewer, "auth-error");
    expect(authError.type).toBe("auth-error");

    // 5. Push with valid signature - expect update broadcast
    const testContent = "# Integration Test\n\nWritten by the test suite.";
    const signature = signContent(testContent, cli.editKey);
    viewer.send(
      JSON.stringify({
        type: "push",
        content: testContent,
        signature,
        meta: { editor: "test-viewer" },
      })
    );

    // The relay broadcasts the update to other connections (excluding sender).
    // Since we're the only viewer, we won't receive the update broadcast.
    // But the watcher (the CLI) WILL receive it and write to disk.
    // Wait for the file to be updated.
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("File not updated within timeout")),
        MSG_TIMEOUT
      );
      const check = () => {
        const content = fs.readFileSync(TEST_FILE, "utf8");
        if (content.includes("Integration Test")) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 200);
        }
      };
      check();
    });
    const fileContent = fs.readFileSync(TEST_FILE, "utf8");
    expect(fileContent).toContain("Integration Test");

    // 6. Kill the CLI - expect sharer-gone
    cli.proc.kill();
    const gone = await waitForMessage(viewer, "sharer-gone", 10000);
    expect(gone.type).toBe("sharer-gone");
  }, 30000);
});
