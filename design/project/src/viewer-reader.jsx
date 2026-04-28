// Viewer v2 — Reader-primary.
// Single header (the approved Header A direction, refined):
//   LEFT:   [GH]  docs/architecture.md  [copy-icon]
//   CENTER: [Code] [Split] [Preview]     ← cursor-style mode toggle
//   RIGHT:  [🔒 Locked · enter key]  [roster pills → activity popover]  [guest / user]
//
// When mode === 'preview' (default): reader-primary layout (wide rendered pane, optional source drawer).
// When mode === 'code' or 'split':  swap to the Cursor-style split viewer (LivedownViewerSplit)
// using its own chrome — so this component only owns the reader surface.

const { useState: useStateR, useEffect: useEffectR, useRef: useRefR } = React;

function LivedownViewerReader({ protectedRoom = true, currentUser, initialMode = 'preview' }) {
  const [mode, setMode] = useStateR(initialMode);
  const [unlocked, setUnlocked] = useStateR(false);
  const [typing, setTyping] = useStateR(null);
  const [showRoster, setShowRoster] = useStateR(false);

  const user = currentUser || { name: 'Guest 3', color: '#cba6f7', initials: 'G3', role: 'viewer', guest: true };

  useEffectR(() => {
    const loop = setInterval(() => {
      setTyping(7);
      setTimeout(() => setTyping(null), 900);
    }, 9000);
    return () => clearInterval(loop);
  }, []);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#fafafa', overflow: 'hidden',
    }}>
      <ReaderHeader
        user={user}
        unlocked={unlocked}
        setUnlocked={setUnlocked}
        protectedRoom={protectedRoom}
        mode={mode}
        setMode={setMode}
        showRoster={showRoster}
        setShowRoster={setShowRoster}
        typing={typing}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {(mode === 'code' || mode === 'split') && (
          <div style={{
            flex: mode === 'code' ? 1 : '0 0 50%',
            background: 'var(--ld-bg)',
            borderRight: mode === 'split' ? '1px solid var(--ld-border)' : 'none',
            display: 'flex', flexDirection: 'column', minHeight: 0,
          }}>
            <CodePane src={SAMPLE_MD} flash={false} typing={typing}/>
          </div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div className="ld-scroll" style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
            <div style={{
              maxWidth: mode === 'split' ? 560 : 720,
              margin: '0 auto',
              padding: mode === 'split' ? '32px 40px 60px' : '48px 56px 80px',
              fontFamily: 'var(--sans)',
              fontSize: mode === 'split' ? 14.5 : 15.5,
              lineHeight: 1.7, color: '#24292e',
            }}>
              <div className="md-body" dangerouslySetInnerHTML={{ __html: RENDERED_SAMPLE }}/>
              <style>{`
                .md-body h1 { font-size: 2em; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 .5em; }
                .md-body h2 { font-size: 1.35em; font-weight: 600; margin: 1.6em 0 .5em; }
                .md-body p { margin: 0 0 1em; }
                .md-body ul { padding-left: 1.4em; margin: 0 0 1em; }
                .md-body a { color: #0366d6; text-decoration: none; }
                .md-body a:hover { text-decoration: underline; }
                .md-body code { font-family: var(--mono); font-size: 0.88em; background: #f6f8fa; padding: .15em .4em; border-radius: 3px; border: 1px solid #e4e6eb; }
                .md-mermaid { margin: 16px 0; padding: 18px; background: #fafbfc; border: 1px solid #e4e6eb; border-radius: 6px; }
                .md-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
                .md-table th, .md-table td { border: 1px solid #e4e6eb; padding: 6px 10px; text-align: left; }
                .md-table th { background: #f6f8fa; font-weight: 600; }
              `}</style>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────────

function GithubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

function IconBtn({ title, onClick, active, children }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid transparent', borderRadius: 6,
      background: active ? '#eef1f7' : 'transparent',
      color: '#3a3a48', cursor: 'pointer',
    }}
    onMouseEnter={e => e.currentTarget.style.background = active ? '#e4e9f2' : '#f5f6f8'}
    onMouseLeave={e => e.currentTarget.style.background = active ? '#eef1f7' : 'transparent'}
    >
      {children}
    </button>
  );
}

