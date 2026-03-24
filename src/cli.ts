#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { Command } from "commander";
import { startWatcher } from "./watcher";

const program = new Command();

program
  .name("livedown")
  .description("Edit markdown locally, share it live in a browser.")
  .version("0.1.0")
  .argument("[file]", "Path to the markdown file to watch")
  .option(
    "-d, --doc <name>",
    "Document name (defaults to filename without extension)"
  )
  .option(
    "-r, --relay <host>",
    "PartyKit relay host",
    process.env.PARTYKIT_HOST || "livedown.dwmkerr.partykit.dev"
  )
  .option(
    "-e, --editor <name>",
    "Editor name shown to viewers",
    process.env.LIVEDOWN_EDITOR || os.hostname().split(".")[0]
  )
  .option(
    "-p, --password <password>",
    "Room password",
    process.env.LIVEDOWN_PASSWORD
  )
  .action(
    (
      file: string | undefined,
      opts: {
        doc?: string;
        relay: string;
        editor: string;
        password?: string;
      }
    ) => {
      if (!file) {
        program.help();
        return;
      }

      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`Error: file not found: ${filePath}`);
        process.exit(1);
      }

      const doc = opts.doc || path.basename(filePath, path.extname(filePath));
      const relay = opts.relay;
      const proto = relay.startsWith("localhost") ? "ws" : "wss";
      const roomUrl = `${proto}://${relay}/parties/main/${encodeURIComponent(doc)}`;
      const viewerProto = relay.startsWith("localhost") ? "http" : "https";
      const viewerUrl = `${viewerProto}://${relay}/#${doc}`;

      console.log(`\n  Watching  ${filePath}`);
      console.log(
        `  Join      \x1b[4m\x1b]8;;${viewerUrl}\x07${viewerUrl}\x1b]8;;\x07\x1b[24m\n`
      );

      startWatcher(filePath, doc, roomUrl, opts.editor);
    }
  );

program
  .command("deploy")
  .description("Deploy your own PartyKit relay")
  .action(() => {
    console.log("Run the following to deploy your own relay:\n");
    console.log("  npx partykit deploy\n");
    console.log("Then use --relay <your-host> when running livedown start.");
  });

program.parse();
