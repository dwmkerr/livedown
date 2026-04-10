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

function waitForFileContent(
  filePath: string,
  match: string,
  timeoutMs = MSG_TIMEOUT
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`File did not contain "${match}" within timeout`)),
      timeoutMs
    );
    const check = () => {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes(match)) {
        clearTimeout(timeout);
        resolve(content);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

const OPEN_BROWSER = process.env.LIVEDOWN_OPEN_BROWSER === "1";

async function openInBrowser(url: string): Promise<void> {
  if (!OPEN_BROWSER) return;
  const open = (await import("open")).default;
  await open(url);
}

describe("integration: share and view", () => {
  let cli: CliInfo;
  let viewer: WebSocket;
  let originalContent: string;

  beforeAll(async () => {
    originalContent = fs.readFileSync(TEST_FILE, "utf8");
    expect(fs.existsSync(CLI_PATH)).toBe(true);
  });

  afterAll(() => {
    fs.writeFileSync(TEST_FILE, originalContent, "utf8");
  });

  afterEach(() => {
    if (viewer && viewer.readyState === WebSocket.OPEN) viewer.close();
    if (cli?.proc && !cli.proc.killed) cli.proc.kill();
  });

  it("share: CLI connects to relay and prints join info", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    expect(cli.editKey).toMatch(/^[a-f0-9]{64}$/);
    expect(cli.roomUrl).toContain("livedown.dwmkerr.partykit.dev");
  });

  it("view: viewer connects and receives init with sharer present", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    viewer = await connectViewer(cli.roomUrl);
    const init = await waitForMessage(viewer, "init");
    expect(init.hasSharer).toBe(true);
    expect(init.protected).toBe(true);
    expect(init.publicKey).toBeTruthy();
  });

  it("edit rejected: unsigned push returns auth-error", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    viewer = await connectViewer(cli.roomUrl);
    await waitForMessage(viewer, "init");

    viewer.send(
      JSON.stringify({
        type: "push",
        content: "unsigned attempt",
        meta: { editor: "attacker" },
      })
    );

    const err = await waitForMessage(viewer, "auth-error");
    expect(err.type).toBe("auth-error");
  });

  it("edit online: signed push updates the local file", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    viewer = await connectViewer(cli.roomUrl);
    await waitForMessage(viewer, "init");

    const content = "# Edit Online Test\n\nPushed from the viewer.";
    const signature = signContent(content, cli.editKey);
    viewer.send(
      JSON.stringify({
        type: "push",
        content,
        signature,
        meta: { editor: "test-viewer" },
      })
    );

    const fileContent = await waitForFileContent(TEST_FILE, "Edit Online Test");
    expect(fileContent).toContain("Pushed from the viewer.");
  });

  it("edit local: file change on disk is pushed to viewer", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    viewer = await connectViewer(cli.roomUrl);
    await waitForMessage(viewer, "init");

    // Write directly to the file the CLI is watching
    fs.writeFileSync(TEST_FILE, "# Local Edit\n\nWritten on disk.", "utf8");

    const update = await waitForMessage(viewer, "update", 10000);
    expect(update.content).toContain("Local Edit");
    expect(update.signature).toBeTruthy();
  });

  it("close: killing the CLI sends sharer-gone", async () => {
    cli = await startCli();
    await openInBrowser(cli.viewerUrl);
    viewer = await connectViewer(cli.roomUrl);
    await waitForMessage(viewer, "init");

    cli.proc.kill();
    const gone = await waitForMessage(viewer, "sharer-gone", 10000);
    expect(gone.type).toBe("sharer-gone");
  });
});