function CopyIconBtn() {
  const [copied, setCopied] = useStateR(false);
  return (
    <IconBtn
      title={copied ? 'Copied!' : 'Copy share link'}
      onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      active={copied}
    >
      {copied
        ? <span style={{ color: '#2a7a2a', fontSize: 13 }}>✓</span>
        : <Icon name="link" size={13}/>
      }
    </IconBtn>
  );
}

function LockState({ unlocked, setUnlocked, protectedRoom }) {
  if (unlocked) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 99,
        background: '#f0fff4', color: '#1d6b30', fontSize: 10.5, fontWeight: 600,
        border: '1px solid rgba(29,107,48,0.22)',
      }}>
        <Icon name="unlock" size={10}/> Editor
      </span>
    );
  }
  if (!protectedRoom) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 99,
        background: '#f5f6f8', color: '#8a8aa0', fontSize: 10.5, fontWeight: 600,
        border: '1px solid #e4e6eb',
      }}>
        <Icon name="eye" size={10}/> Viewing
      </span>
    );
  }
  return (
    <button onClick={() => setUnlocked(true)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 11px',
      border: '1px solid #e4c05c', borderRadius: 6, background: '#fffae8',
      fontFamily: 'var(--sans)', fontSize: 11.5, color: '#7a5a15', fontWeight: 600,
      cursor: 'pointer',
    }}>
      <Icon name="lock" size={11}/> Locked <span style={{ color: '#ad7a00', fontWeight: 500, marginLeft: 2 }}>· enter key</span>
    </button>
  );
}

function ModeToggle({ mode, setMode }) {
  const items = [
    { id: 'code', icon: 'code', label: 'Code' },
    { id: 'split', icon: 'split', label: 'Split' },
    { id: 'preview', icon: 'preview', label: 'Preview' },
  ];
  return (
    <div style={{
      display: 'inline-flex', background: '#f5f6f8', borderRadius: 7, padding: 2,
      border: '1px solid #e4e6eb',
    }}>
      {items.map(it => {
        const active = mode === it.id;
        return (
          <button key={it.id} onClick={() => setMode(it.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
            background: active ? '#fff' : 'transparent',
            color: active ? '#17171f' : '#5a5a6c',
            fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: active ? 600 : 500,
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            transition: 'background .12s',
          }}>
            <Icon name={it.icon} size={11}/> {it.label}
          </button>
        );
      })}
    </div>
  );
}

function RosterCluster({ typing, showRoster, setShowRoster }) {
  const anyTyping = typing != null;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowRoster(v => !v)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '3px 8px 3px 6px', borderRadius: 99,
        border: '1px solid #e4e6eb', background: showRoster ? '#f5f6f8' : '#fff',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex' }}>
          {ROSTER.slice(0, 3).map((p, i) => (
            <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -5, position: 'relative' }}>
              <Avatar person={p} size={22} ring={p.role === 'sharer' ? 'thick' : null}/>
              {anyTyping && i === 1 && (
                <span style={{
                  position: 'absolute', bottom: -1, right: -2, width: 7, height: 7, borderRadius: '50%',
                  background: '#2a7a2a', border: '1.5px solid #fff',
                  animation: 'ld-pulse 1.2s ease-out infinite',
                }}/>
              )}
            </div>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: '#5a5a6c', fontWeight: 500 }}>
          {ROSTER.length}
        </span>
      </button>
      {showRoster && (
        <RosterActivityPopover onClose={() => setShowRoster(false)} typing={typing}/>
      )}
    </div>
  );
}

