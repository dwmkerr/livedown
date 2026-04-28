// App — composes all variants into the design canvas.

function App() {
  return (
    <DesignCanvas>
      <DCSection id="viewer" title="Viewer UI" subtitle="Cursor-style split pane with presence, edits, and session ephemerality">
        <DCArtboard id="v1-split" label="V1 · Split (default)" width={1160} height={720}>
          <LivedownViewerSplit mode="split" protectedRoom editorUnlocked={false}/>
        </DCArtboard>
        <DCArtboard id="v1-code" label="V1 · Code only" width={1160} height={720}>
          <LivedownViewerSplit mode="code" protectedRoom editorUnlocked={true}/>
        </DCArtboard>
        <DCArtboard id="v1-preview" label="V1 · Preview only" width={1160} height={720}>
          <LivedownViewerSplit mode="preview" protectedRoom editorUnlocked={false}/>
        </DCArtboard>
        <DCArtboard id="v2-reader-guest-split" label="V2 · Guest · Split" width={1160} height={720}>
          <LivedownViewerReader protectedRoom initialMode="split"/>
        </DCArtboard>
        <DCArtboard id="v2-reader-guest-code" label="V2 · Guest · Code" width={1160} height={720}>
          <LivedownViewerReader protectedRoom initialMode="code"/>
        </DCArtboard>
        <DCArtboard id="v2-reader-signed-in" label="V2 · Signed-in · Preview" width={1160} height={720}>
          <LivedownViewerReader protectedRoom currentUser={{ name: 'Adam Liu', initials: 'AL', color: '#89b4fa', role: 'editor' }}/>
        </DCArtboard>
      </DCSection>

      <DCSection id="states" title="Session states & flows" subtitle="Trust-first signals for an ephemeral, signed, keyboard-driven session">
        <DCArtboard id="cli" label="CLI — livedown share" width={560} height={460}>
          <CLIShareOutput/>
        </DCArtboard>
        <DCArtboard id="editkey" label="Edit key modal" width={460} height={460}>
          <EditKeyModal/>
        </DCArtboard>
        <DCArtboard id="offline" label="Sharer offline" width={560} height={460}>
          <SharerOfflineState/>
        </DCArtboard>
        <DCArtboard id="rejected" label="Auth rejected toast" width={460} height={460}>
          <AuthRejectedToast/>
        </DCArtboard>
        <DCArtboard id="roster" label="Roster hover card" width={460} height={460}>
          <RosterHoverCard/>
        </DCArtboard>
      </DCSection>

      <DCSection id="diagram" title="Architecture diagram variants" subtitle="Original + three simplified iterations">
        <DCArtboard id="diagram-original" label="Original · full IDE mocks" width={1240} height={580}>
          <div style={{ padding: 30, background: 'var(--ld-bg)', width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <SystemDiagramOriginal/>
          </div>
        </DCArtboard>
        <DCArtboard id="diagram-v1" label="V1 · Logos + pods, relay peeking" width={1140} height={540}>
          <div style={{ padding: 30, background: 'var(--ld-bg)', width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <SystemDiagramV1/>
          </div>
        </DCArtboard>
        <DCArtboard id="diagram-v2" label="V2 · Browser front, relay as halo" width={1140} height={560}>
          <div style={{ padding: 30, background: 'var(--ld-bg)', width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <SystemDiagramV2/>
          </div>
        </DCArtboard>
        <DCArtboard id="diagram-v3" label="V3 · Browser as roster" width={1140} height={520}>
          <div style={{ padding: 30, background: 'var(--ld-bg)', width: '100%', height: '100%', boxSizing: 'border-box' }}>
            <SystemDiagramV3/>
          </div>
        </DCArtboard>
      </DCSection>

      <DCSection id="landing" title="Landing page" subtitle="Root-level livedown.dev — terminal-forward, developer-native, zero marketing fluff">
        <DCArtboard id="landing-full" label="Landing · full page (uses original)" width={1200} height={1800}>
          <Landing/>
        </DCArtboard>
      </DCSection>

      <DCPostIt x={40} y={40} color="yellow" width={240}>
        <strong>System</strong><br/>
        JetBrains Mono for chrome · Inter for prose · Catppuccin-adjacent dark + single #89b4fa accent. Ephemerality is a feature: session timer, "sharer offline" stays recoverable, rooms evaporate on Ctrl-C.
      </DCPostIt>
      <DCPostIt x={40} y={260} color="blue" width={260}>
        <strong>Reader header — final</strong><br/>
        · GH icon · filename · copy-icon (discrete)<br/>
        · Center: Code / Split / Preview toggle<br/>
        · Right: 🔒 Locked / enter key · roster pills (click → activity popover) · Guest sign-in<br/>
        Code/Split modes hand off to the V1 split-viewer chrome.
      </DCPostIt>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
