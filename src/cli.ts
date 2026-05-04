#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import { Command } from "commander";
import { startWatcher } from "./watcher";
import { generateEditKeyPair, publicKeyFromEditKey } from "./token";

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf8")
);
const DEFAULT_RELAY = "livedown.dwmkerr.partykit.dev";
const DEV_RELAY = "localhost:1999";

function shortId(): string {
  return crypto.randomBytes(3).toString("hex");
}

function buildViewerUrl(relay: string, doc: string): string {
  const proto = relay.startsWith("localhost") ? "http" : "https";
  return `${proto}://${relay}/#${doc}`;
}

function buildRoomUrl(relay: string, doc: string): string {
  const proto = relay.startsWith("localhost") ? "ws" : "wss";
  return `${proto}://${relay}/parties/main/${encodeURIComponent(doc)}`;
}

async function startSharing(
  file: string,
  opts: {
    relay: string;
    editor: string;
    doc?: string;
    editKey?: string;
    dev?: boolean;
  }
): Promise<void> {
  // --dev forces the local partykit dev server. Explicit -r still wins so
  // users can point at an alternate dev host if they need to.
  if (opts.dev && opts.relay === DEFAULT_RELAY) {
    opts.relay = DEV_RELAY;
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const doc = opts.doc || `${shortId()}/${filename}`;
  let editKey: string;
  let publicKey: string;
  if (opts.editKey) {
    editKey = opts.editKey;
    publicKey = publicKeyFromEditKey(editKey);
  } else {
    const kp = generateEditKeyPair();
    editKey = kp.editKey;
    publicKey = kp.publicKey;
  }
  const viewerUrl = buildViewerUrl(opts.relay, doc);
  const roomUrl = buildRoomUrl(opts.relay, doc);

  console.log(`\n  Watching  ${filePath}`);
  // Show a transient "Connecting..." line that gets overwritten when the
  // watcher is ready. The URL is only printed after the relay acks the sharer
  // so the user can never share a URL before the room is fully established.
  if (process.stdout.isTTY) {
    process.stdout.write(`  \x1b[2mConnecting...\x1b[0m`);
  } else {
    console.log("  Connecting...");
  }

  try {
    await startWatcher(filePath, doc, roomUrl, opts.editor, editKey, publicKey);
  } catch (err) {
    if (process.stdout.isTTY) process.stdout.write("\r\x1b[2K");
    const msg = (err as Error).message;
    console.error(`  \x1b[31m✗ ${msg}\x1b[0m`);
    // --dev targets a local partykit server that the user must start in another
    // shell. Point them at it on any failure — connection-refused, timeout, etc.
    if (opts.dev) {
      console.error(
        `  \x1b[2mIn another terminal run: \x1b[36mnpx partykit dev --port 1999\x1b[0m`
      );
    }
    process.exit(1);
  }

  if (process.stdout.isTTY) process.stdout.write("\r\x1b[2K");
  console.log(
    `  Join      \x1b[4m\x1b]8;;${viewerUrl}\x07${viewerUrl}\x1b]8;;\x07\x1b[24m \x1b[2m(press o to open)\x1b[0m`
  );
  console.log(
    `  Edit key  \x1b[33m${editKey}\x1b[0m \x1b[2m(press c to copy)\x1b[0m\n`
  );

  if (process.stdin.isTTY) {
    const hints = "\x1b[2m  o open  c copy key  q quit\x1b[0m";
    process.stdout.write(hints);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", async (key: Buffer) => {
      const ch = key.toString();
      if (ch === "q" || ch === "\u0003") {
        process.exit(0);
      }
      if (ch === "c") {
        try {
          const { default: clipboardy } = await import("clipboardy");
          await clipboardy.write(editKey);
          process.stdout.write(
            "\x1b[2K\r  \x1b[32m✓ Edit key copied to clipboard\x1b[0m\n"
          );
          process.stdout.write(hints);
        } catch {
          process.stdout.write(
            "\x1b[2K\r  \x1b[31m✗ Could not copy to clipboard\x1b[0m\n"
          );
          process.stdout.write(hints);
        }
      }
      if (ch === "o") {
        try {
          const open = (await import("open")).default;
          await open(viewerUrl);
          process.stdout.write(
            "\x1b[2K\r  \x1b[32m✓ Opened in browser\x1b[0m\n"
          );
          process.stdout.write(hints);
        } catch {
          process.stdout.write(
            "\x1b[2K\r  \x1b[31m✗ Could not open browser\x1b[0m\n"
          );
          process.stdout.write(hints);
        }
      }
    });
  }
}

