"use client"

import { useActionState } from "react"

import {
  createBillAction,
  createInvestmentContributionAction,
  createTransactionAction,
  rolloverMonthAction,
  runTestScriptAction,
  seedDemoDataAction,
  setSalaryReceivedAction,
  updateMonthSettingsAction,
} from "@/app/actions"
import type { Month } from "@/lib/supabase/database.types"

const inputClass = "coord-input"

const labelClass = "coord-label"

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function TransactionForm({ className }: { className?: string } = {}) {
  const [state, action, pending] = useActionState(createTransactionAction, null)

  return (
    <form action={action} className={joinClassNames("coordinate-card space-y-3", className)}>
      <h2 className="coordinate-section-title">Add Transaction</h2>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Date</label>
          <input className={inputClass} name="date" type="date" required />
        </div>
        <div>
          <label className={labelClass}>Amount</label>
          <input className={inputClass} name="amount" type="number" step="0.01" min="0.01" required />
        </div>
      </div>
      <div>
        <label className={labelClass}>Type</label>
        <select name="type" className={inputClass} defaultValue="expense">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="investment">Investment</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <input className={inputClass} name="notes" type="text" placeholder="Optional" />
      </div>
      {state?.error ? <p className="coord-error">{state.error}</p> : null}
      <button className="coord-button" disabled={pending}>
        {pending ? "Saving…" : "Save Transaction"}
      </button>
    </form>
  )
}

export function BillForm({ className }: { className?: string } = {}) {
  const [state, action, pending] = useActionState(createBillAction, null)

  return (
    <form action={action} className={joinClassNames("coordinate-card space-y-3", className)}>
      <h2 className="coordinate-section-title">Add Bill</h2>
      <div>
        <label className={labelClass}>Name</label>
        <input className={inputClass} name="name" type="text" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Amount</label>
          <input className={inputClass} name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <label className={labelClass}>Due Date</label>
          <input className={inputClass} name="due_date" type="date" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-[var(--coord-muted)]">
        <input type="checkbox" name="recurring" className="size-4 accent-black" /> Recurring monthly
      </label>
      {state?.error ? <p className="coord-error">{state.error}</p> : null}
      <button className="coord-button" disabled={pending}>
        {pending ? "Saving…" : "Save Bill"}
      </button>
    </form>
  )
}

export function InvestmentContributionForm({ className }: { className?: string } = {}) {
  const [state, action, pending] = useActionState(createInvestmentContributionAction, null)

  return (
    <form
      action={action}
      className={joinClassNames("coordinate-card space-y-3", className)}
    >
      <h2 className="coordinate-section-title">Add Contribution</h2>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Date</label>
          <input className={inputClass} type="date" name="date" required />
        </div>
        <div>
          <label className={labelClass}>Total</label>
          <input className={inputClass} type="number" step="0.01" min="0.01" name="total_amount" required />
        </div>
      </div>
      <div>
        <label className={labelClass}>Split Mode</label>
        <select className="coord-select" name="mode" defaultValue="auto">
          <option value="auto">Auto split by targets</option>
          <option value="manual">Manual split</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Manual Moves</label>
        <textarea
          className="coord-textarea"
          name="manual_moves"
          placeholder="account_uuid:1000.00"
        />
      </div>
      {state?.error ? <p className="coord-error">{state.error}</p> : null}
      <button className="coord-button" disabled={pending}>
        {pending ? "Saving…" : "Save Contribution"}
      </button>
    </form>
  )
}

export function SalaryToggleForm({ month, className }: { month: Month; className?: string }) {
  return (
    <form action={setSalaryReceivedAction} className={joinClassNames("coordinate-card", className)}>
      <div className="coordinate-section-title">Salary Confirmation</div>
      <input type="hidden" name="received_date" value={new Date().toISOString().slice(0, 10)} />
      <button
        type="submit"
        name="received"
        value={month.salary_received ? "false" : "true"}
        className={month.salary_received ? "coord-button-muted" : "coord-button"}
      >
        {month.salary_received ? "Mark as Not Received" : "Mark Salary Received"}
      </button>
    </form>
  )
}

export function MonthSettingsForm({ month, className }: { month: Month; className?: string }) {
  return (
    <form action={updateMonthSettingsAction} className={joinClassNames("coordinate-card space-y-3", className)}>
      <h2 className="coordinate-section-title">Month Settings</h2>
      <div>
        <label className={labelClass}>Starting Cash</label>
        <input className={inputClass} name="starting_cash" type="number" step="0.01" min="0" defaultValue={month.starting_cash} required />
      </div>
      <div>
        <label className={labelClass}>Budget Limit</label>
        <input className={inputClass} name="budget_limit" type="number" step="0.01" min="0" defaultValue={month.budget_limit} required />
      </div>
      <div>
        <label className={labelClass}>Expected Salary</label>
        <input className={inputClass} name="expected_salary" type="number" step="0.01" min="0" defaultValue={month.expected_salary} required />
      </div>
      <div>
        <label className={labelClass}>Payday</label>
        <input className={inputClass} name="payday_date" type="date" defaultValue={month.payday_date ?? ""} />
      </div>
      <button className="coord-button">Save Month</button>
    </form>
  )
}

export function RolloverRecurringBillsForm({ className }: { className?: string } = {}) {
  return (
    <form action={rolloverMonthAction} className={joinClassNames("coordinate-card", className)}>
      <div className="coordinate-section-title">Month Rollover</div>
      <button className="coord-button-muted">
        Copy unpaid recurring bills to next month
      </button>
    </form>
  )
}

export function SeedDemoDataForm({ className }: { className?: string } = {}) {
  return (
    <form action={seedDemoDataAction} className={joinClassNames("coordinate-card", className)}>
      <div className="coordinate-section-title">Seed Data</div>
      <button className="coord-button">
        Seed current month demo dataset
      </button>
    </form>
  )
}

export function TestScriptPanel({ className }: { className?: string } = {}) {
  const scripts: Array<{ key: string; label: string; description: string }> = [
    {
      key: "budget-thresholds",
      label: "Budget Thresholds",
      description: "Creates demo expenses that cross neutral, approaching, and critical budget states.",
    },
    {
      key: "salary-idempotency",
      label: "Salary Idempotency",
      description: "Runs ON/OFF/ON salary toggles and verifies single salary-source transaction behavior.",
    },
    {
      key: "rollover-preview",
      label: "Recurring Rollover",
      description: "Duplicates unpaid recurring bills to next month.",
    },
  ]

  return (
    <section className={joinClassNames("coordinate-card space-y-2", className)}>
      <h2 className="coordinate-section-title">Test Scripts</h2>
      {scripts.map((script) => (
        <form key={script.key} action={runTestScriptAction} className="coord-list-item">
          <input type="hidden" name="script" value={script.key} />
          <div className="mb-1 text-sm">{script.label}</div>
          <p className="mb-2 text-xs text-[var(--coord-muted)]">{script.description}</p>
          <button className="coord-button-muted">
            Run
          </button>
        </form>
      ))}
    </section>
  )
}
