import { AppShell } from "@/components/layout/app-shell"
import { TransactionForm } from "@/components/finance/forms"
import { TransactionsList } from "@/components/finance/lists"
import { ensureCurrentMonth, listTransactions } from "@/lib/supabase/http"

export default async function TransactionsPage() {
  const month = await ensureCurrentMonth()
  const transactions = await listTransactions(month.id)

  return (
    <AppShell active="/transactions">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">Transactions</p>
        <h1 className="coordinate-page-title">Capture every money move</h1>
        <p className="coordinate-page-subtitle">
          Log expenses, income, transfers, and investments into a single ledger.
        </p>
      </header>
      <main className="coordinate-stack">
        <TransactionForm />
        <section className="coordinate-card">
          <h2 className="coordinate-section-title">Log</h2>
          <TransactionsList transactions={transactions} />
        </section>
      </main>
    </AppShell>
  )
}
