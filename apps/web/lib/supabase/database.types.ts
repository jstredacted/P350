export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TransactionType = "expense" | "income" | "investment" | "transfer"

export interface Month {
  id: string
  year: number
  month: number
  starting_cash: number
  budget_limit: number
  expected_salary: number
  payday_date: string | null
  salary_received: boolean
  salary_received_date: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  month_id: string
  date: string
  amount: number
  type: TransactionType
  category_id: string | null
  notes: string | null
  source: string | null
  source_ref: string | null
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  month_id: string
  name: string
  amount: number
  due_date: string
  paid: boolean
  paid_date: string | null
  recurring: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  default_budget: number
  created_at: string
}

export interface InvestmentAccount {
  id: string
  name: string
  type: string
  current_balance: number
  created_at: string
  updated_at: string
}

export interface InvestmentTarget {
  id: string
  account_id: string | null
  name: string
  target_percent: number
  created_at: string
  updated_at: string
}

export interface InvestmentContribution {
  id: string
  month_id: string
  total_amount: number
  date: string
  created_at: string
  updated_at: string
}

export interface InvestmentMove {
  id: string
  contribution_id: string
  account_id: string
  amount: number
  created_at: string
}

export interface DashboardSnapshot {
  month: Month
  totals: {
    expenses: number
    investments: number
    salary_received: number
    ending_cash: number
    budget_progress: number
  }
  bills_due_before_payday: Array<Pick<Bill, "id" | "name" | "amount" | "due_date" | "paid" | "recurring">>
  investment_current_allocation: Array<{
    account_id: string
    name: string
    balance: number
    percent: number
  }>
  investment_target_allocation: Array<{
    id: string
    name: string
    target_percent: number
    account_id: string | null
  }>
}
