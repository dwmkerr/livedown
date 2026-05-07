import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import matter from "gray-matter";
import WebSocket from "ws";
import { signContent, verifySignature } from "./token";
import { dim, red } from "./style";

interface Meta {
  owner: string | null;
  github_repo: string | null;
  title: string;
  editor?: string;
  editedAt?: string;
  file?: string;
}

function parseMeta(
  raw: string,
  filePath: string
): { content: string; meta: Meta } {
  const parsed = matter(raw);
  return {
    content: parsed.content,
    meta: {
      owner: (parsed.data.owner as string) || null,
      github_repo: (parsed.data.github_repo as string) || null,
      title:
        (parsed.data.title as string) ||
        path.basename(filePath, path.extname(filePath)),
    },
  };
}

const HINTS = dim("  o open  c copy key  q quit");
let showHints = false;

function log(msg: string): void {
  if (showHints && process.stdout.isTTY) {
    process.stdout.write("\x1b[2K\r");
    console.log(msg);
    process.stdout.write(HINTS);
  } else {
    console.log(msg);
  }
}

export function startWatcher(
  filePath: string,
  doc: string,
  roomUrl: string,
  editor: string,
  editKey: string,
  publicKey: string
): Promise<void> {
  let ws: WebSocket | null = null;
  let ignoreNextWrite = false;
  let isReady = false;
  let resolveReady: (() => void) | null = null;
  let rejectReady: ((err: Error) => void) | null = null;
  showHints = process.stdin.isTTY === true;

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const readyTimeout = setTimeout(() => {
    if (!isReady && rejectReady) {
      rejectReady(
        new Error(
          "Timed out connecting to relay after 10s. Check your network connection and relay host."
        )
      );
    }
  }, 10000);

  function push(raw: string): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const { content, meta } = parseMeta(raw, filePath);
    const signature = signContent(content, editKey);
    ws.send(
      JSON.stringify({
        type: "push",
        content,
        signature,
        meta: {
          ...meta,
          editor,
          editedAt: new Date().toISOString(),
          file: doc,
        },
      })
    );
  }

  function connect(): void {
    ws = new WebSocket(roomUrl);

    ws.on("open", () => {
      // On first connect this is silent; the CLI shows "Connecting..." until
      // sharer-ack resolves the ready promise. On subsequent reconnects we log
      // so the user knows we recovered.
      if (isReady) log("Reconnected to room");
      ws!.send(JSON.stringify({ type: "set-token", publicKey }));
      push(fs.readFileSync(filePath, "utf8"));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "sharer-ack") {
          if (!isReady) {
            isReady = true;
            clearTimeout(readyTimeout);
            resolveReady?.();
          }
          return;
        }
        if (msg.type === "auth-error") {
          log("Edit key rejected — check your --edit-key value");
          return;
        }
        if (msg.type === "auth-rejected") {
          const who = msg.editor || "unknown";
          log(`  ${red(`✗ ${who} — edit rejected (bad signature)`)}`);
          return;
        }
        if (msg.type !== "update") return;

        // Verify signature before writing to disk
        if (msg.signature && publicKey) {
          if (!verifySignature(msg.content || "", msg.signature, publicKey)) {
            log(`  ${red("✗ Rejected update — invalid signature")}`);
            return;
          }
        }

        const meta = msg.meta || {};
        let frontmatter = "";
        if (meta.owner || meta.github_repo || meta.title) {
          const lines = ["---"];
          if (meta.owner) lines.push(`owner: "${meta.owner}"`);
          if (meta.github_repo)
            lines.push(`github_repo: "${meta.github_repo}"`);
          if (meta.title) lines.push(`title: "${meta.title}"`);
          lines.push("---\n");
          frontmatter = lines.join("\n");
        }
        const newRaw = frontmatter + msg.content;
        const currentRaw = fs.existsSync(filePath)
          ? fs.readFileSync(filePath, "utf8")
          : "";

        if (newRaw !== currentRaw) {
          ignoreNextWrite = true;
          fs.writeFileSync(filePath, newRaw, "utf8");
          const who = meta.editor || "unknown";
          const preview = (msg.content || "")
            .replace(/\n/g, " ")
            .trim()
            .slice(0, 60);
          log(`  ${dim(who)}  ${preview}${preview.length >= 60 ? "..." : ""}`);
        }
      } catch {
        /* ignore malformed */
      }
    });

    ws.on("close", () => {
      if (isReady) {
        log("Disconnected — reconnecting in 2s...");
        setTimeout(connect, 2000);
      }
      // If not yet ready, the readyTimeout will reject the promise; no reconnect.
    });

    ws.on("error", (e: Error) => {
      if (isReady) {
        log(`WS error: ${e.message}`);
      }
      // Before ready, errors are reported via the rejected ready promise.
    });
  }

  chokidar
    .watch(filePath, {
      awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 10 },
    })
    .on("change", () => {
      if (ignoreNextWrite) {
        ignoreNextWrite = false;
        return;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      log("Local change detected — pushing...");
      push(raw);
    });

  connect();
  return ready;
}