const defaultRelay = process.env.PARTYKIT_HOST || DEFAULT_RELAY;
const defaultEditor =
  process.env.LIVEDOWN_EDITOR || os.hostname().split(".")[0];

const program = new Command();

program
  .name("livedown")
  .description(
    "Share a local markdown file and collaborate live in a browser and across machines."
  )
  .version(pkg.version)
  // Accept --dev at the root so either argument order works:
  //   npm start -- --dev share ./file.md
  //   npm start -- share --dev ./file.md
  .option("-D, --dev", "Use the local partykit dev server (localhost:1999)");

program
  .command("share")
  .description("Watch a local file and share it live")
  .argument("<file>", "Path to the markdown file")
  .option("-r, --relay <host>", "Relay host", defaultRelay)
  .option("-e, --editor <name>", "Your name shown to viewers", defaultEditor)
  .option("-d, --doc <name>", "Document name (defaults to filename)")
  .option("-k, --edit-key <key>", "Edit key (auto-generated if omitted)")
  .option("-D, --dev", "Use the local partykit dev server (localhost:1999)")
  .action((file, opts) =>
    // Merge root-level --dev so either order works.
    startSharing(file, { ...opts, dev: opts.dev || !!program.opts().dev })
  );

function fileCompleter(line: string): [string[], string] {
  // Determine the directory to list and the prefix to filter by.
  // - Empty input → list current directory
  // - Ends with "/" → list inside that directory
  // - Otherwise → dirname/basename split
  let dir: string;
  let prefix: string;
  let dirPart: string;

  if (!line) {
    dir = ".";
    dirPart = "";
    prefix = "";
  } else if (line.endsWith("/")) {
    dir = line;
    dirPart = line;
    prefix = "";
  } else {
    dir = path.dirname(line) || ".";
    dirPart = line.endsWith("/") ? line : path.dirname(line);
    if (dirPart && !dirPart.endsWith("/")) dirPart += "/";
    if (dirPart === "./") dirPart = "";
    prefix = path.basename(line);
  }

  try {
    const entries = fs.readdirSync(dir);
    const matches = entries
      .filter((e) => e.startsWith(prefix))
      .map((e) => {
        try {
          const full = path.join(dir, e);
          const suffix = fs.statSync(full).isDirectory() ? "/" : "";
          return dirPart + e + suffix;
        } catch {
          return dirPart + e;
        }
      })
      .sort();
    return [matches, line];
  } catch {
    return [[], line];
  }
}

function promptForFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      completer: fileCompleter,
    });
    rl.question("File to share: ", (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!trimmed) return reject(new Error("No file specified"));
      if (!fs.existsSync(path.resolve(trimmed))) {
        return reject(new Error(`File not found: ${trimmed}`));
      }
      resolve(trimmed);
    });
  });
}

// No subcommand — prompt for file path. Bare flags (e.g. `--dev`) without a
// subcommand should still drop into the prompt rather than printing help.
const argv = process.argv.slice(2);
const knownSubcommands = new Set(["share", "help"]);
const hasSubcommand = argv.some((a) => knownSubcommands.has(a));

if (!hasSubcommand) {
  const dev = argv.includes("-D") || argv.includes("--dev");
  (async () => {
    try {
      const file = await promptForFile();
      await startSharing(file, {
        relay: defaultRelay,
        editor: defaultEditor,
        dev,
      });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  })();
} else {
  program.parse();
}
