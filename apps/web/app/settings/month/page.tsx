import { AppShell } from "@/components/layout/app-shell"
import { MonthSettingsForm } from "@/components/finance/forms"
import { ensureCurrentMonth } from "@/lib/supabase/http"

export default async function MonthSettingsPage() {
  const month = await ensureCurrentMonth()

  return (
    <AppShell active="/settings/month">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">Month Setup</p>
        <h1 className="coordinate-page-title">Starting cash, budget, salary</h1>
        <p className="coordinate-page-subtitle">Configure month-level controls that drive all dashboard totals.</p>
      </header>
      <main className="coordinate-stack">
        <MonthSettingsForm month={month} />
      </main>
    </AppShell>
  )
}
