import type {
  Bill,
  DashboardSnapshot,
  InvestmentAccount,
  InvestmentContribution,
  InvestmentTarget,
  Month,
  Transaction,
  TransactionType,
} from "@/lib/supabase/database.types"

function normalizeEnvValue(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

const SUPABASE_URL = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const SUPABASE_SERVICE_KEY = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)

function hasSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false
  try {
    new URL(SUPABASE_URL)
    return true
  } catch {
    return false
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value))
}

function apiHeaders(extra?: HeadersInit): HeadersInit {
  return {
    apikey: SUPABASE_SERVICE_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY ?? ""}`,
    "Content-Type": "application/json",
    ...extra,
  }
}

const READ_REVALIDATE_SECONDS = 30

type RequestOptions = RequestInit & {
  bypassReadCache?: boolean
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing Supabase configuration")
  }

  const { bypassReadCache, ...baseInit } = init ?? {}
  const method = String(baseInit.method ?? "GET").toUpperCase()
  const requestInit: RequestInit = {
    ...baseInit,
    headers: apiHeaders(baseInit.headers),
  }

  if (method === "GET") {
    if (!bypassReadCache && !baseInit.cache && !(baseInit as { next?: unknown }).next) {
      const nextAwareRequestInit = requestInit as RequestInit & { next?: { revalidate: number } }
      nextAwareRequestInit.next = { revalidate: READ_REVALIDATE_SECONDS }
    }
  } else if (!baseInit.cache) {
    requestInit.cache = "no-store"
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...requestInit,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase request failed (${res.status}): ${text}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

function getCurrentYearMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

function getCurrentIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function fallbackSnapshot(): DashboardSnapshot {
  const current = getCurrentYearMonth()
  return {
    month: {
      id: "local-month",
      year: current.year,
      month: current.month,
      starting_cash: 0,
      budget_limit: 0,
      expected_salary: 0,
      payday_date: null,
      salary_received: false,
      salary_received_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    totals: {
      expenses: 0,
      investments: 0,
      salary_received: 0,
      ending_cash: 0,
      budget_progress: 0,
    },
    bills_due_before_payday: [],
    investment_current_allocation: [],
    investment_target_allocation: [],
  }
}

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value)
}

function normalizeMonth(month: Month): Month {
  return {
    ...month,
    starting_cash: toNumber(month.starting_cash),
    budget_limit: toNumber(month.budget_limit),
    expected_salary: toNumber(month.expected_salary),
  }
}

export async function ensureCurrentMonth(): Promise<Month> {
  const current = getCurrentYearMonth()
  return getOrCreateMonth(current.year, current.month)
}

export async function getOrCreateMonth(year: number, month: number): Promise<Month> {
  if (!hasSupabaseConfig()) {
    return {
      ...fallbackSnapshot().month,
      year,
      month,
    }
  }

  try {
    const existing = await request<Month[]>(`/months?year=eq.${year}&month=eq.${month}&select=*`)
    if (existing.length > 0 && existing[0]) {
      return normalizeMonth(existing[0])
    }

    const inserted = await request<Month[]>(`/months`, {
      method: "POST",
      headers: apiHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({
        year,
        month,
        payday_date: null,
        salary_received: false,
        starting_cash: 0,
        budget_limit: 0,
        expected_salary: 0,
      }),
    })

    if (inserted.length > 0 && inserted[0]) {
      return normalizeMonth(inserted[0])
    }
  } catch {
    // Fallback to local month object if Supabase is unreachable or misconfigured.
  }

  return {
    ...fallbackSnapshot().month,
    year,
    month,
  }
}

export async function getDashboardSnapshot(monthId?: string): Promise<DashboardSnapshot> {
  if (!hasSupabaseConfig()) {
    return fallbackSnapshot()
  }

  try {
    const resolvedMonthId = monthId ?? (await ensureCurrentMonth()).id
    if (!isUuid(resolvedMonthId)) return fallbackSnapshot()

    const result = await request<DashboardSnapshot>(`/rpc/get_dashboard_snapshot`, {
      method: "POST",
      body: JSON.stringify({ p_month_id: resolvedMonthId }),
    })

    if (!result || (result as { error?: string }).error) {
      return fallbackSnapshot()
    }

    return {
      ...result,
      month: normalizeMonth(result.month),
      totals: {
        expenses: toNumber(result.totals.expenses),
        investments: toNumber(result.totals.investments),
        salary_received: toNumber(result.totals.salary_received),
        ending_cash: toNumber(result.totals.ending_cash),
        budget_progress: toNumber(result.totals.budget_progress),
      },
      bills_due_before_payday: result.bills_due_before_payday.map((b) => ({
        ...b,
        amount: toNumber(b.amount),
      })),
      investment_current_allocation: result.investment_current_allocation.map((a) => ({
        ...a,
        balance: toNumber(a.balance),
        percent: toNumber(a.percent),
      })),
      investment_target_allocation: result.investment_target_allocation.map((a) => ({
        ...a,
        target_percent: toNumber(a.target_percent),
      })),
    }
  } catch {
    return fallbackSnapshot()
  }
}

export async function listTransactions(monthId?: string): Promise<Transaction[]> {
  if (!hasSupabaseConfig()) return []
  try {
    const month = monthId ? { id: monthId } : await ensureCurrentMonth()
    if (!isUuid(month.id)) return []

    const rows = await request<Transaction[]>(`/transactions?month_id=eq.${month.id}&select=*&order=date.desc`)
    return rows.map((row) => ({ ...row, amount: toNumber(row.amount) }))
  } catch {
    return []
  }
}

export async function listBills(monthId?: string): Promise<Bill[]> {
  if (!hasSupabaseConfig()) return []
  try {
    const month = monthId ? { id: monthId } : await ensureCurrentMonth()
    if (!isUuid(month.id)) return []

    const rows = await request<Bill[]>(`/bills?month_id=eq.${month.id}&select=*&order=due_date.asc`)
    return rows.map((row) => ({ ...row, amount: toNumber(row.amount) }))
  } catch {
    return []
  }
}

export async function listInvestmentAccounts(): Promise<InvestmentAccount[]> {
  if (!hasSupabaseConfig()) return []
  try {
    const rows = await request<InvestmentAccount[]>(`/investment_accounts?select=*&order=name.asc`)
    return rows.map((row) => ({ ...row, current_balance: toNumber(row.current_balance) }))
  } catch {
    return []
  }
}

export async function listInvestmentTargets(): Promise<InvestmentTarget[]> {
  if (!hasSupabaseConfig()) return []
  try {
    const rows = await request<InvestmentTarget[]>(`/investment_targets?select=*&order=name.asc`)
    return rows.map((row) => ({ ...row, target_percent: toNumber(row.target_percent) }))
  } catch {
    return []
  }
}

export async function createTransaction(input: {
  monthId: string
  date: string
  amount: number
  type: TransactionType
  notes?: string
}): Promise<Transaction | null> {
  if (!hasSupabaseConfig() || !isUuid(input.monthId)) return null
  try {
    const rows = await request<Transaction[]>(`/transactions`, {
      method: "POST",
      headers: apiHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({
        month_id: input.monthId,
        date: input.date,
        amount: input.amount,
        type: input.type,
        notes: input.notes ?? null,
      }),
    })

    return rows[0] ? { ...rows[0], amount: toNumber(rows[0].amount) } : null
  } catch {
    return null
  }
}

export async function createBill(input: {
  monthId: string
  name: string
  amount: number
  dueDate: string
  recurring: boolean
}): Promise<Bill | null> {
  if (!hasSupabaseConfig() || !isUuid(input.monthId)) return null

  try {
    const rows = await request<Bill[]>(`/bills`, {
      method: "POST",
      headers: apiHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({
        month_id: input.monthId,
        name: input.name,
        amount: input.amount,
        due_date: input.dueDate,
        recurring: input.recurring,
        paid: false,
      }),
    })

    return rows[0] ? { ...rows[0], amount: toNumber(rows[0].amount) } : null
  } catch {
    return null
  }
}

export async function updateBillPaidStatus(input: {
  billId: string
  paid: boolean
  paidDate?: string
}): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(input.billId)) return

  try {
    await request(`/bills?id=eq.${input.billId}`, {
      method: "PATCH",
      headers: apiHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        paid: input.paid,
        paid_date: input.paid ? input.paidDate ?? getCurrentIsoDate() : null,
      }),
    })
  } catch {
    // no-op; UI should remain usable even if remote write fails.
  }
}

export async function setSalaryReceived(input: {
  monthId: string
  received: boolean
  receivedDate?: string
}): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(input.monthId)) return

  try {
    await request(`/rpc/apply_salary_received`, {
      method: "POST",
      body: JSON.stringify({
        p_month_id: input.monthId,
        p_received: input.received,
        p_received_date: input.receivedDate ?? getCurrentIsoDate(),
      }),
    })
  } catch {
    // no-op; UI should remain usable even if remote write fails.
  }
}

export async function upsertMonthSettings(input: {
  monthId: string
  startingCash: number
  budgetLimit: number
  expectedSalary: number
  paydayDate: string | null
}): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(input.monthId)) return

  try {
    await request(`/months?id=eq.${input.monthId}`, {
      method: "PATCH",
      headers: apiHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        starting_cash: input.startingCash,
        budget_limit: input.budgetLimit,
        expected_salary: input.expectedSalary,
        payday_date: input.paydayDate,
      }),
    })
  } catch {
    // no-op; UI should remain usable even if remote write fails.
  }
}

export async function createInvestmentContribution(input: {
  monthId: string
  date: string
  totalAmount: number
  moves: Array<{ accountId: string; amount: number }>
}): Promise<InvestmentContribution | null> {
  if (!hasSupabaseConfig() || !isUuid(input.monthId)) return null

  try {
    const validMoves = input.moves
      .filter((move) => isUuid(move.accountId) && Number.isFinite(move.amount) && move.amount > 0)
      .map((move) => ({
        account_id: move.accountId,
        amount: Number(move.amount.toFixed(2)),
      }))

    const response = await request<InvestmentContribution | InvestmentContribution[]>(`/rpc/apply_investment_contribution`, {
      method: "POST",
      body: JSON.stringify({
        p_month_id: input.monthId,
        p_total_amount: input.totalAmount,
        p_date: input.date,
        p_moves: validMoves,
      }),
    })

    const contribution = Array.isArray(response) ? response[0] : response
    if (!contribution) return null

    return { ...contribution, total_amount: toNumber(contribution.total_amount) }
  } catch {
    return null
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(id)) return
  try {
    await request(`/transactions?id=eq.${id}`, {
      method: "DELETE",
      headers: apiHeaders({ Prefer: "return=minimal" }),
    })
  } catch {
    // no-op
  }
}

export async function deleteBill(id: string): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(id)) return
  try {
    await request(`/bills?id=eq.${id}`, {
      method: "DELETE",
      headers: apiHeaders({ Prefer: "return=minimal" }),
    })
  } catch {
    // no-op
  }
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  if (!hasSupabaseConfig() || !isUuid(id)) return null
  try {
    const rows = await request<Transaction[]>(`/transactions?id=eq.${id}&select=*&limit=1`)
    return rows[0] ? { ...rows[0], amount: toNumber(rows[0].amount) } : null
  } catch {
    return null
  }
}

export async function getBill(id: string): Promise<Bill | null> {
  if (!hasSupabaseConfig() || !isUuid(id)) return null
  try {
    const rows = await request<Bill[]>(`/bills?id=eq.${id}&select=*&limit=1`)
    return rows[0] ? { ...rows[0], amount: toNumber(rows[0].amount) } : null
  } catch {
    return null
  }
}

export async function updateTransaction(input: {
  id: string
  date: string
  amount: number
  type: TransactionType
  notes?: string
}): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(input.id)) return
  try {
    await request(`/transactions?id=eq.${input.id}`, {
      method: "PATCH",
      headers: apiHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        date: input.date,
        amount: input.amount,
        type: input.type,
        notes: input.notes ?? null,
      }),
    })
  } catch {
    // no-op
  }
}

export async function updateBill(input: {
  id: string
  name: string
  amount: number
  dueDate: string
  recurring: boolean
}): Promise<void> {
  if (!hasSupabaseConfig() || !isUuid(input.id)) return
  try {
    await request(`/bills?id=eq.${input.id}`, {
      method: "PATCH",
      headers: apiHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        name: input.name,
        amount: input.amount,
        due_date: input.dueDate,
        recurring: input.recurring,
      }),
    })
  } catch {
    // no-op
  }
}

export async function rolloverMonth(fromMonthId: string, toMonthId: string): Promise<number> {
  if (!hasSupabaseConfig() || !isUuid(fromMonthId) || !isUuid(toMonthId)) return 0

  try {
    const count = await request<number>(`/rpc/rollover_recurring_bills`, {
      method: "POST",
      body: JSON.stringify({ p_from_month_id: fromMonthId, p_to_month_id: toMonthId }),
    })

    return Number(count)
  } catch {
    return 0
  }
}

export function isSupabaseConfigured() {
  return hasSupabaseConfig()
}

export async function seedDemoDataForCurrentMonth(): Promise<void> {
  if (!hasSupabaseConfig()) return

  const month = await ensureCurrentMonth()
  if (!isUuid(month.id)) return

  const yyyyMm = `${month.year}-${String(month.month).padStart(2, "0")}`

  try {
    await upsertMonthSettings({
      monthId: month.id,
      startingCash: 18500,
      budgetLimit: 26000,
      expectedSalary: 42000,
      paydayDate: `${yyyyMm}-28`,
    })

    await setSalaryReceived({
      monthId: month.id,
      received: true,
      receivedDate: `${yyyyMm}-15`,
    })

    await clearDemoData(month.id)

    const categories = await upsertDefaultCategories()
    const today = `${yyyyMm}-10`

    const expenseRows = [
      { amount: 3200, notes: "DEMO: Rent advance", categoryId: categories.housing },
      { amount: 1450, notes: "DEMO: Groceries", categoryId: categories.food },
      { amount: 800, notes: "DEMO: Transport", categoryId: categories.transport },
    ]

    for (const expense of expenseRows) {
      if (!isUuid(expense.categoryId ?? undefined)) continue

      await request(`/transactions`, {
        method: "POST",
        headers: apiHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          month_id: month.id,
          date: today,
          amount: expense.amount,
          type: "expense",
          category_id: expense.categoryId,
          notes: expense.notes,
        }),
      })
    }

    const bills = [
      { name: "Internet", amount: 1699, dueDate: `${yyyyMm}-20`, recurring: true },
      { name: "Phone", amount: 1299, dueDate: `${yyyyMm}-22`, recurring: true },
      { name: "Electricity", amount: 2400, dueDate: `${yyyyMm}-25`, recurring: true },
    ]

    for (const bill of bills) {
      await createBill({
        monthId: month.id,
        name: bill.name,
        amount: bill.amount,
        dueDate: bill.dueDate,
        recurring: bill.recurring,
      })
    }

    const targets = await listInvestmentTargets()
    const moves = targets
      .filter((target) => isUuid(target.account_id))
      .map((target) => ({
        accountId: target.account_id as string,
        amount: Number(((4500 * target.target_percent) / 100).toFixed(2)),
      }))

    const existingContribution = await request<Array<{ id: string }>>(
      `/investment_contributions?month_id=eq.${month.id}&date=eq.${yyyyMm}-12&total_amount=eq.4500&select=id&limit=1`
    )
    if (existingContribution.length === 0) {
      await createInvestmentContribution({
        monthId: month.id,
        date: `${yyyyMm}-12`,
        totalAmount: 4500,
        moves,
      })
    }
  } catch {
    // no-op; keep test harness usable if remote DB is partially unavailable.
  }
}

export async function runTestScript(scriptName: "budget-thresholds" | "salary-idempotency" | "rollover-preview"): Promise<void> {
  if (!hasSupabaseConfig()) return
  const month = await ensureCurrentMonth()
  if (!isUuid(month.id)) return
  const yyyyMm = `${month.year}-${String(month.month).padStart(2, "0")}`

  if (scriptName === "budget-thresholds") {
    await upsertMonthSettings({
      monthId: month.id,
      startingCash: month.starting_cash,
      budgetLimit: 10000,
      expectedSalary: month.expected_salary,
      paydayDate: month.payday_date,
    })
    await clearDemoData(month.id)

    await createTransaction({
      monthId: month.id,
      date: `${yyyyMm}-05`,
      amount: 6999,
      type: "expense",
      notes: "DEMO: Budget at 69.99%",
    })
    await createTransaction({
      monthId: month.id,
      date: `${yyyyMm}-06`,
      amount: 1001,
      type: "expense",
      notes: "DEMO: Budget crosses 80%",
    })
    await createTransaction({
      monthId: month.id,
      date: `${yyyyMm}-07`,
      amount: 1000,
      type: "expense",
      notes: "DEMO: Budget crosses 90%",
    })
    return
  }

  if (scriptName === "salary-idempotency") {
    await setSalaryReceived({ monthId: month.id, received: true, receivedDate: `${yyyyMm}-15` })
    await setSalaryReceived({ monthId: month.id, received: true, receivedDate: `${yyyyMm}-16` })
    await setSalaryReceived({ monthId: month.id, received: false, receivedDate: `${yyyyMm}-16` })
    await setSalaryReceived({ monthId: month.id, received: true, receivedDate: `${yyyyMm}-17` })
    return
  }

  const isDecember = month.month === 12
  const nextYear = isDecember ? month.year + 1 : month.year
  const nextMonth = isDecember ? 1 : month.month + 1
  const destination = await getOrCreateMonth(nextYear, nextMonth)
  await rolloverMonth(month.id, destination.id)
}

async function clearDemoData(monthId: string) {
  if (!isUuid(monthId)) return

  try {
    await request(`/transactions?month_id=eq.${monthId}&notes=like.*DEMO*`, {
      method: "DELETE",
      headers: apiHeaders({ Prefer: "return=minimal" }),
    })
    await request(`/bills?month_id=eq.${monthId}&name=in.(Internet,Phone,Electricity)`, {
      method: "DELETE",
      headers: apiHeaders({ Prefer: "return=minimal" }),
    })
  } catch {
    // no-op
  }
}

async function upsertDefaultCategories() {
  if (!hasSupabaseConfig()) {
    return { housing: null, food: null, transport: null }
  }

  const payload = [
    { name: "Housing", default_budget: 12000 },
    { name: "Food", default_budget: 7000 },
    { name: "Transport", default_budget: 3000 },
  ]

  try {
    await request(`/categories?on_conflict=name`, {
      method: "POST",
      headers: apiHeaders({
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(payload),
    })

    const rows = await request<Array<{ id: string; name: string }>>(
      `/categories?name=in.(Housing,Food,Transport)&select=id,name`
    )
    const byName = new Map(rows.map((row) => [row.name, row.id]))
    return {
      housing: byName.get("Housing") ?? null,
      food: byName.get("Food") ?? null,
      transport: byName.get("Transport") ?? null,
    }
  } catch {
    return {
      housing: null,
      food: null,
      transport: null,
    }
  }
}
