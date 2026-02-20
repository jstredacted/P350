import { AppShell } from "@/components/layout/app-shell"
import {
  BillsDueCard,
  BudgetCard,
  CashCard,
  InvestmentAllocationCard,
} from "@/components/finance/cards"
import {
  BillForm,
  InvestmentContributionForm,
  MonthSettingsForm,
  RolloverRecurringBillsForm,
  SalaryToggleForm,
  SeedDemoDataForm,
  TestScriptPanel,
  TransactionForm,
} from "@/components/finance/forms"
import { BillsList, InvestmentList, TransactionsList } from "@/components/finance/lists"
import { formatCurrencyPhp } from "@/lib/domain/finance"
import {
  ensureCurrentMonth,
  getDashboardSnapshot,
  isSupabaseConfigured,
  listBills,
  listInvestmentAccounts,
  listInvestmentTargets,
  listTransactions,
} from "@/lib/supabase/http"

export default async function DashboardPage() {
  const month = await ensureCurrentMonth()
  const [snapshot, transactions, bills, accounts, targets] = await Promise.all([
    getDashboardSnapshot(month.id),
    listTransactions(month.id),
    listBills(month.id),
    listInvestmentAccounts(),
    listInvestmentTargets(),
  ])

  return (
    <AppShell active="/">
      <header className="coordinate-page-header">
        <p className="coordinate-kicker">₱350 Control Surface</p>
        <h1 className="coordinate-page-title">Unified cashflow workspace</h1>
        <p className="coordinate-page-subtitle">
          A tighter bento system with clear zones for control, entry, and monitoring. The layout fluidly collapses from
          desktop to mobile.
        </p>
        {!isSupabaseConfigured() ? (
          <div className="coordinate-alert">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your app env to connect live data.
          </div>
        ) : null}
      </header>

      <main className="coordinate-bento">
        <section className="coordinate-card bento-span-8 bento-hero">
          <h2 className="coordinate-section-title">Month Snapshot</h2>
          <div className="bento-summary-grid">
            <article className="bento-summary-tile">
              <span className="coord-label">Month</span>
              <p className="bento-summary-value">
                {snapshot.month.year}-{String(snapshot.month.month).padStart(2, "0")}
              </p>
            </article>
            <article className="bento-summary-tile">
              <span className="coord-label">Budget Limit</span>
              <p className="bento-summary-value">{formatCurrencyPhp(snapshot.month.budget_limit)}</p>
            </article>
            <article className="bento-summary-tile">
              <span className="coord-label">Expected Salary</span>
              <p className="bento-summary-value">{formatCurrencyPhp(snapshot.month.expected_salary)}</p>
            </article>
            <article className="bento-summary-tile">
              <span className="coord-label">Payday</span>
              <p className="bento-summary-value">{snapshot.month.payday_date ?? "Unset"}</p>
            </article>
          </div>
        </section>

        <section className="coordinate-card bento-span-4">
          <h2 className="coordinate-section-title">Quick Controls</h2>
          <div className="bento-stack">
            <SalaryToggleForm month={snapshot.month} className="bento-inline-card" />
            <RolloverRecurringBillsForm className="bento-inline-card" />
            <SeedDemoDataForm className="bento-inline-card" />
          </div>
        </section>

        <div className="bento-span-4">
          <BudgetCard snapshot={snapshot} />
        </div>
        <div className="bento-span-4">
          <CashCard snapshot={snapshot} />
        </div>
        <div className="bento-span-4">
          <MonthSettingsForm month={month} className="bento-inline-card bento-block-fill" />
        </div>

        <div className="bento-span-6">
          <BillsDueCard snapshot={snapshot} />
        </div>
        <div className="bento-span-6">
          <InvestmentAllocationCard snapshot={snapshot} />
        </div>

        <section className="coordinate-card bento-span-12">
          <h2 className="coordinate-section-title">Capture Inputs</h2>
          <div className="bento-entry-grid">
            <TransactionForm className="bento-inline-card" />
            <BillForm className="bento-inline-card" />
            <InvestmentContributionForm className="bento-inline-card" />
          </div>
        </section>

        <section className="coordinate-card bento-span-7">
          <h2 className="coordinate-section-title">Transactions Log</h2>
          <div className="bento-scroll-list">
            <TransactionsList transactions={transactions} />
          </div>
        </section>
        <section className="coordinate-card bento-span-5">
          <h2 className="coordinate-section-title">Bills Ledger</h2>
          <div className="bento-scroll-list">
            <BillsList bills={bills} />
          </div>
        </section>

        <section className="coordinate-card bento-span-7">
          <h2 className="coordinate-section-title">Investment Accounts</h2>
          <div className="bento-scroll-list">
            <InvestmentList accounts={accounts} targets={targets} />
          </div>
        </section>
        <TestScriptPanel className="bento-span-5 bento-block-fill" />
      </main>
    </AppShell>
  )
}
