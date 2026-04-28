// Shared components + sample data for all livedown design variants.
// Everything is exported onto window so Babel-transpiled siblings can see it.

const SAMPLE_MD = `# Livedown Architecture

Livedown lets you share a local file and collaborate on it live — across browsers, terminals, IDEs, and machines. You edit locally, everyone else sees it instantly.

This page covers the essentials of how livedown works, and then some specific journeys:

- [Sharing a local file to web](#journey-1)
- [Edit live, from local file to browser](#journey-2)
- [Sharing to a remote machine](#journey-3) — one file synchronised across machines

## Overview

\`\`\`mermaid
flowchart LR
  cli[CLI · Share<br/>Local File]
  relay((Stateful Room<br/>Relay))
  web[Website<br/>Viewer UI]
  join[CLI · Join<br/>Local File]

  cli -- signed --> relay
  relay -- verified --> cli
  web <-- WebSocket --> relay
  relay -- signed --> join
  join -- verified --> relay
\`\`\`

The relay is a stateful WebSocket room. It holds a single room per shared document, tracks which connections are sharers, verifies signatures on every push, and broadcasts verified updates to all connected clients.

| Component | Code | Runtime |
|-----------|------|---------|
| CLI + Watcher | \`src/cli.ts\` | Node.js |
| Relay | \`src/party/livedown.ts\` | Cloudflare Workers |
| Browser Viewer | \`public/index.html\` | Browser |`;

const RENDERED_SAMPLE = `<h1>Livedown Architecture</h1>
<p>Livedown lets you share a local file and collaborate on it live — across browsers, terminals, IDEs, and machines. You edit locally, everyone else sees it instantly.</p>
<p>This page covers the essentials of how livedown works, and then some specific journeys:</p>
<ul>
  <li><a href="#">Sharing a local file to web</a></li>
  <li><a href="#">Edit live, from local file to browser</a></li>
  <li><a href="#">Sharing to a remote machine</a> — one file synchronised across machines</li>
</ul>
<h2>Overview</h2>
<div class="md-mermaid">
  <svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:680px;height:auto;font-family:var(--sans);">
    <defs>
      <marker id="mm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker>
    </defs>
    <!-- nodes -->
    <g>
      <rect x="20" y="80" width="140" height="60" rx="8" fill="#f0f4ff" stroke="#94a3d6"/>
      <text x="90" y="105" text-anchor="middle" font-size="13" font-weight="600" fill="#1e293b">CLI · Share</text>
      <text x="90" y="122" text-anchor="middle" font-size="11" fill="#64748b">Local File</text>
    </g>
    <g>
      <ellipse cx="340" cy="110" rx="90" ry="42" fill="#fff7ed" stroke="#fb923c"/>
      <text x="340" y="105" text-anchor="middle" font-size="13" font-weight="600" fill="#1e293b">Stateful Room</text>
      <text x="340" y="122" text-anchor="middle" font-size="11" fill="#64748b">Relay</text>
    </g>
    <g>
      <rect x="520" y="80" width="140" height="60" rx="8" fill="#f0fff4" stroke="#6fbf73"/>
      <text x="590" y="105" text-anchor="middle" font-size="13" font-weight="600" fill="#1e293b">CLI · Join</text>
      <text x="590" y="122" text-anchor="middle" font-size="11" fill="#64748b">Local File</text>
    </g>
    <g>
      <rect x="260" y="10" width="160" height="40" rx="8" fill="#eef2ff" stroke="#94a3d6"/>
      <text x="340" y="28" text-anchor="middle" font-size="13" font-weight="600" fill="#1e293b">Website</text>
      <text x="340" y="42" text-anchor="middle" font-size="11" fill="#64748b">Viewer UI</text>
    </g>
    <!-- edges -->
    <path d="M160 100 L250 100" stroke="#64748b" stroke-width="1.4" fill="none" marker-end="url(#mm-arrow)"/>
    <text x="200" y="94" font-size="10" fill="#64748b">signed</text>
    <path d="M250 120 L160 120" stroke="#64748b" stroke-width="1.4" fill="none" marker-end="url(#mm-arrow)"/>
    <text x="188" y="135" font-size="10" fill="#64748b">verified</text>
    <path d="M430 100 L520 100" stroke="#64748b" stroke-width="1.4" fill="none" marker-end="url(#mm-arrow)"/>
    <text x="460" y="94" font-size="10" fill="#64748b">signed</text>
    <path d="M520 120 L430 120" stroke="#64748b" stroke-width="1.4" fill="none" marker-end="url(#mm-arrow)"/>
    <text x="462" y="135" font-size="10" fill="#64748b">verified</text>
    <path d="M340 50 L340 72" stroke="#64748b" stroke-width="1.4" fill="none" marker-end="url(#mm-arrow)"/>
    <text x="348" y="66" font-size="10" fill="#64748b">WebSocket</text>
  </svg>
</div>
<p>The relay is a stateful WebSocket room. It holds a single room per shared document, tracks which connections are sharers, verifies signatures on every push, and broadcasts verified updates to all connected clients.</p>
<table class="md-table">
  <thead><tr><th>Component</th><th>Code</th><th>Runtime</th></tr></thead>
  <tbody>
    <tr><td>CLI + Watcher</td><td><code>src/cli.ts</code></td><td>Node.js</td></tr>
    <tr><td>Relay</td><td><code>src/party/livedown.ts</code></td><td>Cloudflare Workers</td></tr>
    <tr><td>Browser Viewer</td><td><code>public/index.html</code></td><td>Browser</td></tr>
  </tbody>
</table>`;

