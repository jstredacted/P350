import { AppShell } from "@/components/layout/app-shell"
import { BillForm, RolloverRecurringBillsForm } from "@/components/finance/forms"
import { BillsList } from "@/components/finance/lists"
import { ensureCurrentMonth, listBills } from "@/lib/supabase/http"

export default async function BillsPage() {
  const month = await ensureCurrentMonth()
  const bills = await listBills(month.id)

  return (
    <AppShell active="/bills">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">Bills</p>
        <h1 className="coordinate-page-title">Due-date discipline</h1>
        <p className="coordinate-page-subtitle">Track unpaid obligations and roll recurring charges into the next cycle.</p>
      </header>
      <main className="coordinate-stack">
        <BillForm />
        <RolloverRecurringBillsForm />
        <section className="coordinate-card">
          <h2 className="coordinate-section-title">Open Bills</h2>
          <BillsList bills={bills} />
        </section>
      </main>
    </AppShell>
  )
}
