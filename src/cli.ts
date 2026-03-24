#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { startWatcher } from "./watcher";

const DEFAULT_RELAY = "livedown.dwmkerr.partykit.dev";

function buildViewerUrl(relay: string, doc: string): string {
  const proto = relay.startsWith("localhost") ? "http" : "https";
  return `${proto}://${relay}/#${doc}`;
}

function buildRoomUrl(relay: string, doc: string): string {
  const proto = relay.startsWith("localhost") ? "ws" : "wss";
  return `${proto}://${relay}/parties/main/${encodeURIComponent(doc)}`;
}

function startSharing(
  file: string,
  opts: { relay: string; editor: string; doc?: string }
): void {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const doc = opts.doc || path.basename(filePath, path.extname(filePath));
  const viewerUrl = buildViewerUrl(opts.relay, doc);
  const roomUrl = buildRoomUrl(opts.relay, doc);

  console.log(`\n  Watching  ${filePath}`);
  console.log(
    `  Join      \x1b[4m\x1b]8;;${viewerUrl}\x07${viewerUrl}\x1b]8;;\x07\x1b[24m\n`
  );

  startWatcher(filePath, doc, roomUrl, opts.editor);
}

const defaultRelay = process.env.PARTYKIT_HOST || DEFAULT_RELAY;
const defaultEditor =
  process.env.LIVEDOWN_EDITOR || os.hostname().split(".")[0];

const program = new Command();

program
  .name("livedown")
  .description("Edit markdown locally, share it live in a browser.")
  .version("0.1.0");

program
  .command("share")
  .description("Watch a local file and share it live")
  .argument("<file>", "Path to the markdown file")
  .option("-r, --relay <host>", "Relay host", defaultRelay)
  .option("-e, --editor <name>", "Your name shown to viewers", defaultEditor)
  .option("-d, --doc <name>", "Document name (defaults to filename)")
  .action(startSharing);

program
  .command("open")
  .description("Open a shared document in the browser")
  .argument("<url>", "Livedown viewer URL")
  .action((url: string) => {
    const platform = process.platform;
    const cmd =
      platform === "darwin"
        ? "open"
        : platform === "win32"
          ? "start"
          : "xdg-open";
    try {
      execSync(`${cmd} ${JSON.stringify(url)}`, { stdio: "ignore" });
    } catch {
      console.log(`Open in your browser:\n\n  ${url}\n`);
    }
  });

// No subcommand — prompt for file path
if (process.argv.length === 2) {
  (async () => {
    const { input } = await import("@inquirer/prompts");
    const file = await input({
      message: "File to share:",
      validate: (value) => {
        if (!value.trim()) return "Please enter a file path";
        if (!fs.existsSync(path.resolve(value.trim()))) return "File not found";
        return true;
      },
    });
    startSharing(file.trim(), {
      relay: defaultRelay,
      editor: defaultEditor,
    });
  })();
} else {
  program.parse();
}
