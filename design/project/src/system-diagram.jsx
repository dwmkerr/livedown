// System diagrams — original elaborate version + three iterations.
// Iterations apply user direction: keep the browser webpage view, simplify
// the editor surfaces toward logo + human + agent, partially obscure the relay
// behind the website, drop protocol jargon (partykit / cloudflare / signed / broadcast).

const sectionLabel = {
  fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dimmer)',
  textTransform: 'uppercase', letterSpacing: '0.15em',
};

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function ScaledCanvas({ width, height, children }) {
  const outerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outerRef} style={{ position: 'relative', width: '100%', height: height * scale, margin: '0 auto', fontFamily: 'var(--mono)' }}>
      <div style={{
        position: 'absolute', left: '50%', top: 0, width, height,
        transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center',
      }}>
        {children}
      </div>
    </div>
  );
}

function BrandMark({ kind, size = 28 }) {
  const s = size;
  if (kind === 'cursor') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`cg-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.95"/>
            <stop offset="1" stopColor="#7a7a8c" stopOpacity="0.9"/>
          </linearGradient>
        </defs>
        <path d="M16 3 L28 10 L28 22 L16 29 L4 22 L4 10 Z" fill={`url(#cg-${size})`}/>
        <path d="M16 3 L16 29 L4 22 Z" fill="#fff" opacity="0.18"/>
      </svg>
    );
  }
  if (kind === 'vim') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="#019833"/>
        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="monospace">V</text>
      </svg>
    );
  }
  if (kind === 'claude') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#D97757"/>
        <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff" fontFamily="serif">✦</text>
      </svg>
    );
  }
  if (kind === 'agent') {
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <circle cx="16" cy="16" r="12.5" fill="none" stroke="#cba6f7" strokeWidth="1.4" strokeDasharray="3 3"/>
        <text x="16" y="21" textAnchor="middle" fontSize="14" fill="#cba6f7" fontFamily="serif">✦</text>
      </svg>
    );
  }
  return null;
}

