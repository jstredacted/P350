import { notFound } from "next/navigation"

import { updateTransactionAction } from "@/app/actions"
import { getTransaction } from "@/lib/supabase/http"

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tx = await getTransaction(id)

  if (!tx) {
    notFound()
  }

  return (
    <main className="coordinate-main">
      <div className="coordinate-page-header">
        <p className="coordinate-kicker">Transactions</p>
        <h1 className="coordinate-page-title">Edit Transaction</h1>
      </div>

      <form action={updateTransactionAction} className="coordinate-card space-y-3" style={{ maxWidth: "32rem" }}>
        <input type="hidden" name="id" value={tx.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="coord-label">Date</label>
            <input className="coord-input" name="date" type="date" defaultValue={tx.date} required />
          </div>
          <div>
            <label className="coord-label">Amount</label>
            <input className="coord-input" name="amount" type="number" step="0.01" min="0.01" defaultValue={tx.amount} required />
          </div>
        </div>
        <div>
          <label className="coord-label">Type</label>
          <select name="type" className="coord-input" defaultValue={tx.type}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="investment">Investment</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div>
          <label className="coord-label">Notes</label>
          <input className="coord-input" name="notes" type="text" defaultValue={tx.notes ?? ""} placeholder="Optional" />
        </div>
        <div className="flex gap-2">
          <button className="coord-button">Save Changes</button>
          <a href="/transactions" className="coord-button-muted" style={{ display: "inline-block", textAlign: "center" }}>
            Cancel
          </a>
        </div>
      </form>
    </main>
  )
}
