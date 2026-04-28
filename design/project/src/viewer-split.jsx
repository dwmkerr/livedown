// Viewer v1 — Cursor-style split pane.
// New IA in the top bar: wordmark · file · share url · [spacer] · roster · edits · session timer · identity.
// Mode toggle in the center: [Code] [Split] [Preview].

const { useState, useEffect, useRef } = React;

function TopBar({ mode, setMode, roster, edits, protectedRoom, editorUnlocked, onUnlock }) {
  const [copied, setCopied] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const me = { id: 99, name: 'Guest 3', color: '#cba6f7', initials: 'G3', role: 'viewer' };
  const others = roster.filter(p => p.id !== me.id);

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', height: 34,
      background: 'var(--ld-bg)', borderBottom: '1px solid var(--ld-border)',
      fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ld-fg-2)',
      flexShrink: 0, position: 'relative',
    }}>
      {/* wordmark */}
      <div style={seg}>
        <span style={{ fontWeight: 700, color: 'var(--ld-blue)', letterSpacing: '-0.01em' }}>livedown</span>
        <span style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>v0.1.4</span>
      </div>
      {/* file */}
      <div style={seg}>
        <Icon name="file" size={12} color="var(--ld-fg-dim)" />
        <span style={{ color: 'var(--ld-fg-dim)' }}>docs/</span>
        <span style={{ color: 'var(--ld-fg-2)' }}>architecture.md</span>
      </div>
      {/* share link with [o] open + copy */}
      <div style={seg}>
        <Icon name="link" size={12} color="var(--ld-fg-dim)" />
        <span style={{ color: 'var(--ld-blue)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          livedown.dev/#d5dc3b
        </span>
        <button title="Open in new tab (o)" style={keycapBtn}>
          <span style={{ color: 'var(--ld-mauve)' }}>o</span>
          <span style={{ color: 'var(--ld-fg-dimmer)' }}>open</span>
        </button>
        <button title="Copy link (c)" onClick={copy} style={keycapBtn}>
          <span style={{ color: 'var(--ld-mauve)' }}>c</span>
          <span style={{ color: copied ? 'var(--ld-green)' : 'var(--ld-fg-dimmer)' }}>{copied ? 'copied' : 'copy'}</span>
        </button>
      </div>

      {/* Center mode toggle */}
      <div style={{
        position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)',
        display: 'flex', background: 'var(--ld-bg-3)', borderRadius: 6, padding: 2, gap: 0,
        border: '1px solid var(--ld-border-2)',
      }}>
        {[
          { id: 'code', icon: 'code', label: 'Code' },
          { id: 'split', icon: 'split', label: 'Split' },
          { id: 'preview', icon: 'preview', label: 'Preview' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
            background: mode === m.id ? 'var(--ld-bg-4)' : 'transparent',
            color: mode === m.id ? 'var(--ld-fg)' : 'var(--ld-fg-dim)',
            fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 500,
            transition: 'background .12s',
          }}>
            <Icon name={m.icon} size={11} />
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Activity stream — doc-centric, not user-anchored */}
      <div style={{ ...seg, cursor: 'pointer', position: 'relative' }}
           onClick={() => { setShowActivity(v => !v); setShowRoster(false); }}>
        <Icon name="edit" size={11} color="var(--ld-fg-dim)" />
        <span style={{ color: 'var(--ld-fg-dim)' }}>activity</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 16, height: 14, padding: '0 4px', borderRadius: 7,
          background: 'var(--ld-bg-3)', color: 'var(--ld-yellow)', fontSize: 9.5, fontWeight: 600,
        }}>+{edits.length}</span>
        {showActivity && (
          <div style={{ ...popover, width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={popoverHeader}>Activity · this session</div>
            {edits.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 12px', alignItems: 'flex-start', borderBottom: i < edits.length - 1 ? '1px solid var(--ld-border)' : 'none' }}>
                <span style={{ width: 3, alignSelf: 'stretch', background: e.color, borderRadius: 2, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--ld-fg)', fontSize: 11.5, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.preview}</div>
                  <div style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10, marginTop: 2 }}>
                    <span style={{ color: e.color }}>{e.who}</span>
                    <span style={{ margin: '0 5px' }}>·</span>
                    <span>{e.time} ago</span>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: '6px 12px', color: 'var(--ld-fg-dimmer)', fontSize: 10, background: 'var(--ld-bg-3)', borderTop: '1px solid var(--ld-border)' }}>
              all {edits.length} changes ed25519-verified
            </div>
          </div>
        )}
      </div>

      {/* Roster — you first, then others (borderless to merge with identity) */}
      <div style={{ ...seg, cursor: 'pointer', position: 'relative', gap: 8, borderRight: 'none', background: 'var(--ld-bg-2)', paddingRight: 12 }}
           onClick={() => { setShowRoster(v => !v); setShowActivity(false); }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar person={me} size={20} ring="thin"/>
          <span style={{ color: 'var(--ld-fg-2)' }}>{me.name}</span>
          {protectedRoom && (
            editorUnlocked
              ? <span style={{ color: 'var(--ld-green)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                  <Icon name="unlock" size={10}/> editor
                </span>
              : <button onClick={(e) => { e.stopPropagation(); onUnlock(); }} style={{
                  background: 'transparent', border: '1px solid var(--ld-border-2)',
                  color: 'var(--ld-blue)', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Icon name="key" size={10}/> Enter edit key
                </button>
          )}
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--ld-border-2)' }}/>
        <div style={{ display: 'flex' }}>
          {others.slice(0, 4).map((p, i) => (
            <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -6, position: 'relative' }}>
              <Avatar person={p} size={20} ring={p.role === 'sharer' ? 'thick' : null} />
              {p.typing && (
                <span style={{
                  position: 'absolute', bottom: -1, right: -2, width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--ld-mauve)', border: '1.5px solid var(--ld-bg-2)',
                  animation: 'ld-pulse 1.2s ease-out infinite', color: 'var(--ld-mauve)',
                }}/>
              )}
            </div>
          ))}
          {others.length > 4 && (
            <span style={{ marginLeft: 4, color: 'var(--ld-fg-dim)', fontSize: 10, alignSelf: 'center' }}>+{others.length - 4}</span>
          )}
        </div>
        {showRoster && (
          <div style={popover} onClick={e => e.stopPropagation()}>
            <div style={popoverHeader}>In this room</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(203,166,247,0.06)' }}>
              <Avatar person={me} size={22} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--ld-fg)', fontSize: 11.5 }}>{me.name} <span style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>(you)</span></div>
                <div style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>
                  {editorUnlocked ? 'editor · has key' : 'viewer · read-only'}
                </div>
              </div>
            </div>
            {others.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}>
                <Avatar person={p} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--ld-fg)', fontSize: 11.5 }}>{p.name}</div>
                  <div style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>
                    {p.role === 'sharer' ? 'sharer · local file' : p.role === 'editor' ? 'editor · has key' : 'viewer'}
                    {p.typing && <span style={{ color: 'var(--ld-mauve)', marginLeft: 6 }}>typing…</span>}
                  </div>
                </div>
                <span style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>{p.lastSeen}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const keycapBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: 'transparent', border: '1px solid var(--ld-border-2)',
  borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
  fontFamily: 'var(--mono)', fontSize: 10,
};