function RosterActivityPopover({ onClose, typing }) {
  const ref = useRefR(null);
  useEffectR(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
      width: 320, background: '#fff', border: '1px solid #e4e6eb',
      borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      fontFamily: 'var(--sans)', fontSize: 12, color: '#3a3a48', overflow: 'hidden',
    }}>
      <div style={{ padding: '8px 12px 6px', fontSize: 10, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>
        In this room · {ROSTER.length}
      </div>
      <div>
        {ROSTER.map(p => {
          const isTyping = typing != null && p.role === 'editor';
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderTop: '1px solid #f0f1f4',
            }}>
              <Avatar person={p} size={24} ring={p.role === 'sharer' ? 'thick' : null}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#17171f' }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: '#8a8aa0' }}>
                  {p.role === 'sharer' ? 'sharer · local file' : p.role === 'editor' ? 'editor · has key' : 'viewer'}
                </div>
              </div>
              {isTyping
                ? <span style={{ fontSize: 10, color: '#2a7a2a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7a2a', animation: 'ld-pulse 1.2s ease-out infinite' }}/>
                    typing…
                  </span>
                : <span style={{ fontSize: 10.5, color: '#8a8aa0', fontFamily: 'var(--mono)' }}>idle · {p.lastSeen || '12s'}</span>
              }
            </div>
          );
        })}
      </div>
      <div style={{ padding: '8px 12px 6px', fontSize: 10, color: '#8a8aa0', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)', borderTop: '1px solid #f0f1f4' }}>
        Recent edits
      </div>
      <div style={{ maxHeight: 170, overflow: 'auto' }}>
        {EDIT_HISTORY.slice(0, 4).map((e, i) => (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 12px',
            borderTop: '1px solid #f0f1f4',
          }}>
            <span style={{ width: 3, alignSelf: 'stretch', background: e.color, borderRadius: 2, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: '#3a3a48', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.preview}
              </div>
              <div style={{ fontSize: 10, color: '#8a8aa0', marginTop: 1 }}>
                <span style={{ color: e.color, fontWeight: 500 }}>{e.who}</span> · {e.time} ago
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '7px 12px', borderTop: '1px solid #f0f1f4', fontSize: 10, color: '#8a8aa0', fontFamily: 'var(--mono)', background: '#fafbfc' }}>
        all changes ed25519-verified
      </div>
    </div>
  );
}

function CurrentUserChip({ user }) {
  const isGuest = user.guest;
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '3px 11px 3px 3px', borderRadius: 99,
      background: isGuest ? '#fff' : '#17171f',
      color: isGuest ? '#3a3a48' : '#fff',
      border: isGuest ? '1px solid #e4e6eb' : 'none',
      fontFamily: 'var(--sans)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: user.color, color: '#0a0a10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 9.5,
      }}>
        {user.initials}
      </div>
      <span>{user.name}</span>
    </button>
  );
}

function ReaderHeader({ user, unlocked, setUnlocked, protectedRoom, mode, setMode, showRoster, setShowRoster, typing }) {
  return (
    <div style={{
      height: 52, background: '#fff', borderBottom: '1px solid #e4e6eb',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
      padding: '0 14px', gap: 14,
      fontFamily: 'var(--sans)', fontSize: 12.5, color: '#3a3a48', flexShrink: 0,
      position: 'relative',
    }}>
      {/* LEFT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <a href="https://github.com/dwmkerr/livedown" title="View on GitHub" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 6,
          color: '#3a3a48', textDecoration: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f5f6f8'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <GithubIcon size={16}/>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <Icon name="file" size={12} color="#8a8aa0"/>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 12.5, color: '#17171f', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            docs/architecture.md
          </span>
          <CopyIconBtn/>
        </div>
      </div>

      {/* CENTER */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ModeToggle mode={mode} setMode={setMode}/>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
        <LockState unlocked={unlocked} setUnlocked={setUnlocked} protectedRoom={protectedRoom}/>
        <RosterCluster typing={typing} showRoster={showRoster} setShowRoster={setShowRoster}/>
        <CurrentUserChip user={user}/>
      </div>
    </div>
  );
}

Object.assign(window, { LivedownViewerReader });
