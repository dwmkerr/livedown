// Share-flow states: edit-key modal, sharer-offline, auth-rejected toast, roster hover card.

function EditKeyModal() {
  return (
    <div style={{
      width: '100%', height: '100%', background: 'var(--ld-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: 360, background: 'var(--ld-bg-2)', border: '1px solid var(--ld-border-2)',
        borderRadius: 10, padding: 24, fontFamily: 'var(--sans)', color: 'var(--ld-fg)',
        boxShadow: '0 20px 60px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="key" size={16} color="var(--ld-blue)"/>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>Edit key required</div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ld-fg-dim)', lineHeight: 1.6, marginBottom: 16 }}>
          This document is protected. Paste the 64-character edit key to make changes.
          Your keypair is derived in-browser — the relay never sees it.
        </div>
        <input value="f7a2c9e1d8b4f5a3c6e9b2f1a7d5c8e3•••••" readOnly style={{
          width: '100%', padding: '10px 12px', borderRadius: 6,
          background: 'var(--ld-bg-3)', border: '1px solid var(--ld-border-2)',
          color: 'var(--ld-green)', fontFamily: 'var(--mono)', fontSize: 12,
          outline: 'none',
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 10.5, color: 'var(--ld-green)', fontFamily: 'var(--mono)' }}>
          <Icon name="check" size={11} color="var(--ld-green)"/> public key match · ed25519
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button style={{
            flex: 1, padding: '9px 14px', borderRadius: 6, border: 'none',
            background: 'var(--ld-blue)', color: 'var(--ld-bg)', fontWeight: 600,
            fontFamily: 'var(--mono)', fontSize: 11.5, cursor: 'pointer',
          }}>Unlock editing</button>
          <button style={{
            padding: '9px 14px', borderRadius: 6, border: '1px solid var(--ld-border-2)',
            background: 'transparent', color: 'var(--ld-fg-dim)',
            fontFamily: 'var(--mono)', fontSize: 11.5, cursor: 'pointer',
          }}>View only</button>
        </div>
        <div style={{ marginTop: 16, padding: 10, borderRadius: 6, background: 'var(--ld-bg-3)',
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ld-fg-dim)', lineHeight: 1.55 }}>
          <div style={{ color: 'var(--ld-fg-dimmer)', marginBottom: 4 }}>$ the sharer ran:</div>
          <div>livedown share ./architecture.md <span style={{ color: 'var(--ld-yellow)' }}>--edit-key</span> <span style={{ color: 'var(--ld-green)' }}>f7a2...</span></div>
        </div>
      </div>
    </div>
  );
}

function SharerOfflineState() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--ld-bg)' }}>
      {/* top bar simplified */}
      <div style={{
        height: 34, background: 'var(--ld-bg)', borderBottom: '1px solid var(--ld-border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10,
        fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ld-fg-dim)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--ld-blue)' }}>livedown</span>
        <Icon name="file" size={11}/>
        <span>docs/architecture.md</span>
        <div style={{ flex: 1 }}/>
        <PresenceDot color="#f38ba8" size={7}/>
        <span style={{ color: 'var(--ld-pink)' }}>sharer offline</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 420, textAlign: 'center', fontFamily: 'var(--sans)' }}>
          <div style={{
            width: 54, height: 54, margin: '0 auto 18px', borderRadius: '50%',
            background: 'rgba(243,139,168,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(243,139,168,0.3)',
          }}>
            <Icon name="terminal" size={22} color="var(--ld-pink)"/>
          </div>
          <div style={{ color: 'var(--ld-fg)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            The sharer stepped away
          </div>
          <div style={{ color: 'var(--ld-fg-dim)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 18 }}>
            <span style={{ color: 'var(--ld-green)', fontFamily: 'var(--mono)' }}>dwmkerr</span>'s CLI
            disconnected from the relay. The document stays visible, but edits are paused
            until they reconnect.
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: 'var(--ld-bg-2)', border: '1px solid var(--ld-border-2)', borderRadius: 6,
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ld-fg-dim)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--ld-peach)',
              animation: 'ld-pulse 1.4s ease-out infinite', color: 'var(--ld-peach)',
            }}/>
            watching for reconnect · 00:00:38
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthRejectedToast() {
  return (
    <div style={{ height: '100%', padding: 40, background: 'var(--ld-bg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div style={{
        width: 380, background: 'var(--ld-bg-2)',
        border: '1px solid var(--ld-pink)', borderLeft: '3px solid var(--ld-pink)',
        borderRadius: 8, padding: 14, fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--ld-fg)',
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Icon name="shield" size={14} color="var(--ld-pink)"/>
          <span style={{ color: 'var(--ld-pink)', fontWeight: 600 }}>push rejected</span>
          <span style={{ flex: 1 }}/>
          <span style={{ color: 'var(--ld-fg-dimmer)', fontSize: 10 }}>just now</span>
        </div>
        <div style={{ color: 'var(--ld-fg-dim)', lineHeight: 1.55, fontSize: 11, marginBottom: 10 }}>
          A push from <span style={{ color: 'var(--ld-rosewater)' }}>Guest 7</span> failed signature verification at the relay.
          Their edit never left the browser. The sharer's CLI was notified.
        </div>
        <div style={{
          background: 'var(--ld-bg-3)', padding: 8, borderRadius: 4,
          color: 'var(--ld-fg-dimmer)', fontSize: 10,
        }}>
          <div><span style={{ color: 'var(--ld-pink)' }}>✗</span> ed25519 verify → false</div>
          <div><span style={{ color: 'var(--ld-fg-dimmer)' }}>sig=</span><span style={{ color: 'var(--ld-peach)' }}>4c1a..f8</span></div>
          <div><span style={{ color: 'var(--ld-fg-dimmer)' }}>pub=</span><span style={{ color: 'var(--ld-blue)' }}>d5dc..3b</span></div>
        </div>
      </div>
    </div>
  );
}

function CLIShareOutput() {
  return (
    <div style={{
      height: '100%', background: '#0d0d14', padding: 18,
      fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.65, color: 'var(--ld-fg-2)',
      overflow: 'auto',
    }}>
      <div style={{ color: 'var(--ld-fg-dimmer)' }}>$ livedown share ./docs/architecture.md</div>
      <div style={{ height: 8 }}/>
      <div style={{ color: 'var(--ld-green)' }}>✓ keypair generated <span style={{ color: 'var(--ld-fg-dimmer)' }}>(ed25519)</span></div>
      <div style={{ color: 'var(--ld-green)' }}>✓ connected to relay <span style={{ color: 'var(--ld-fg-dimmer)' }}>livedown.dwmkerr.partykit.dev</span></div>
      <div style={{ color: 'var(--ld-green)' }}>✓ room established · pushed initial content</div>
      <div style={{ height: 12 }}/>
      <div style={{
        border: '1px solid var(--ld-border-2)', borderRadius: 6, padding: '10px 14px',
        background: 'rgba(137,180,250,0.04)', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Icon name="file" size={11} color="var(--ld-fg-dim)"/>
          <span style={{ color: 'var(--ld-fg-dim)' }}>watching</span>
          <span style={{ color: 'var(--ld-fg-2)' }}>./docs/architecture.md</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Icon name="link" size={11} color="var(--ld-fg-dim)"/>
          <span style={{ color: 'var(--ld-fg-dim)' }}>join</span>
          <span style={{ color: 'var(--ld-blue)', textDecoration: 'underline' }}>https://livedown.dev/#d5dc3b</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="key" size={11} color="var(--ld-fg-dim)"/>
          <span style={{ color: 'var(--ld-fg-dim)' }}>edit key</span>
          <span style={{ color: 'var(--ld-green)' }}>f7a2c9e1d8b4f5a3c6e9b2f1a7d5c8e3</span>
          <span style={{ color: 'var(--ld-fg-dimmer)' }}>(c to copy)</span>
        </div>
      </div>
      <div style={{ color: 'var(--ld-fg-dimmer)', fontSize: 11 }}>
        <span style={{ color: 'var(--ld-mauve)' }}>[o]</span> open in browser &nbsp;
        <span style={{ color: 'var(--ld-mauve)' }}>[c]</span> copy edit key &nbsp;
        <span style={{ color: 'var(--ld-mauve)' }}>[q]</span> quit
      </div>
      <div style={{ height: 20 }}/>
      <div style={{ color: 'var(--ld-fg-dim)' }}>
        <span style={{ color: 'var(--ld-peach)' }}>●</span> amy.chen joined · <span style={{ color: 'var(--ld-fg-dimmer)' }}>14:45:12</span>
      </div>
      <div style={{ color: 'var(--ld-fg-dim)' }}>
        <span style={{ color: 'var(--ld-mauve)' }}>✎</span> amy.chen pushed 3 changes · <span style={{ color: 'var(--ld-fg-dimmer)' }}>14:45:46 · wrote ./docs/architecture.md</span>
      </div>
      <div style={{ color: 'var(--ld-fg-dim)' }}>
        <span style={{ color: 'var(--ld-peach)' }}>●</span> Guest 3 joined · <span style={{ color: 'var(--ld-fg-dimmer)' }}>14:46:02</span>
      </div>
      <div style={{ color: 'var(--ld-pink)' }}>
        <span>✗</span> Guest 7 push rejected · <span style={{ color: 'var(--ld-fg-dimmer)' }}>bad signature · 14:46:18</span>
      </div>
      <div style={{ color: 'var(--ld-fg-dim)' }}>
        <span style={{ color: 'var(--ld-green)', animation: 'ld-caret 1s steps(1) infinite' }}>▎</span>
      </div>
    </div>
  );
}

function RosterHoverCard() {
  return (
    <div style={{ height: '100%', background: 'var(--ld-bg)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 300, background: 'var(--ld-bg-2)', border: '1px solid var(--ld-border-2)',
        borderRadius: 8, padding: 14, fontFamily: 'var(--sans)',
        boxShadow: '0 12px 36px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar person={ROSTER[1]} size={38}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--ld-fg)', fontWeight: 600, fontSize: 13 }}>{ROSTER[1].name}</div>
            <div style={{ color: 'var(--ld-fg-dim)', fontSize: 11, fontFamily: 'var(--mono)' }}>
              editor · has key · <span style={{ color: 'var(--ld-mauve)' }}>typing now</span>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--ld-border)', margin: '10px 0' }}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'var(--mono)', fontSize: 10.5 }}>
          <div>
            <div style={{ color: 'var(--ld-fg-dimmer)' }}>joined</div>
            <div style={{ color: 'var(--ld-fg-2)' }}>14:45:12</div>
          </div>
          <div>
            <div style={{ color: 'var(--ld-fg-dimmer)' }}>pushes</div>
            <div style={{ color: 'var(--ld-fg-2)' }}>12 verified · 0 rejected</div>
          </div>
          <div>
            <div style={{ color: 'var(--ld-fg-dimmer)' }}>last edit</div>
            <div style={{ color: 'var(--ld-fg-2)' }}>2s ago</div>
          </div>
          <div>
            <div style={{ color: 'var(--ld-fg-dimmer)' }}>color</div>
            <div style={{ color: ROSTER[1].color }}>#89b4fa</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: 8, borderRadius: 4, background: 'var(--ld-bg-3)', fontSize: 10.5, color: 'var(--ld-fg-dim)', lineHeight: 1.5, fontFamily: 'var(--mono)' }}>
          <div style={{ color: 'var(--ld-mauve)', marginBottom: 2 }}>latest edit</div>
          <div>Adds note on noble/curves vs tweetnacl compat.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EditKeyModal, SharerOfflineState, AuthRejectedToast, CLIShareOutput, RosterHoverCard });
