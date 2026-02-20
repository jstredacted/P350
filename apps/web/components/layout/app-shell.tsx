import { CoordinateOverlay } from "@/components/layout/coordinate-overlay"

export function AppShell({
  children,
  active,
}: {
  children: React.ReactNode
  active: string
}) {
  return (
    <div className="coordinate-shell">
      <CoordinateOverlay />

      <div className="coordinate-main">
        <div className="coordinate-status-bar">
          <p className="coordinate-kicker">SYS.OP.2026 // V.2.0.0</p>
          <span className="coordinate-status-meta">Mode: Unified Bento Workspace</span>
          {active !== "/" ? <span className="coordinate-status-meta">Subroute: {active}</span> : null}
        </div>
        {children}
      </div>
    </div>
  )
}
