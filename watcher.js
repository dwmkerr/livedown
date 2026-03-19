#!/usr/bin/env node
// Usage: node watcher.js <file.md> [doc-name]
// Watches a local markdown file and syncs it to a PartyKit room.
// Also receives updates from the room and writes them to the local file.

const os = require('os');
const chokidar = require('chokidar');
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const { WebSocket } = require('ws');

const FILE = process.argv[2];
const DOC  = process.argv[3] || path.basename(FILE, '.md');
const HOST   = process.env.PARTYKIT_HOST || 'localhost:1999';
const PROTO  = HOST.startsWith('localhost') ? 'ws' : 'wss';
const EDITOR = process.env.LIVEDOWN_EDITOR || os.hostname().split('.')[0];
const ROOM_URL = `${PROTO}://${HOST}/parties/main/${encodeURIComponent(DOC)}`;

if (!FILE) {
  console.error('Usage: node watcher.js <file.md> [doc-name]');
  process.exit(1);
}

console.log(`Watching: ${path.resolve(FILE)}`);
console.log(`Room:     ${ROOM_URL}`);
console.log(`Viewer:   http://${HOST}/#${DOC}\n`);

let ws = null;
let ignoreNextWrite = false;  // prevent echo-loop when we write a remote update locally

function parseMeta(raw) {
  const parsed = matter(raw);
  return {
    content: parsed.content,
    meta: {
      owner:       parsed.data.owner       || null,
      github_repo: parsed.data.github_repo || null,
      title:       parsed.data.title       || path.basename(FILE, '.md'),
    },
  };
}

function push(raw) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const { content, meta } = parseMeta(raw);
  ws.send(JSON.stringify({ type: 'push', content, meta: { ...meta, editor: EDITOR, editedAt: new Date().toISOString(), file: DOC } }));
}

function connect() {
  ws = new WebSocket(ROOM_URL);

  ws.on('open', () => {
    console.log('Connected to room');
    // Push current file state immediately so new viewers are in sync
    push(fs.readFileSync(FILE, 'utf8'));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type !== 'update') return;

      // Reconstruct the full file with frontmatter from meta + body content
      const meta = msg.meta || {};
      let frontmatter = '';
      if (meta.owner || meta.github_repo || meta.title) {
        const lines = ['---'];
        if (meta.owner)       lines.push(`owner: "${meta.owner}"`);
        if (meta.github_repo) lines.push(`github_repo: "${meta.github_repo}"`);
        if (meta.title)       lines.push(`title: "${meta.title}"`);
        lines.push('---\n');
        frontmatter = lines.join('\n');
      }
      const newRaw = frontmatter + msg.content;
      const currentRaw = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';

      if (newRaw !== currentRaw) {
        ignoreNextWrite = true;
        fs.writeFileSync(FILE, newRaw, 'utf8');
        console.log('Remote update written to', FILE);
      }
    } catch { /* ignore */ }
  });

  ws.on('close', () => {
    console.log('Disconnected — reconnecting in 2s…');
    setTimeout(connect, 2000);
  });

  ws.on('error', (e) => console.error('WS error:', e.message));
}

// Watch local file for changes
chokidar.watch(FILE, {
  awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 10 },
}).on('change', () => {
  if (ignoreNextWrite) { ignoreNextWrite = false; return; }
  const raw = fs.readFileSync(FILE, 'utf8');
  console.log('Local change detected — pushing…');
  push(raw);
});

connect();

// Install ws if needed
try { require('ws'); } catch {
  console.error('Run: npm install ws');
  process.exit(1);
}
