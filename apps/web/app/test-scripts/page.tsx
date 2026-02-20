import { AppShell } from "@/components/layout/app-shell"
import { SeedDemoDataForm, TestScriptPanel } from "@/components/finance/forms"
import { ensureCurrentMonth, getDashboardSnapshot, listBills, listTransactions } from "@/lib/supabase/http"

export default async function TestScriptsPage() {
  const month = await ensureCurrentMonth()
  const [snapshot, transactions, bills] = await Promise.all([
    getDashboardSnapshot(month.id),
    listTransactions(month.id),
    listBills(month.id),
  ])

  return (
    <AppShell active="/test-scripts">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">Test Harness</p>
        <h1 className="coordinate-page-title">Seed + scripted scenarios</h1>
        <p className="coordinate-page-subtitle">Generate deterministic fixtures and validate core month operations.</p>
      </header>

      <main className="coordinate-stack">
        <SeedDemoDataForm />
        <TestScriptPanel />

        <section className="coordinate-card">
          <h2 className="coordinate-section-title">Current Snapshot</h2>
          <div className="coordinate-mini-grid">
            <div className="coordinate-mini-card">
              <div className="coord-label">Month</div>
              <div className="tabular-nums">{snapshot.month.year}-{String(snapshot.month.month).padStart(2, "0")}</div>
            </div>
            <div className="coordinate-mini-card">
              <div className="coord-label">Budget Progress</div>
              <div className="tabular-nums">{snapshot.totals.budget_progress.toFixed(2)}%</div>
            </div>
            <div className="coordinate-mini-card">
              <div className="coord-label">Transactions</div>
              <div className="tabular-nums">{transactions.length}</div>
            </div>
            <div className="coordinate-mini-card">
              <div className="coord-label">Bills</div>
              <div className="tabular-nums">{bills.length}</div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
