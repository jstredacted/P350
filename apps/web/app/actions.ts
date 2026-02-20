"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { splitByTargets } from "@/lib/domain/finance"
import {
  createBill,
  createInvestmentContribution,
  createTransaction,
  deleteBill,
  deleteTransaction,
  ensureCurrentMonth,
  getBill,
  getOrCreateMonth,
  getTransaction,
  listInvestmentTargets,
  rolloverMonth,
  runTestScript,
  seedDemoDataForCurrentMonth,
  setSalaryReceived,
  updateBill,
  updateBillPaidStatus,
  updateTransaction,
  upsertMonthSettings,
} from "@/lib/supabase/http"
import type { TransactionType } from "@/lib/supabase/database.types"

function parseMoney(input: FormDataEntryValue | null) {
  return Number.parseFloat(String(input ?? "0"))
}

function parseDate(input: FormDataEntryValue | null) {
  return String(input ?? new Date().toISOString().slice(0, 10))
}

export async function createTransactionAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  try {
    const month = await ensureCurrentMonth()
    const result = await createTransaction({
      monthId: month.id,
      date: parseDate(formData.get("date")),
      amount: parseMoney(formData.get("amount")),
      type: String(formData.get("type")) as TransactionType,
      notes: String(formData.get("notes") ?? ""),
    })
    if (!result) return { error: "Failed to save transaction. Check your connection." }
    revalidatePath("/")
    revalidatePath("/transactions")
    return null
  } catch {
    return { error: "An unexpected error occurred." }
  }
}

export async function createBillAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  try {
    const month = await ensureCurrentMonth()
    const result = await createBill({
      monthId: month.id,
      name: String(formData.get("name") ?? ""),
      amount: parseMoney(formData.get("amount")),
      dueDate: parseDate(formData.get("due_date")),
      recurring: String(formData.get("recurring") ?? "off") === "on",
    })
    if (!result) return { error: "Failed to save bill. Check your connection." }
    revalidatePath("/")
    revalidatePath("/bills")
    return null
  } catch {
    return { error: "An unexpected error occurred." }
  }
}

export async function updateBillPaidStatusAction(formData: FormData) {
  await updateBillPaidStatus({
    billId: String(formData.get("bill_id")),
    paid: String(formData.get("paid")) === "true",
    paidDate: parseDate(formData.get("paid_date")),
  })

  revalidatePath("/")
  revalidatePath("/bills")
}

export async function setSalaryReceivedAction(formData: FormData) {
  const month = await ensureCurrentMonth()
  await setSalaryReceived({
    monthId: month.id,
    received: String(formData.get("received")) === "true",
    receivedDate: parseDate(formData.get("received_date")),
  })

  revalidatePath("/")
  revalidatePath("/settings/month")
}

export async function updateMonthSettingsAction(formData: FormData) {
  const month = await ensureCurrentMonth()

  await upsertMonthSettings({
    monthId: month.id,
    startingCash: parseMoney(formData.get("starting_cash")),
    budgetLimit: parseMoney(formData.get("budget_limit")),
    expectedSalary: parseMoney(formData.get("expected_salary")),
    paydayDate: String(formData.get("payday_date") ?? "") || null,
  })

  revalidatePath("/")
  revalidatePath("/settings/month")
}

export async function createInvestmentContributionAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const month = await ensureCurrentMonth()
  const totalAmount = parseMoney(formData.get("total_amount"))
  const mode = String(formData.get("mode") ?? "auto")
  const date = parseDate(formData.get("date"))

  let moves: Array<{ accountId: string; amount: number }> = []

  if (mode === "auto") {
    const targets = await listInvestmentTargets()
    moves = splitByTargets(
      totalAmount,
      targets
        .filter((target) => Boolean(target.account_id))
        .map((target) => ({
          accountId: target.account_id as string,
          targetPercent: target.target_percent,
        }))
    )
  } else {
    const raw = String(formData.get("manual_moves") ?? "")
    moves = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [accountId, amount] = line.split(":")
        return { accountId: accountId?.trim() ?? "", amount: Number.parseFloat(amount ?? "") }
      })
      .filter((move) => move.accountId && Number.isFinite(move.amount) && move.amount > 0)
  }

  try {
    const result = await createInvestmentContribution({
      monthId: month.id,
      totalAmount,
      date,
      moves,
    })
    if (!result) return { error: "Failed to save contribution. Check your connection." }
    revalidatePath("/")
    revalidatePath("/investments")
    return null
  } catch {
    return { error: "An unexpected error occurred." }
  }
}

export async function rolloverMonthAction() {
  const fromMonth = await ensureCurrentMonth()
  const isDecember = fromMonth.month === 12
  const toYear = isDecember ? fromMonth.year + 1 : fromMonth.year
  const toMonthNumber = isDecember ? 1 : fromMonth.month + 1
  const toMonth = await getOrCreateMonth(toYear, toMonthNumber)

  await rolloverMonth(fromMonth.id, toMonth.id)

  revalidatePath("/")
  revalidatePath("/bills")
  revalidatePath("/settings/month")
}

export async function seedDemoDataAction() {
  await seedDemoDataForCurrentMonth()
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/bills")
  revalidatePath("/investments")
  revalidatePath("/settings/month")
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  await deleteTransaction(id)
  revalidatePath("/")
  revalidatePath("/transactions")
}

export async function deleteBillAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  await deleteBill(id)
  revalidatePath("/")
  revalidatePath("/bills")
}

export async function updateTransactionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  await updateTransaction({
    id,
    date: parseDate(formData.get("date")),
    amount: parseMoney(formData.get("amount")),
    type: String(formData.get("type")) as TransactionType,
    notes: String(formData.get("notes") ?? ""),
  })
  revalidatePath("/")
  revalidatePath("/transactions")
  redirect("/transactions")
}

export async function updateBillAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  await updateBill({
    id,
    name: String(formData.get("name") ?? ""),
    amount: parseMoney(formData.get("amount")),
    dueDate: parseDate(formData.get("due_date")),
    recurring: String(formData.get("recurring") ?? "off") === "on",
  })
  revalidatePath("/")
  revalidatePath("/bills")
  redirect("/bills")
}

export async function runTestScriptAction(formData: FormData) {
  const script = String(formData.get("script") ?? "")
  if (
    script !== "budget-thresholds" &&
    script !== "salary-idempotency" &&
    script !== "rollover-preview"
  ) {
    return
  }

  await runTestScript(script)

  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/bills")
  revalidatePath("/investments")
  revalidatePath("/settings/month")
}
