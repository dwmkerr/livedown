import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import matter from "gray-matter";
import WebSocket from "ws";

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

export function startWatcher(
  filePath: string,
  doc: string,
  roomUrl: string,
  editor: string,
  editToken: string
): void {
  let ws: WebSocket | null = null;
  let ignoreNextWrite = false;

  function push(raw: string): void {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const { content, meta } = parseMeta(raw, filePath);
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
  }

  function connect(): void {
    ws = new WebSocket(roomUrl);

    ws.on("open", () => {
      console.log("Connected to room");
      ws!.send(JSON.stringify({ type: "set-token", editToken }));
      push(fs.readFileSync(filePath, "utf8"));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "auth-error") {
          console.error(
            "Edit token rejected by relay — check your --edit-token value"
          );
          return;
        }
        if (msg.type === "auth-rejected") {
          const who = msg.editor || "unknown";
          console.log(`  \x1b[31m✗ ${who} — edit rejected (bad token)\x1b[0m`);
          return;
        }
        if (msg.type !== "update") return;

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
          const dim = "\x1b[2m";
          const reset = "\x1b[0m";
          console.log(
            `  ${dim}${who}${reset}  ${preview}${preview.length >= 60 ? "..." : ""}`
          );
        }
      } catch {
        /* ignore malformed */
      }
    });

    ws.on("close", () => {
      console.log("Disconnected — reconnecting in 2s...");
      setTimeout(connect, 2000);
    });

    ws.on("error", (e: Error) => console.error("WS error:", e.message));
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
      console.log("Local change detected — pushing...");
      push(raw);
    });

  connect();
}
