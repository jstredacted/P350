export function calculateEndingCash(input: {
  startingCash: number
  salaryReceived: number
  totalExpenses: number
  investmentContributions: number
}) {
  return (
    input.startingCash +
    input.salaryReceived -
    input.totalExpenses -
    input.investmentContributions
  )
}

export function calculateBudgetProgress(totalExpenses: number, budgetLimit: number) {
  if (budgetLimit <= 0) return 0
  return (totalExpenses / budgetLimit) * 100
}

export type BudgetState = "neutral" | "approaching" | "critical"

export function getBudgetState(progressPercent: number): BudgetState {
  if (progressPercent > 90) return "critical"
  if (progressPercent >= 70) return "approaching"
  return "neutral"
}

export function getBudgetMessage(progressPercent: number) {
  const state = getBudgetState(progressPercent)
  if (state === "critical") return "Critical"
  if (state === "approaching") return "Approaching limit"
  return "Stable"
}

export function formatCurrencyPhp(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export type CounterFormat = "number" | "currency-php"

const counterPhpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

const counterNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

export function formatCounterValue(value: number, format: CounterFormat) {
  return format === "currency-php" ? counterPhpFormatter.format(value) : counterNumberFormatter.format(value)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function splitByTargets(total: number, targets: Array<{ accountId: string; targetPercent: number }>) {
  if (targets.length === 0) return []

  let running = 0
  const moves = targets.map((target, index) => {
    if (index === targets.length - 1) {
      const last = Number((total - running).toFixed(2))
      return { accountId: target.accountId, amount: last }
    }

    const amount = Number(((total * target.targetPercent) / 100).toFixed(2))
    running += amount
    return { accountId: target.accountId, amount }
  })

  return moves
}
