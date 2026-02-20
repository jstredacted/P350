import { notFound } from "next/navigation"

import { updateBillAction } from "@/app/actions"
import { getBill } from "@/lib/supabase/http"

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bill = await getBill(id)

  if (!bill) {
    notFound()
  }

  return (
    <main className="coordinate-main">
      <div className="coordinate-page-header">
        <p className="coordinate-kicker">Bills</p>
        <h1 className="coordinate-page-title">Edit Bill</h1>
      </div>

      <form action={updateBillAction} className="coordinate-card space-y-3" style={{ maxWidth: "32rem" }}>
        <input type="hidden" name="id" value={bill.id} />
        <div>
          <label className="coord-label">Name</label>
          <input className="coord-input" name="name" type="text" defaultValue={bill.name} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="coord-label">Amount</label>
            <input className="coord-input" name="amount" type="number" step="0.01" min="0" defaultValue={bill.amount} required />
          </div>
          <div>
            <label className="coord-label">Due Date</label>
            <input className="coord-input" name="due_date" type="date" defaultValue={bill.due_date} required />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--coord-muted)]">
          <input type="checkbox" name="recurring" className="size-4 accent-black" defaultChecked={bill.recurring} /> Recurring monthly
        </label>
        <div className="flex gap-2">
          <button className="coord-button">Save Changes</button>
          <a href="/bills" className="coord-button-muted" style={{ display: "inline-block", textAlign: "center" }}>
            Cancel
          </a>
        </div>
      </form>
    </main>
  )
}