const seg = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '0 10px', borderRight: '1px solid var(--ld-border)',
  height: '100%', flexShrink: 0,
};
const popover = {
  position: 'absolute', top: '100%', right: 0, marginTop: 2,
  background: 'var(--ld-bg-2)', border: '1px solid var(--ld-border-2)', borderRadius: 6,
  minWidth: 260, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,.4)',
  padding: '4px 0', overflow: 'hidden',
};
const popoverHeader = {
  padding: '6px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--ld-fg-dimmer)', borderBottom: '1px solid var(--ld-border)',
};

// ─── Code pane (syntax-highlighted markdown) ─────────────────────────
function CodePane({ src, flash, typing }) {
  const lines = src.split('\n');
  const highlighted = highlightMarkdown(src).split('\n');
  const scrollRef = useRef(null);

  return (
    <div style={{
      flex: 1, minWidth: 0, background: 'var(--ld-bg)',
      display: 'flex', flexDirection: 'column', minHeight: 0,
      borderRight: flash ? '2px solid var(--ld-mauve)' : 'none',
      transition: 'border-color .4s',
    }}>
      <div ref={scrollRef} className="ld-scroll" style={{
        flex: 1, overflow: 'auto',
        fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.55,
        padding: '10px 0',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', minHeight: '1.55em',
            background: typing === i ? 'rgba(203,166,247,0.08)' : 'transparent',
          }}>
            <span style={{
              color: 'var(--ld-fg-dimmer)', width: 42, textAlign: 'right',
              paddingRight: 12, flexShrink: 0, userSelect: 'none',
            }}>{i + 1}</span>
            <span style={{ color: 'var(--ld-fg-2)', whiteSpace: 'pre-wrap', flex: 1, paddingRight: 16 }}
                  dangerouslySetInnerHTML={{ __html: highlighted[i] || '&nbsp;' }}/>
            {typing === i && (
              <span style={{
                display: 'inline-block', width: 1.5, height: 14, background: '#89b4fa',
                animation: 'ld-caret 1s steps(1) infinite', marginLeft: -2,
              }}/>
            )}
          </div>
        ))}
      </div>
      <StatusLine lines={lines.length} cursor={typing ?? 0} />
    </div>
  );
}

