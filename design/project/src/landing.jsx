// Landing page — developer-forward, terminal-first.
// A root-level page at livedown.dev/ with no hash fragment.

const { useState: useStateL } = React;

function Landing() {
  const [copied, setCopied] = useStateL(false);
  const cmd = 'npx @dwmkerr/livedown share ./file.md';
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{
      height: '100%', overflow: 'auto', background: 'var(--ld-bg)',
      fontFamily: 'var(--sans)', color: 'var(--ld-fg)',
    }} className="ld-scroll">

      {/* tiny top nav */}
      <div style={{
        height: 44, borderBottom: '1px solid var(--ld-border)',
        display: 'flex', alignItems: 'center', padding: '0 32px', gap: 18,
        fontFamily: 'var(--mono)', fontSize: 11.5,
        position: 'sticky', top: 0, background: 'rgba(23,23,31,0.92)', backdropFilter: 'blur(8px)', zIndex: 10,
      }}>
        <span style={{ fontWeight: 700, color: 'var(--ld-blue)' }}>livedown</span>
        <span style={{ color: 'var(--ld-fg-dimmer)' }}>v0.1.4</span>
        <div style={{ flex: 1 }}/>
        <a style={landNav}>Quickstart</a>
        <a style={landNav}>How it works</a>
        <a style={landNav}>Security</a>
        <a style={{ ...landNav, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="github" size={13}/> GitHub
        </a>
      </div>

      {/* hero — 2-col: copy+cmd left, architecture diagram right */}
      {/* HERO — full width, centered, leads with headline */}
      <div style={{
        maxWidth: 980, margin: '0 auto', padding: '88px 40px 48px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 99, background: 'rgba(137,180,250,0.1)', border: '1px solid rgba(137,180,250,0.2)',
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-blue)', marginBottom: 28,
        }}>
          <PresenceDot color="var(--ld-blue)" pulsing size={6}/>
          ephemeral · signed · zero-install
        </div>
        <h1 style={{
          margin: 0, fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em',
          lineHeight: 1.02, color: 'var(--ld-fg)',
        }}>
          One file. Many humans.<br/>
          <span style={{ color: 'var(--ld-blue)' }}>Many agents.</span>{' '}
          <span style={{ color: 'var(--ld-fg-dim)' }}>All live.</span>
        </h1>
        <p style={{
          fontSize: 18, lineHeight: 1.6, color: 'var(--ld-fg-dim)',
          maxWidth: 680, margin: '28px auto 36px',
        }}>
          Beam a local markdown file to a URL. Teammates edit it in the browser.
          Others join from a terminal and sync straight into their editor.
          Your coding agents edit alongside you — same file, every machine, all at once.
        </p>
        <div style={{
          background: '#0d0d14', border: '1px solid var(--ld-border-2)', borderRadius: 10,
          padding: 16, fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--ld-fg-2)',
          display: 'inline-flex', alignItems: 'center', gap: 12,
          maxWidth: 620, width: '100%', boxSizing: 'border-box',
        }}>
          <span style={{ color: 'var(--ld-fg-dimmer)' }}>$</span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ color: 'var(--ld-mauve)' }}>npx</span>{' '}
            <span style={{ color: 'var(--ld-peach)' }}>@dwmkerr/livedown</span>{' '}
            <span style={{ color: 'var(--ld-green)' }}>share</span>{' '}
            <span style={{ color: 'var(--ld-fg-2)' }}>./file.md</span>
          </span>
          <button onClick={copy} style={{
            background: 'transparent', border: '1px solid var(--ld-border-2)',
            color: copied ? 'var(--ld-green)' : 'var(--ld-fg-dim)', cursor: 'pointer',
            borderRadius: 4, padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 11,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {copied ? <><Icon name="check" size={12}/> copied</> : <><Icon name="copy" size={12}/> copy</>}
          </button>
        </div>
        <div style={{ marginTop: 14, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ld-fg-dimmer)' }}>
          no account · node 18+ · MIT
        </div>
      </div>

      {/* ARCHITECTURE — full-width, the centerpiece */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 40px 60px' }}>
        <div style={{ ...sectionLabel, textAlign: 'center', marginBottom: 18 }}>— the loop</div>
        <div style={{
          padding: '40px 28px 24px', borderRadius: 16,
          background: 'linear-gradient(180deg, var(--ld-bg-2) 0%, #141420 100%)',
          border: '1px solid var(--ld-border-2)', position: 'relative', overflow: 'hidden',
        }}>
          <SystemDiagram/>
        </div>
      </div>

      {/* commit ritual — its own row below the diagram */}
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '8px 40px 72px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ld-fg-dim)', flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--ld-fg-dimmer)' }}>when you're done —</span>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          borderRadius: 8, background: '#0d0d14', border: '1px solid var(--ld-border-2)',
        }}>
          <span style={{ color: 'var(--ld-fg-dimmer)' }}>$</span>
          <span style={{ color: 'var(--ld-mauve)' }}>^C</span>
          <span style={{ color: 'var(--ld-fg-dimmer)' }}>&amp;&amp;</span>
          <span style={{ color: 'var(--ld-peach)' }}>git</span>
          <span style={{ color: 'var(--ld-green)' }}>commit</span>
          <span style={{ color: 'var(--ld-fg-2)' }}>-am</span>
          <span style={{ color: 'var(--ld-yellow)' }}>"spec: reviewed with @amy"</span>
        </div>
        <span style={{ color: 'var(--ld-fg-dimmer)' }}>→ room evaporates, file is yours.</span>
      </div>

      {/* journeys */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 40px 0' }}>
        <div style={sectionLabel}>— three journeys</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18 }}>
          <JourneyCard n={1} title="Share" subtitle="CLI → Web" tag="today"
            lines={['livedown share ./notes.md', '→ https://livedown.dev/#d5dc3b', '→ edit key: f7a2c9e1…']}
            blurb="Start a room from any terminal. Keypair generated locally, public key goes up, URL prints the moment the relay acknowledges."
          />
          <JourneyCard n={2} title="Edit Live" subtitle="Browser → CLI" tag="today"
            lines={['viewer enters edit key', 'browser derives keypair', 'pushes signed → relay', 'local file updates']}
            blurb="A viewer with the edit key types in the browser. Pushes are signed client-side; the watcher re-verifies every update before it touches disk."
          />
          <JourneyCard n={3} title="Join Remote" subtitle="CLI ↔ Relay ↔ CLI" tag="future"
            lines={['livedown join <url>', '  --edit-key <key>', '→ ./local-notes.md created', '→ bi-directional sync']}
            blurb="Pair two machines on one file. Edit in Vim on your laptop, Cursor on your desktop — both stay in sync. Not shipped yet; relay already supports it."
          />
        </div>
      </div>

      {/* architecture strip */}
      <div style={{ background: 'var(--ld-bg-2)', marginTop: 80, padding: '56px 40px', borderTop: '1px solid var(--ld-border)', borderBottom: '1px solid var(--ld-border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={sectionLabel}>— how it works</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr', alignItems: 'stretch', gap: 16, marginTop: 18 }}>
            <Piece icon="terminal" tone="green" title="1. CLI + Watcher" runtime="Node · tweetnacl"
              text="Reads your file. Generates an Ed25519 keypair. Signs every push with the private key. Re-verifies every incoming update before writing to disk."/>
            <Piece icon="shield" tone="blue" title="2. Stateful Relay" runtime="Cloudflare Workers · PartyKit · @noble/curves"
              text="One WebSocket room per document. Holds the public key in memory, verifies signatures, broadcasts verified updates. Rooms evaporate when the last client drops."/>
            <Piece icon="preview" tone="mauve" title="3. Browser Viewer" runtime="Vanilla JS · tweetnacl"
              text="Renders the markdown live, unlocks editing when an edit key matching the room's public key is entered. Pushes are signed in-browser before hitting the wire."/>
          </div>
        </div>
      </div>

      {/* security */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 40px' }}>
        <div style={sectionLabel}>— security</div>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 40, marginTop: 18, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--ld-fg)' }}>
              Three layers<br/>of verification.
            </div>
            <div style={{ color: 'var(--ld-fg-dim)', fontSize: 14, lineHeight: 1.6 }}>
              Livedown writes remote content straight to your disk, so every update
              is signed with Ed25519 and checked independently by the relay, the watcher,
              and the browser. A compromised relay still can't forge an edit your watcher will accept.
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 10.5 }}>
              {['ed25519', 'tweetnacl', '@noble/curves', 'no custom crypto', 'urls are locators'].map(t => (
                <span key={t} style={{ padding: '3px 8px', borderRadius: 99, background: 'var(--ld-bg-3)', color: 'var(--ld-fg-dim)' }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ border: '1px solid var(--ld-border-2)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: 'var(--ld-bg-2)' }}>
                  {['Layer', 'Has', 'Verifies', 'Rejects'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--ld-fg-dim)', fontWeight: 500, borderBottom: '1px solid var(--ld-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Relay', 'Public key', 'Signature on every push', 'Unsigned / invalid → never broadcast'],
                  ['Watcher', 'Private key', 'Signature on incoming updates', 'Forged updates → never written to disk'],
                  ['Browser', 'Public key', 'Edit key matches public key', 'Wrong key → rejected before any push'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: i ? '1px solid var(--ld-border)' : 'none' }}>
                    {row.map((c, j) => (
                      <td key={j} style={{ padding: '10px 14px', color: j === 0 ? 'var(--ld-blue)' : 'var(--ld-fg-2)', fontWeight: j === 0 ? 600 : 400 }}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{
        borderTop: '1px solid var(--ld-border)', padding: '32px 40px',
        display: 'flex', alignItems: 'center', gap: 18, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ld-fg-dimmer)',
      }}>
        <span style={{ color: 'var(--ld-blue)', fontWeight: 700 }}>livedown</span>
        <span>MIT</span>
        <span>by dwmkerr</span>
        <div style={{ flex: 1 }}/>
        <a style={landNav}>docs</a>
        <a style={landNav}>github</a>
        <a style={landNav}>npm</a>
      </div>
    </div>
  );
}

const landNav = { color: 'var(--ld-fg-dim)', cursor: 'pointer', textDecoration: 'none' };

function JourneyCard({ n, title, subtitle, tag, lines, blurb }) {
  const isFuture = tag === 'future';
  return (
    <div style={{
      background: 'var(--ld-bg-2)', border: '1px solid var(--ld-border-2)', borderRadius: 10,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
      opacity: isFuture ? 0.9 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dimmer)',
          border: '1px solid var(--ld-border-2)', borderRadius: 99, padding: '2px 7px',
        }}>0{n}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ld-fg-dim)' }}>{subtitle}</span>
        <div style={{ flex: 1 }}/>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, padding: '2px 7px', borderRadius: 99,
          background: isFuture ? 'rgba(250,179,135,0.12)' : 'rgba(166,227,161,0.12)',
          color: isFuture ? 'var(--ld-peach)' : 'var(--ld-green)',
        }}>{tag}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ld-fg)' }}>{title}</div>
      <div style={{
        background: '#0d0d14', border: '1px solid var(--ld-border)', borderRadius: 6, padding: 10,
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ld-fg-2)', lineHeight: 1.7,
      }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i === 0 ? 'var(--ld-green)' : 'var(--ld-fg-dim)' }}>
            {i === 0 && <span style={{ color: 'var(--ld-fg-dimmer)', marginRight: 6 }}>$</span>}
            {l}
          </div>
        ))}
      </div>
      <div style={{ color: 'var(--ld-fg-dim)', fontSize: 12.5, lineHeight: 1.55 }}>{blurb}</div>
    </div>
  );
}

function Piece({ icon, tone, title, runtime, text }) {
  const toneColor = {
    green: 'var(--ld-green)',
    blue: 'var(--ld-blue)',
    mauve: 'var(--ld-mauve)',
  }[tone];
  return (
    <div style={{
      background: 'var(--ld-bg)', border: '1px solid var(--ld-border-2)', borderRadius: 10,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 7,
        background: `${toneColor}15`, border: `1px solid ${toneColor}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} color={toneColor}/>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ld-fg)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: toneColor }}>{runtime}</div>
      <div style={{ color: 'var(--ld-fg-dim)', fontSize: 13, lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

Object.assign(window, { Landing, SystemDiagram });
