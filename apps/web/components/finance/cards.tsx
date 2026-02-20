import { clamp, formatCurrencyPhp, getBudgetMessage, getBudgetState } from "@/lib/domain/finance"
import type { DashboardSnapshot } from "@/lib/supabase/database.types"
import { CountUp } from "@/components/visual/count-up"
import { RollingCounter } from "@/components/visual/rolling-counter"

export function DataCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`coordinate-card ${className ?? ""}`}>
      <h2 className="coordinate-section-title">{title}</h2>
      {children}
    </section>
  )
}

export function BudgetCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const progress = clamp(snapshot.totals.budget_progress, 0, 100)
  const state = getBudgetState(progress)
  const tone =
    state === "critical"
      ? "text-black"
      : state === "approaching"
        ? "text-[#3e3a32]"
        : "text-[#6b6459]"

  return (
    <DataCard title="Budget Pulse">
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-black/15 pb-2">
        <div className="text-3xl font-semibold tracking-tight">
          <CountUp to={snapshot.totals.expenses} format="currency-php" />
        </div>
        <div className="coord-badge">{formatCurrencyPhp(snapshot.month.budget_limit)}</div>
      </div>
      <div className="coordinate-segment-track">
        {Array.from({ length: 20 }).map((_, i) => {
          const filled = i < Math.round((progress / 100) * 20)
          return <span key={i} className={`coordinate-segment${filled ? " is-filled" : ""}`} />
        })}
      </div>
      <div className={`mt-3 text-xs uppercase tracking-[0.16em] ${tone}`}>{getBudgetMessage(progress)}</div>
    </DataCard>
  )
}

export function CashCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <DataCard title="Cash Overview">
      <div className="mb-3 border-b border-black/15 pb-2 text-4xl font-semibold tracking-tight">
        <RollingCounter value={snapshot.totals.ending_cash} format="currency-php" />
      </div>
      <div className="coordinate-mini-grid text-xs">
        <Row label="Starting" value={snapshot.month.starting_cash} />
        <Row label="Salary" value={snapshot.totals.salary_received} />
        <Row label="Expenses" value={-snapshot.totals.expenses} />
        <Row label="Investments" value={-snapshot.totals.investments} />
      </div>
    </DataCard>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="coordinate-mini-card">
      <div className="coord-label">{label}</div>
      <div className="mt-1 text-sm tabular-nums">{formatCurrencyPhp(value)}</div>
    </div>
  )
}

export function BillsDueCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <DataCard title="Bills Due Before Payday">
      {snapshot.bills_due_before_payday.length === 0 ? (
        <p className="coord-empty">No unpaid bills due before payday.</p>
      ) : (
        <ul className="coord-list">
          {snapshot.bills_due_before_payday.map((bill) => (
            <li key={bill.id} className="coord-list-item">
              <div className="coord-list-head">
                <span>{bill.name}</span>
                <span className="tabular-nums">{formatCurrencyPhp(Number(bill.amount))}</span>
              </div>
              <div className="coord-list-meta">Due {bill.due_date}</div>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  )
}

export function InvestmentAllocationCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const targetByAccount = new Map(
    snapshot.investment_target_allocation
      .filter((target) => target.account_id)
      .map((target) => [target.account_id as string, target])
  )

  return (
    <DataCard title="Investment Allocation">
      <div className="coord-list">
        {snapshot.investment_current_allocation.length === 0 ? (
          <p className="coord-empty">No accounts yet. Add ETF/Crypto in Supabase.</p>
        ) : (
          snapshot.investment_current_allocation.map((item) => {
            const target = targetByAccount.get(item.account_id)
            return (
              <div key={item.account_id} className="coord-list-item">
                <div className="coord-list-head">
                  <span>{item.name}</span>
                  <span>{Number(item.percent).toFixed(1)}%</span>
                </div>
                <div className="coord-list-meta">
                  Target {target ? `${Number(target.target_percent).toFixed(1)}%` : "Not set"}
                </div>
              </div>
            )
          })
        )}
      </div>
    </DataCard>
  )
}
