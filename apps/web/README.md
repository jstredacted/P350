# ₱350 Web App

## Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Database

Supabase MCP migrations applied:
- `finance_mvp_schema_and_rpcs`
- `harden_function_search_path`
- `seed_default_investment_accounts`

Local SQL snapshots are in:
`/Users/justin/Repositories/Personal/₱350/supabase/migrations`

## Routes

- `/` Dashboard
- `/transactions`
- `/bills`
- `/investments`
- `/settings/month`
- `/test-scripts`

## Seed + test scripts

- Open `/test-scripts` to:
- Seed current-month demo data.
- Run scripted checks for budget thresholds, salary idempotency, and recurring bill rollover.