function Human({ color, initials, size = 40, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color, color: '#0a0a10', fontFamily: 'var(--sans)',
        fontWeight: 700, fontSize: size * 0.36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 2px var(--ld-bg), 0 0 0 3px ${color}55`,
      }}>
        {initials}
      </div>
      {label && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)' }}>{label}</div>}
    </div>
  );
}

// Mini browser webpage — reusable across iterations
function BrowserCard({ width = 360, typingBy, typingColor = '#89b4fa', stack = false, scale = 1 }) {
  return (
    <div style={{
      width, background: '#fff', borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.25)',
      fontFamily: 'var(--sans)', transform: `scale(${scale})`, transformOrigin: 'top center',
    }}>
      {/* chrome */}
      <div style={{ height: 28, background: '#ececec', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, borderBottom: '1px solid #d5d5d5' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>
          livedown.dev/#d5dc3b
        </div>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: typingColor, color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          {typingBy?.slice(0, 2).toUpperCase() || 'AC'}
        </div>
      </div>
      {/* page body */}
      <div style={{ padding: '16px 18px', color: '#222' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Architecture</div>
        <div style={{ fontSize: 12.5, color: '#555', marginTop: 8, lineHeight: 1.55 }}>
          Livedown lets you share a local file and collaborate on it live —
          across browsers, terminals, IDEs, and machines.
        </div>
        {/* active edit highlight */}
        <div style={{ marginTop: 12, padding: '6px 8px', background: 'rgba(245,194,231,0.45)', borderRadius: 3, fontSize: 12.5, fontFamily: 'var(--mono)', color: '#333' }}>
          Multi-person, multi-agent editing<span style={{ display: 'inline-block', width: 1.5, height: 11, background: typingColor, marginLeft: 2, verticalAlign: 'middle', animation: 'ld-caret 1s steps(1) infinite' }}/>
        </div>
      </div>
      {/* footer — typing indicator */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #eee', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: '#666', fontFamily: 'var(--sans)' }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: typingColor, color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          {typingBy?.slice(0, 2).toUpperCase() || 'AC'}
        </div>
        <span style={{ flex: 1 }}><b>{typingBy || 'amy.chen'}</b> typing on line 3…</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: '#888', background: '#f0f0f0', padding: '1px 5px', borderRadius: 2 }}>EDITOR</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORIGINAL — Cursor IDE (L) · Browser + Relay (C) · Vim + Claude Code (R)
// (Rebuilt from the version we had before iterations.)
// ─────────────────────────────────────────────────────────────

function SystemDiagramOriginal() {
  return (
    <ScaledCanvas width={1200} height={520}>
      <svg viewBox="0 0 1200 520" width="1200" height="520" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <marker id="ld-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#89b4fa"/>
          </marker>
          <marker id="ld-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#a6e3a1"/>
          </marker>
          <marker id="ld-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#5e5e75"/>
          </marker>
        </defs>
        {/* Cursor (L) ↔ Relay (C) */}
        <path d="M 420 310 C 460 310, 480 305, 500 300" stroke="#89b4fa" strokeWidth="1.6" fill="none" strokeDasharray="5 4" markerEnd="url(#ld-arrow-blue)"/>
        <path d="M 500 330 C 480 335, 460 340, 420 340" stroke="#5e5e75" strokeWidth="1.2" fill="none" strokeDasharray="3 3" markerEnd="url(#ld-arrow-dim)"/>
        {/* Relay (C) ↔ Claude Code (R) */}
        <path d="M 780 310 C 760 305, 740 305, 700 300" stroke="#fab387" strokeWidth="1.6" fill="none" strokeDasharray="5 4"/>
        <path d="M 700 330 C 740 335, 760 340, 780 340" stroke="#5e5e75" strokeWidth="1.2" fill="none" strokeDasharray="3 3" markerEnd="url(#ld-arrow-dim)"/>
        {/* Browser → Relay */}
        <path d="M 560 210 L 560 250" stroke="#89b4fa" strokeWidth="1.6" fill="none" strokeDasharray="5 4" markerEnd="url(#ld-arrow-blue)"/>
        <path d="M 640 250 L 640 210" stroke="#a6e3a1" strokeWidth="1.6" fill="none" strokeDasharray="5 4" markerEnd="url(#ld-arrow-green)"/>
        {/* labels */}
        <text x="470" y="300" fontSize="10" fill="#89b4fa" fontFamily="var(--mono)">signed</text>
        <text x="450" y="360" fontSize="10" fill="#5e5e75" fontFamily="var(--mono)">→ disk</text>
        <text x="710" y="300" fontSize="10" fill="#fab387" fontFamily="var(--mono)">signed</text>
        <text x="720" y="360" fontSize="10" fill="#5e5e75" fontFamily="var(--mono)">→ disk</text>
        <text x="530" y="240" fontSize="10" fill="#89b4fa" fontFamily="var(--mono)">push</text>
        <text x="610" y="240" fontSize="10" fill="#a6e3a1" fontFamily="var(--mono)">broadcast</text>
        {/* animated packets */}
        <circle r="3" fill="#89b4fa"><animateMotion dur="2.8s" repeatCount="indefinite" path="M 420 310 C 460 310, 480 305, 500 300"/></circle>
        <circle r="3" fill="#fab387"><animateMotion dur="2.8s" begin="1.4s" repeatCount="indefinite" path="M 780 310 C 760 305, 740 305, 700 300"/></circle>
      </svg>

      {/* Browser — top center */}
      <div style={{ position: 'absolute', left: 420, top: 20, width: 360 }}>
        <BrowserCard width={360} typingBy="amy.chen" typingColor="#89b4fa"/>
      </div>

      {/* Relay node — middle center */}
      <div style={{ position: 'absolute', left: 500, top: 250, width: 200, textAlign: 'center' }}>
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: 'linear-gradient(180deg, #1a1a28, #13131e)',
          border: '1px solid #2a2a38', boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ld-green)', letterSpacing: '0.15em', marginBottom: 6 }}>● RELAY</div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ld-fg)' }}>Stateful room</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-fg-dim)', marginTop: 3 }}>PartyKit · Cloudflare Workers</div>
          <div style={{ marginTop: 10, padding: '6px 8px', borderRadius: 6, background: '#0d0d14', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-fg-dim)' }}>
            1 doc · 3 sharers · 2 viewers
          </div>
        </div>
      </div>

      {/* Cursor (L) */}
      <CursorSurfaceOriginal/>

      {/* Vim + Claude Code (R) */}
      <ClaudeCodeSurfaceOriginal/>

      {/* bottom caption pill */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        padding: '5px 14px', borderRadius: 99, background: '#0d0d14', border: '1px solid #2a2a38',
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)' }}>
        ✦ 3 humans · 2 agents · 1 file · in sync across 3 machines
      </div>
    </ScaledCanvas>
  );
}

function CursorSurfaceOriginal() {
  return (
    <div style={{ position: 'absolute', left: 10, top: 160, width: 410, height: 300,
      background: '#1e1e2e', border: '1px solid #2a2a38', borderRadius: 10, overflow: 'hidden',
      fontFamily: 'var(--mono)', boxShadow: '0 10px 28px rgba(0,0,0,.4)' }}>
      <div style={{ height: 22, background: '#181825', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, borderBottom: '1px solid #2a2a38' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: '#8a8aa0', fontFamily: 'var(--sans)' }}>spec.md — livedown</div>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#89b4fa', color: '#000', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>AC</div>
      </div>
      <div style={{ display: 'flex', height: 'calc(100% - 22px - 18px)' }}>
        {/* activity bar */}
        <div style={{ width: 22, background: '#181825', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 8, borderRight: '1px solid #2a2a38' }}>
          <span style={{ fontSize: 10, color: '#cba6f7' }}>▤</span>
          <span style={{ fontSize: 10, color: '#5e5e75' }}>⌕</span>
          <span style={{ fontSize: 10, color: '#5e5e75' }}>⎇</span>
          <span style={{ fontSize: 10, color: '#5e5e75' }}>✦</span>
        </div>
        {/* file tree */}
        <div style={{ width: 78, background: '#11111a', padding: '6px 8px', fontSize: 9.5, color: '#cdd6f4', borderRight: '1px solid #2a2a38' }}>
          <div style={{ color: '#5e5e75', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>livedown</div>
          <div style={{ color: '#8a8aa0' }}>▸ docs</div>
          <div style={{ color: '#89b4fa' }}>● spec.md</div>
          <div style={{ color: '#8a8aa0' }}>readme.md</div>
          <div style={{ color: '#8a8aa0' }}>▸ src</div>
          <div style={{ color: '#8a8aa0' }}>▸ relay</div>
        </div>
        {/* editor */}
        <div style={{ flex: 1, background: '#1e1e2e', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 20, background: '#181825', display: 'flex', alignItems: 'center', fontSize: 9.5, color: '#cdd6f4', borderBottom: '1px solid #2a2a38' }}>
            <div style={{ background: '#1e1e2e', padding: '3px 9px', borderRight: '1px solid #2a2a38', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#89b4fa' }}>●</span> spec.md
            </div>
          </div>
          <div style={{ padding: '6px 8px', fontSize: 10, lineHeight: 1.55, display: 'flex', gap: 6, flex: 1 }}>
            <div style={{ color: '#5e5e75', textAlign: 'right', userSelect: 'none', minWidth: 12 }}>
              <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><span style={{ color: '#5ec8ff' }}># Architecture</span></div>
              <div style={{ color: '#aaa' }}>Livedown lets you</div>
              <div style={{ color: '#aaa' }}>share…</div>
              <div/>
              <div style={{ background: 'rgba(137,180,250,.15)' }}><span style={{ color: '#89b4fa' }}>+</span> API examples<span style={{ display: 'inline-block', width: 6, height: 10, background: '#89b4fa', marginLeft: 1, verticalAlign: 'middle', animation: 'ld-caret 1s steps(1) infinite' }}/></div>
              <div style={{ color: '#aaa' }}><span style={{ color: '#5ec8ff' }}>## Next</span></div>
            </div>
          </div>
        </div>
        {/* agent panel */}
        <div style={{ width: 128, background: '#181825', borderLeft: '1px solid #2a2a38', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '7px 9px', fontSize: 9.5, color: '#cdd6f4', borderBottom: '1px solid #2a2a38', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#cba6f7' }}>✦</span>
            <span style={{ fontWeight: 600 }}>Agent</span>
            <div style={{ flex: 1 }}/>
            <span style={{ color: '#5e5e75', fontSize: 8.5 }}>⌘L</span>
          </div>
          <div style={{ padding: '8px 9px', fontSize: 9, lineHeight: 1.5, color: '#cdd6f4', flex: 1 }}>
            <div style={{ color: '#8a8aa0', marginBottom: 4 }}>Regenerating §3…</div>
            <div style={{ border: '1px solid #2a2a38', borderRadius: 3, padding: '3px 5px', fontSize: 8.5, color: '#a6e3a1' }}>⏺ Edit spec.md</div>
          </div>
          <div style={{ borderTop: '1px solid #2a2a38', padding: '5px 9px', fontSize: 8.5, color: '#5e5e75', whiteSpace: 'nowrap' }}>sonnet-4.5 ▾</div>
        </div>
      </div>
      {/* status bar */}
      <div style={{ height: 18, background: '#89b4fa', color: '#0a0a10', padding: '0 8px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 9.5, fontWeight: 600 }}>
        <span style={{ background: '#0a0a10', color: '#89b4fa', padding: '0 5px', fontSize: 8.5, letterSpacing: '0.1em' }}>LEADER</span>
        <span style={{ fontWeight: 400 }}>$ livedown share</span>
        <div style={{ flex: 1 }}/>
        <span style={{ fontWeight: 400 }}>● live</span>
      </div>
    </div>
  );
}

function ClaudeCodeSurfaceOriginal() {
  return (
    <div style={{ position: 'absolute', right: 10, top: 160, width: 410, height: 300,
      background: '#0d0d14', border: '1px solid #2a2a38', borderRadius: 10, overflow: 'hidden',
      fontFamily: 'var(--mono)', boxShadow: '0 10px 28px rgba(0,0,0,.4)' }}>
      <div style={{ height: 22, background: '#11111a', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, borderBottom: '1px solid #2a2a38' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: '#8a8aa0', fontFamily: 'var(--sans)' }}>jia.w@laptop — tmux</div>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fab387', color: '#000', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>JW</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 22px)' }}>
        {/* vim */}
        <div style={{ flex: 1, background: '#000', padding: '6px 8px', fontSize: 10.5, lineHeight: 1.55, color: '#e5e5e5', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
            <div style={{ color: '#5e5e75', textAlign: 'right', userSelect: 'none', minWidth: 16 }}>
              <div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>
            </div>
            <div style={{ flex: 1 }}>
              <div><span style={{ color: '#5ec8ff' }}># Architecture</span></div>
              <div style={{ color: '#aaa' }}>Livedown lets you share…</div>
              <div style={{ color: '#aaa' }}>Multi-person, multi-agent editing</div>
              <div/>
              <div style={{ background: 'rgba(250,179,135,.15)' }}><span style={{ color: '#fab387' }}>+</span> API examples<span style={{ display: 'inline-block', width: 7, height: 10, background: '#fab387', marginLeft: 1, verticalAlign: 'middle', animation: 'ld-caret 1s steps(1) infinite' }}/></div>
              <div style={{ color: '#aaa' }}><span style={{ color: '#5ec8ff' }}>## Next</span></div>
            </div>
          </div>
          <div style={{ background: '#a6e3a1', color: '#000', padding: '1px 6px', fontSize: 9.5, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <span style={{ background: '#000', color: '#a6e3a1', padding: '0 5px' }}>-- INSERT --</span>
            <span style={{ fontWeight: 400 }}>spec.md</span>
            <div style={{ flex: 1 }}/>
            <span style={{ fontWeight: 400 }}>utf-8</span>
            <span style={{ fontWeight: 400 }}>5:18</span>
            <span style={{ fontWeight: 400 }}>62%</span>
          </div>
        </div>
        <div style={{ height: 1, background: '#2a2a38' }}/>
        {/* claude code */}
        <div style={{ height: 160, background: '#0d0d14', padding: '7px 10px', fontSize: 10, lineHeight: 1.55, color: '#e5e5e5', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, whiteSpace: 'nowrap' }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#D97757', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--sans)' }}>✦</div>
            <span style={{ color: '#D97757', fontWeight: 700, fontSize: 10.5 }}>Claude Code</span>
            <span style={{ color: '#5e5e75', fontSize: 9 }}>sonnet-4.5</span>
          </div>
          <div style={{ flex: 1, fontSize: 9.5 }}>
            <div style={{ color: '#a6e3a1', whiteSpace: 'nowrap' }}>● Read(spec.md) <span style={{ color: '#5e5e75' }}>⎿ 5 lines</span></div>
            <div style={{ color: '#a6e3a1', marginTop: 3 }}>● Edit(spec.md)</div>
            <div style={{ color: '#5e5e75', paddingLeft: 12 }}>⎿ +API examples…</div>
          </div>
          <div style={{ border: '1px solid #2a2a38', borderRadius: 6, padding: '4px 9px', fontSize: 9.5, color: '#cdd6f4', display: 'flex', alignItems: 'center', gap: 6, background: '#11111a', marginTop: 4 }}>
            <span style={{ color: '#D97757' }}>&gt;</span>
            <span style={{ flex: 1 }}>continue with edge cases</span>
            <span style={{ display: 'inline-block', width: 1.5, height: 10, background: '#cdd6f4', animation: 'ld-caret 1s steps(1) infinite' }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, fontSize: 8.5, color: '#5e5e75', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', padding: '2px 5px', borderRadius: 2, background: 'rgba(250,179,135,0.15)', color: '#fab387' }}>JOINED</span>
            <span>livedown join</span>
            <div style={{ flex: 1 }}/>
            <span>124k/200k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ITERATION 1 — Keep browser page view. Simplify sides:
//   just human + tool logo + agent chip. Relay card peeks from
//   behind the browser. Protocol labels removed.
// ─────────────────────────────────────────────────────────────

function SystemDiagramV1() {
  return (
    <ScaledCanvas width={1100} height={480}>
      <svg viewBox="0 0 1100 480" width="1100" height="480" style={{ position: 'absolute', inset: 0 }}>
        {/* soft lines: each side to the browser/room column */}
        <path d="M 250 280 C 360 280, 420 280, 500 270" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        <path d="M 850 280 C 740 280, 680 280, 600 270" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        {/* packets */}
        <circle r="3" fill="#89b4fa"><animateMotion dur="3s" repeatCount="indefinite" path="M 250 280 C 360 280, 420 280, 500 270"/><animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/></circle>
        <circle r="3" fill="#fab387"><animateMotion dur="3s" begin="1.5s" repeatCount="indefinite" path="M 850 280 C 740 280, 680 280, 600 270"/><animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="1.5s" repeatCount="indefinite"/></circle>
      </svg>

      {/* LEFT pod */}
      <SidePod x={120} y={160} color="#89b4fa" initials="AC" name="amy" toolKind="cursor" toolLabel="Cursor" agentLabel="Cursor Agent"/>

      {/* RIGHT pod */}
      <SidePod x={850} y={160} color="#fab387" initials="JW" name="jia" toolKind="vim" toolLabel="Vim + Claude Code" agentLabel="Claude Code" stackedTools={[{ kind: 'vim' }, { kind: 'claude' }]}/>

      {/* CENTER: relay peeking from behind the browser */}
      <div style={{ position: 'absolute', left: 500, top: 260, width: 100 }}>
        <div style={{
          padding: '30px 10px 12px', borderRadius: 10,
          background: 'linear-gradient(180deg, #1a1a28, #0f0f18)',
          border: '1px solid #2a2a38', textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,.4)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ld-green)', letterSpacing: '0.15em' }}>● LIVE ROOM</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ld-fg-dim)', marginTop: 4 }}>d5dc3b</div>
        </div>
      </div>

      {/* Browser, on top of relay */}
      <div style={{ position: 'absolute', left: 370, top: 30, zIndex: 2 }}>
        <BrowserCard width={360} typingBy="amy.chen" typingColor="#89b4fa"/>
      </div>

      {/* caption */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        padding: '5px 14px', borderRadius: 99, background: '#0d0d14', border: '1px solid #2a2a38',
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)' }}>
        ✦ one shared file · everyone sees every edit
      </div>
    </ScaledCanvas>
  );
}

function SidePod({ x, y, color, initials, name, toolKind, toolLabel, agentLabel, stackedTools }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 170,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <Human color={color} initials={initials} size={44} label={name}/>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--ld-bg-3)', border: '1px solid var(--ld-border-2)',
      }}>
        {stackedTools ? (
          <div style={{ display: 'flex' }}>
            {stackedTools.map((t, i) => (
              <div key={i} style={{ marginLeft: i ? -6 : 0, border: '2px solid var(--ld-bg-3)', borderRadius: 6, display: 'flex' }}>
                <BrandMark kind={t.kind} size={26}/>
              </div>
            ))}
          </div>
        ) : (
          <BrandMark kind={toolKind} size={28}/>
        )}
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ld-fg)', fontWeight: 500 }}>{toolLabel}</span>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px 5px 7px', borderRadius: 99,
        background: 'rgba(203,166,247,0.08)', border: '1px solid rgba(203,166,247,0.25)',
      }}>
        <BrandMark kind="agent" size={14}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-mauve)' }}>+ {agentLabel}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ITERATION 2 — Browser centered big, relay as a halo / glow card
//   directly behind it (partially obscured). Humans-with-agents
//   rest on bottom corners; tool logos sit above each human.
// ─────────────────────────────────────────────────────────────

function SystemDiagramV2() {
  return (
    <ScaledCanvas width={1100} height={500}>
      {/* Relay card, larger than the browser, peeking from behind on bottom */}
      <div style={{ position: 'absolute', left: '50%', top: 40, transform: 'translateX(-50%)', zIndex: 1 }}>
        <div style={{
          width: 440, padding: '18px 22px 110px',
          borderRadius: 14, background: 'linear-gradient(180deg, #181828, #0f0f18)',
          border: '1px solid #2a2a38', boxShadow: '0 20px 60px rgba(137,180,250,0.12)',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-green)', letterSpacing: '0.15em', justifyContent: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ld-green)', boxShadow: '0 0 8px var(--ld-green)' }}/>
            LIVE ROOM · d5dc3b
          </div>
        </div>
      </div>

      {/* Browser, slightly nudged to overlap relay */}
      <div style={{ position: 'absolute', left: '50%', top: 74, transform: 'translateX(-50%)', zIndex: 2 }}>
        <BrowserCard width={380} typingBy="amy.chen" typingColor="#89b4fa"/>
      </div>

      {/* connection lines — subtle, without labels */}
      <svg viewBox="0 0 1100 500" width="1100" height="500" style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <path d="M 180 380 C 300 380, 420 340, 500 310" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        <path d="M 920 380 C 800 380, 680 340, 600 310" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        <circle r="3" fill="#89b4fa"><animateMotion dur="3.2s" repeatCount="indefinite" path="M 180 380 C 300 380, 420 340, 500 310"/><animate attributeName="opacity" values="0;1;1;0" dur="3.2s" repeatCount="indefinite"/></circle>
        <circle r="3" fill="#fab387"><animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" path="M 920 380 C 800 380, 680 340, 600 310"/><animate attributeName="opacity" values="0;1;1;0" dur="3.2s" begin="1.6s" repeatCount="indefinite"/></circle>
      </svg>

      {/* bottom-left: tool logo, human, agent chip, stacked */}
      <BottomPod x={60} y={330} color="#89b4fa" initials="AC" name="amy" tools={[{ kind: 'cursor', label: 'Cursor' }]} agent="Cursor Agent"/>
      <BottomPod x={870} y={330} color="#fab387" initials="JW" name="jia" tools={[{ kind: 'vim', label: 'Vim' }, { kind: 'claude', label: 'Claude Code' }]} agent="Claude Code"/>

      {/* caption */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        padding: '5px 14px', borderRadius: 99, background: '#0d0d14', border: '1px solid #2a2a38',
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)' }}>
        ✦ same file · every machine · at the same time
      </div>
    </ScaledCanvas>
  );
}

function BottomPod({ x, y, color, initials, name, tools, agent }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 170,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {tools.map((t, i) => (
          <div key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: 'var(--ld-bg-3)', border: '1px solid var(--ld-border-2)',
          }}>
            <BrandMark kind={t.kind} size={20}/>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: 'var(--ld-fg-2)' }}>{t.label}</span>
          </div>
        ))}
      </div>
      <Human color={color} initials={initials} size={44} label={name}/>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 7px', borderRadius: 99,
        background: 'rgba(203,166,247,0.08)', border: '1px solid rgba(203,166,247,0.25)',
      }}>
        <BrandMark kind="agent" size={13}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-mauve)' }}>+ {agent}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ITERATION 3 — Browser anchors the whole composition. Humans appear
//   inside the browser's presence roster (tiny avatars). Sides show
//   only "tool + agent" — since the humans are in the browser, the
//   sides are their surfaces. Relay badge tucked behind, bottom corner.
// ─────────────────────────────────────────────────────────────

function SystemDiagramV3() {
  return (
    <ScaledCanvas width={1100} height={460}>
      <svg viewBox="0 0 1100 460" width="1100" height="460" style={{ position: 'absolute', inset: 0 }}>
        <path d="M 245 235 C 340 235, 420 235, 490 235" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        <path d="M 855 235 C 760 235, 680 235, 610 235" stroke="#2a2a38" strokeWidth="1.4" fill="none"/>
        <circle r="3" fill="#89b4fa"><animateMotion dur="3s" repeatCount="indefinite" path="M 245 235 C 340 235, 420 235, 490 235"/><animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/></circle>
        <circle r="3" fill="#fab387"><animateMotion dur="3s" begin="1.5s" repeatCount="indefinite" path="M 855 235 C 760 235, 680 235, 610 235"/><animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="1.5s" repeatCount="indefinite"/></circle>
      </svg>

      {/* relay tucked behind the browser, offset down-right */}
      <div style={{ position: 'absolute', left: '50%', top: 80, transform: 'translateX(calc(-50% + 30px))', zIndex: 1 }}>
        <div style={{
          width: 380, height: 300, borderRadius: 14,
          background: 'linear-gradient(180deg, #1a1a28, #0f0f18)',
          border: '1px solid #2a2a38', boxShadow: '0 20px 50px rgba(0,0,0,.45)',
          padding: '14px 18px',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-green)', letterSpacing: '0.15em' }}>● LIVE ROOM</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ld-fg-dim)', marginTop: 6 }}>livedown.dev/#d5dc3b</div>
        </div>
      </div>

      {/* browser with presence roster */}
      <div style={{ position: 'absolute', left: '50%', top: 50, transform: 'translateX(calc(-50% - 20px))', zIndex: 2 }}>
        <BrowserCardWithRoster width={380}/>
      </div>

      {/* LEFT: tool + agent pair */}
      <div style={{ position: 'absolute', left: 70, top: 200, width: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <SurfaceChip tool={{ kind: 'cursor', label: 'Cursor' }} agent="Cursor Agent" accent="#89b4fa" owner={{ initials: 'AC', color: '#89b4fa' }}/>
      </div>
      {/* RIGHT: tool stack + agent */}
      <div style={{ position: 'absolute', right: 70, top: 200, width: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <SurfaceChip tool={{ kind: 'vim', label: 'Vim' }} stackTool={{ kind: 'claude' }} agent="Claude Code" accent="#fab387" owner={{ initials: 'JW', color: '#fab387' }}/>
      </div>

      {/* caption */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        padding: '5px 14px', borderRadius: 99, background: '#0d0d14', border: '1px solid #2a2a38',
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)' }}>
        ✦ amy edits in the browser · jia edits in Vim · Claude Code pitches in
      </div>
    </ScaledCanvas>
  );
}

function BrowserCardWithRoster({ width }) {
  return (
    <div style={{
      width, background: '#fff', borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)', fontFamily: 'var(--sans)',
    }}>
      <div style={{ height: 28, background: '#ececec', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, borderBottom: '1px solid #d5d5d5' }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }}/>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e' }}/>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }}/>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>
          livedown.dev/#d5dc3b
        </div>
      </div>
      {/* roster strip below chrome */}
      <div style={{ padding: '8px 14px', background: '#fafafa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#555' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#888', letterSpacing: '0.1em' }}>IN ROOM</span>
        <div style={{ flex: 1 }}/>
        {[{ c: '#89b4fa', i: 'AC' }, { c: '#fab387', i: 'JW' }, { c: '#cba6f7', i: '✦' }].map((p, k) => (
          <div key={k} style={{
            width: 20, height: 20, borderRadius: '50%', background: p.c, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700,
            marginLeft: k ? -4 : 0, border: '2px solid #fafafa',
          }}>{p.i}</div>
        ))}
      </div>
      <div style={{ padding: '16px 18px', color: '#222' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Architecture</div>
        <div style={{ fontSize: 12.5, color: '#555', marginTop: 8, lineHeight: 1.55 }}>
          Livedown lets you share a local file and collaborate on it live —
          across browsers, terminals, IDEs, and machines.
        </div>
        <div style={{ marginTop: 12, padding: '6px 8px', background: 'rgba(137,180,250,0.14)', borderRadius: 3, fontSize: 12.5, fontFamily: 'var(--mono)', color: '#333' }}>
          Multi-person, multi-agent editing<span style={{ display: 'inline-block', width: 1.5, height: 11, background: '#89b4fa', marginLeft: 2, verticalAlign: 'middle', animation: 'ld-caret 1s steps(1) infinite' }}/>
        </div>
        {/* inline agent activity */}
        <div style={{ marginTop: 10, padding: '6px 8px', background: 'rgba(203,166,247,0.12)', borderRadius: 3, fontSize: 11.5, color: '#444', fontFamily: 'var(--mono)' }}>
          <span style={{ color: '#8e63d0' }}>✦ Claude Code</span> added API examples
        </div>
      </div>
      <div style={{ padding: '8px 16px', borderTop: '1px solid #eee', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#89b4fa', color: '#fff', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>AC</div>
        <span><b>amy</b> typing on line 3…</span>
      </div>
    </div>
  );
}

function SurfaceChip({ tool, stackTool, agent, accent, owner }) {
  return (
    <div style={{
      width: '100%', padding: '14px 14px 12px', borderRadius: 14,
      background: 'var(--ld-bg-2)', border: `1px solid ${accent}33`,
      boxShadow: `0 6px 20px ${accent}08`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <BrandMark kind={tool.kind} size={30}/>
        {stackTool && (
          <>
            <span style={{ color: 'var(--ld-fg-dimmer)' }}>+</span>
            <BrandMark kind={stackTool.kind} size={30}/>
          </>
        )}
      </div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ld-fg)', fontWeight: 500 }}>
        {tool.label}{stackTool ? ` + ${stackTool.kind === 'claude' ? 'Claude Code' : ''}` : ''}
      </div>
      <div style={{ height: 1, background: '#2a2a38', width: '100%' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: owner.color,
          color: '#0a0a10', fontSize: 9, fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)',
        }}>{owner.initials}</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px 3px 6px', borderRadius: 99,
          background: 'rgba(203,166,247,0.1)', border: '1px solid rgba(203,166,247,0.25)',
        }}>
          <BrandMark kind="agent" size={12}/>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ld-mauve)' }}>{agent}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Default export — landing uses the original (at user's request)
// ─────────────────────────────────────────────────────────────

function SystemDiagram() { return <SystemDiagramOriginal/>; }

Object.assign(window, {
  SystemDiagram, SystemDiagramOriginal, SystemDiagramV1, SystemDiagramV2, SystemDiagramV3,
  sectionLabel,
});