// ─── Markdown-ish syntax highlighting for the code pane ──────────────
// (Just enough to look alive; not a real parser.)
function highlightMarkdown(src) {
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = src.split('\n');
  let inFence = false;
  return lines.map((line) => {
    if (/^```/.test(line)) {
      inFence = !inFence;
      return `<span class="md-fence">${esc(line)}</span>`;
    }
    if (inFence) return `<span class="md-code">${esc(line)}</span>`;
    if (/^#{1,6}\s/.test(line)) return `<span class="md-h">${esc(line)}</span>`;
    if (/^\s*[-*+]\s/.test(line)) {
      return esc(line).replace(/^(\s*[-*+]\s)(.*)$/, '<span class="md-list">$1</span>$2')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]</span><span class="md-url">($2)</span>')
        .replace(/`([^`]+)`/g, '<span class="md-inlinecode">`$1`</span>')
        .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>');
    }
    if (/^\|/.test(line)) return `<span class="md-table-row">${esc(line)}</span>`;
    return esc(line)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]</span><span class="md-url">($2)</span>')
      .replace(/`([^`]+)`/g, '<span class="md-inlinecode">`$1`</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>');
  }).join('\n');
}

// ─── Sample roster ───────────────────────────────────────────────────
const ROSTER = [
  { id: 1, name: 'dwmkerr',  color: '#a6e3a1', role: 'sharer',   initials: 'DK', typing: false, lastSeen: 'now' },
  { id: 2, name: 'amy.chen', color: '#89b4fa', role: 'editor',   initials: 'AC', typing: true,  lastSeen: '2s'  },
  { id: 3, name: 'Guest 3',  color: '#cba6f7', role: 'viewer',   initials: 'G3', typing: false, lastSeen: '14s' },
  { id: 4, name: 'Guest 4',  color: '#f9e2af', role: 'viewer',   initials: 'G4', typing: false, lastSeen: '1m'  },
];

const EDIT_HISTORY = [
  { id: 1, who: 'amy.chen', color: '#89b4fa', preview: 'Adds note on noble/curves vs tweetnacl compat.', time: '2s' },
  { id: 2, who: 'dwmkerr',  color: '#a6e3a1', preview: 'Extends table with crypto column, fixes typo.', time: '18s' },
  { id: 3, who: 'amy.chen', color: '#89b4fa', preview: 'Rewords "one file synchronised across machines".', time: '42s' },
  { id: 4, who: 'dwmkerr',  color: '#a6e3a1', preview: 'Initial push — architecture.md v0.1.4.', time: '4m' },
];

// ─── SVG icon set (18×18 default, stroke-based, devtool vibe) ────────
const Icon = ({ name, size = 14, strokeWidth = 1.75, color = 'currentColor', style }) => {
  const paths = {
    file: <><path d="M5 3h7l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M12 3v4h4"/></>,
    link: <><path d="M9 13a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1"/><path d="M13 9a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1"/></>,
    copy: <><rect x="8" y="8" width="10" height="10" rx="1.5"/><path d="M4 14V5a1 1 0 0 1 1-1h9"/></>,
    github: <><path d="M10 2a8 8 0 0 0-2.5 15.6c.4.08.55-.17.55-.38v-1.3c-2.2.48-2.67-1.05-2.67-1.05-.35-.9-.87-1.14-.87-1.14-.7-.5.06-.49.06-.49.78.05 1.2.8 1.2.8.7 1.2 1.85.86 2.3.66.07-.52.28-.87.5-1.07-1.77-.2-3.65-.9-3.65-4 0-.88.31-1.6.83-2.17-.09-.2-.36-1.03.08-2.14 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.17 1.94.08 2.14.52.57.83 1.29.83 2.17 0 3.1-1.88 3.8-3.67 4 .29.25.54.74.54 1.5v2.23c0 .2.14.46.55.38A8 8 0 0 0 10 2z" fill={color} stroke="none"/></>,
    lock: <><rect x="4" y="9" width="12" height="9" rx="1.5"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></>,
    unlock: <><rect x="4" y="9" width="12" height="9" rx="1.5"/><path d="M7 9V6a3 3 0 0 1 5.2-2"/></>,
    key: <><circle cx="7" cy="12" r="3"/><path d="M9.5 10.5 17 4"/><path d="m14 7 2 2"/><path d="m12 9 1.5 1.5"/></>,
    eye: <><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/></>,
    edit: <><path d="m4 16 1-4L14 3l3 3L8 15l-4 1z"/><path d="m12 5 3 3"/></>,
    code: <><path d="m7 7-4 3 4 3"/><path d="m13 7 4 3-4 3"/></>,
    split: <><rect x="2.5" y="4" width="15" height="12" rx="1.5"/><path d="M10 4v12"/></>,
    preview: <><rect x="2.5" y="4" width="15" height="12" rx="1.5"/><path d="M6 8h8M6 11h8M6 14h5"/></>,
    chevron: <path d="m7 5 5 5-5 5"/>,
    dot: <circle cx="10" cy="10" r="3.5" fill={color} stroke="none"/>,
    circle: <circle cx="10" cy="10" r="6"/>,
    check: <path d="m4 10 4 4 8-8"/>,
    x: <><path d="m5 5 10 10"/><path d="m15 5-10 10"/></>,
    plus: <><path d="M10 4v12"/><path d="M4 10h12"/></>,
    arrowRight: <><path d="M4 10h12"/><path d="m12 5 5 5-5 5"/></>,
    shield: <path d="M10 2 4 5v5c0 4 2.5 6.5 6 8 3.5-1.5 6-4 6-8V5l-6-3z"/>,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 1.5"/></>,
    users: <><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3 3-5 6-5s6 2 6 5"/><circle cx="15" cy="6" r="2.5"/><path d="M13 17c0-2 1.5-3.5 3.5-3.5"/></>,
    terminal: <><rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/><path d="m6 8 2.5 2L6 12"/><path d="M11 13h3"/></>,
    download: <><path d="M10 3v10"/><path d="m6 9 4 4 4-4"/><path d="M4 17h12"/></>,
    radio: <><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="2.5" fill={color} stroke="none"/></>,
    menu: <><path d="M3 6h14"/><path d="M3 10h14"/><path d="M3 14h14"/></>,
    book: <><path d="M4 4h5a3 3 0 0 1 3 3v10a2 2 0 0 0-2-2H4V4z"/><path d="M16 4h-5a3 3 0 0 0-3 3v10a2 2 0 0 1 2-2h6V4z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      {paths[name] || null}
    </svg>
  );
};

// ─── Presence dot ────────────────────────────────────────────────────
const PresenceDot = ({ color = 'var(--ld-green)', pulsing = false, size = 7 }) => (
  <span style={{
    display: 'inline-block', width: size, height: size, borderRadius: '50%',
    background: color,
    boxShadow: pulsing ? `0 0 0 0 ${color}55` : 'none',
    animation: pulsing ? 'ld-pulse 1.8s ease-out infinite' : 'none',
    flexShrink: 0,
  }}/>
);

// ─── Avatar with monogram ────────────────────────────────────────────
const Avatar = ({ person, size = 20, ring }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%',
    background: person.color,
    color: '#17171f',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--mono)', fontSize: Math.round(size * 0.42), fontWeight: 700,
    flexShrink: 0,
    boxShadow: ring ? `0 0 0 2px var(--ld-bg), 0 0 0 ${2 + (ring === 'thick' ? 2 : 1)}px ${person.color}` : 'none',
  }}>{person.initials}</span>
);

// ─── Global one-shot styles ──────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ld-styles')) {
  const s = document.createElement('style');
  s.id = 'ld-styles';
  s.textContent = `
    @keyframes ld-pulse {
      0% { box-shadow: 0 0 0 0 currentColor; }
      70% { box-shadow: 0 0 0 6px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    @keyframes ld-caret {
      0%, 50% { opacity: 1; }
      50.01%, 100% { opacity: 0; }
    }
    @keyframes ld-dots {
      0%, 20% { content: ''; }
      40% { content: '.'; }
      60% { content: '..'; }
      80%, 100% { content: '...'; }
    }
    @keyframes ld-flash {
      0% { background: rgba(203,166,247,.2); }
      100% { background: transparent; }
    }
    .ld-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .ld-scroll::-webkit-scrollbar-thumb { background: var(--ld-border-2); border-radius: 4px; }
    .ld-scroll::-webkit-scrollbar-track { background: transparent; }

    /* code-pane syntax colors */
    .md-h { color: var(--ld-blue); font-weight: 600; }
    .md-bold { color: var(--ld-pink); font-weight: 600; }
    .md-list { color: var(--ld-peach); }
    .md-link { color: var(--ld-green); }
    .md-url { color: var(--ld-teal); }
    .md-fence { color: var(--ld-fg-dimmer); }
    .md-code { color: var(--ld-yellow); }
    .md-inlinecode { color: var(--ld-yellow); }
    .md-table-row { color: var(--ld-fg-2); }

    /* rendered preview */
    .md-pre { background: #f6f8fa; border: 1px solid #e4e6eb; border-radius: 6px; padding: 14px 16px; overflow-x: auto; font-family: var(--mono); font-size: 11.5px; line-height: 1.55; color: #24292e; margin: 12px 0; }
    .md-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
    .md-table th, .md-table td { border: 1px solid #e4e6eb; padding: 6px 10px; text-align: left; }
    .md-table th { background: #f6f8fa; font-weight: 600; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  SAMPLE_MD, RENDERED_SAMPLE,
  highlightMarkdown, ROSTER, EDIT_HISTORY,
  Icon, PresenceDot, Avatar,
});
