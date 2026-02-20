import { deleteBillAction, deleteTransactionAction, updateBillPaidStatusAction } from "@/app/actions"
import { formatCurrencyPhp } from "@/lib/domain/finance"
import type { Bill, InvestmentAccount, InvestmentTarget, Transaction } from "@/lib/supabase/database.types"

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="coord-empty">No transactions yet.</p>
  }

  return (
    <ul className="coord-list">
      {transactions.map((tx) => (
        <li key={tx.id} className="coord-list-item">
          <div className="coord-list-head">
            <span className="coord-badge">{tx.type}</span>
            <span className="tabular-nums">{formatCurrencyPhp(tx.amount)}</span>
          </div>
          <div className="coord-list-meta">{tx.date}</div>
          {tx.notes ? <div className="mt-1 text-xs text-[var(--coord-muted)]">{tx.notes}</div> : null}
          <div className="mt-2 flex gap-2">
            <a href={`/transactions/${tx.id}/edit`} className="coord-button-muted" style={{ display: "inline-block", width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
              Edit
            </a>
            <form action={deleteTransactionAction} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={tx.id} />
              <button className="coord-button-muted" style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
                Delete
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function BillsList({ bills }: { bills: Bill[] }) {
  if (bills.length === 0) {
    return <p className="coord-empty">No bills yet.</p>
  }

  return (
    <ul className="coord-list">
      {bills.map((bill) => (
        <li key={bill.id} className="coord-list-item">
          <div className="coord-list-head">
            <span>{bill.name}</span>
            <span className="tabular-nums">{formatCurrencyPhp(bill.amount)}</span>
          </div>
          <div className="coord-list-meta">Due {bill.due_date}</div>
          <div className="mt-2 flex gap-2">
            <form action={updateBillPaidStatusAction} style={{ display: "contents" }}>
              <input type="hidden" name="bill_id" value={bill.id} />
              <input type="hidden" name="paid_date" value={new Date().toISOString().slice(0, 10)} />
              <button
                name="paid"
                value={bill.paid ? "false" : "true"}
                className={bill.paid ? "coord-button-muted" : "coord-button"}
                style={{ width: "auto", padding: "0.3rem 0.7rem", fontSize: "0.7rem", flexShrink: 0 }}
              >
                {bill.paid ? "Mark Unpaid" : "Mark Paid"}
              </button>
            </form>
            <a href={`/bills/${bill.id}/edit`} className="coord-button-muted" style={{ display: "inline-block", width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
              Edit
            </a>
            <form action={deleteBillAction} style={{ display: "contents" }}>
              <input type="hidden" name="id" value={bill.id} />
              <button className="coord-button-muted" style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}>
                Delete
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function InvestmentList({
  accounts,
  targets,
}: {
  accounts: InvestmentAccount[]
  targets: InvestmentTarget[]
}) {
  if (accounts.length === 0) {
    return <p className="coord-empty">No investment accounts found.</p>
  }

  const targetByAccount = new Map(targets.filter((item) => item.account_id).map((item) => [item.account_id as string, item]))

  return (
    <ul className="coord-list">
      {accounts.map((account) => {
        const target = targetByAccount.get(account.id)

        return (
          <li key={account.id} className="coord-list-item">
            <div className="coord-list-head">
              <span>{account.name}</span>
              <span className="tabular-nums">{formatCurrencyPhp(account.current_balance)}</span>
            </div>
            <div className="coord-list-meta">
              {account.type} • Target {target ? `${target.target_percent}%` : "not set"}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
