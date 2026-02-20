import { AppShell } from "@/components/layout/app-shell"
import { InvestmentContributionForm } from "@/components/finance/forms"
import { InvestmentList } from "@/components/finance/lists"
import { listInvestmentAccounts, listInvestmentTargets } from "@/lib/supabase/http"

export default async function InvestmentsPage() {
  const [accounts, targets] = await Promise.all([listInvestmentAccounts(), listInvestmentTargets()])

  return (
    <AppShell active="/investments">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">Investments</p>
        <h1 className="coordinate-page-title">Allocation control</h1>
        <p className="coordinate-page-subtitle">
          Register contributions and monitor actual distribution against target percentages.
        </p>
      </header>
      <main className="coordinate-stack">
        <InvestmentContributionForm />
        <section className="coordinate-card">
          <h2 className="coordinate-section-title">Accounts</h2>
          <InvestmentList accounts={accounts} targets={targets} />
        </section>
      </main>
    </AppShell>
  )
}