function StatusLine({ lines, cursor }) {
  return (
    <div style={{
      height: 22, background: 'var(--ld-bg-2)', borderTop: '1px solid var(--ld-border)',
      display: 'flex', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 10.5,
      color: 'var(--ld-fg-dimmer)', padding: '0 10px', gap: 12, flexShrink: 0,
    }}>
      <span>markdown</span>
      <span>utf-8</span>
      <span>LF</span>
      <span style={{ flex: 1 }}/>
      <span>Ln {cursor + 1}, Col 1</span>
      <span>{lines} lines</span>
    </div>
  );
}

// ─── Preview pane (rendered markdown) ────────────────────────────────
function PreviewPane({ html }) {
  return (
    <div className="ld-scroll" style={{
      flex: 1, minWidth: 0, overflow: 'auto', background: '#ffffff',
    }}>
      <div style={{
        maxWidth: 680, margin: '0 auto', padding: '32px 40px 60px',
        fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.65, color: '#24292e',
      }}>
        <style>{`
          .md-body h1 { font-size: 1.85em; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 .6em; border-bottom: 1px solid #e4e6eb; padding-bottom: .3em; }
          .md-body h2 { font-size: 1.35em; font-weight: 600; letter-spacing: -0.01em; margin: 1.6em 0 .6em; border-bottom: 1px solid #e4e6eb; padding-bottom: .2em; }
          .md-body p { margin: 0 0 1em; }
          .md-body ul { padding-left: 1.4em; margin: 0 0 1em; }
          .md-body li { margin: 0.2em 0; }
          .md-body a { color: #0366d6; text-decoration: none; }
          .md-body a:hover { text-decoration: underline; }
          .md-body code { font-family: var(--mono); font-size: 0.88em; background: #f6f8fa; padding: .15em .4em; border-radius: 3px; border: 1px solid #e4e6eb; }
          .md-body strong { font-weight: 600; }
        `}</style>
        <div className="md-body" dangerouslySetInnerHTML={{ __html: html }}/>
      </div>
    </div>
  );
}

// ─── Full viewer (split + identity + live session timer) ─────────────
function LivedownViewerSplit({ mode: initialMode = 'split', protectedRoom = true, editorUnlocked = false }) {
  const [mode, setMode] = useState(initialMode);
  const [unlocked, setUnlocked] = useState(editorUnlocked);
  const [typing, setTyping] = useState(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const loop = setInterval(() => {
      setTyping(7);
      setFlash(true);
      setTimeout(() => { setTyping(null); setFlash(false); }, 900);
    }, 4500);
    return () => clearInterval(loop);
  }, []);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--ld-bg)', overflow: 'hidden',
    }}>
      <TopBar
        mode={mode} setMode={setMode}
        roster={ROSTER} edits={EDIT_HISTORY}
        protectedRoom={protectedRoom}
        editorUnlocked={unlocked}
        onUnlock={() => setUnlocked(true)}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {(mode === 'code' || mode === 'split') && (
          <CodePane src={SAMPLE_MD} flash={flash} typing={typing}/>
        )}
        {mode === 'split' && (
          <div style={{ width: 1, background: 'var(--ld-border)' }}/>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <PreviewPane html={RENDERED_SAMPLE}/>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LivedownViewerSplit, TopBar, CodePane, PreviewPane });
