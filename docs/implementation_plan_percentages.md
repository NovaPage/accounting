# Implementation Plan - Real Dashboard Percentages

## Goal

Replace hardcoded percentage changes in the dashboard with real calculations comparing current month vs previous month.

## User Review Required

> [!IMPORTANT]
> Requires running a SQL migration to update `get_dashboard_metrics`.

## Proposed Changes

### Database

#### [NEW] [04_dashboard_percentages.sql](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/docs/db/migrations/04_dashboard_percentages.sql)

- Update `get_dashboard_metrics` to:
  - Calculate `v_previous_month_income` and `v_previous_month_expenses`.
  - Calculate `income_change_pct` and `expenses_change_pct`.
  - Return these new fields in the JSON object.

### Code

#### [MODIFY] [types.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/features/dashboard/types.ts)

- Update `DashboardMetrics` interface to include:
  - `incomeChangePct: number`
  - `expensesChangePct: number`

#### [MODIFY] [dashboard.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/lib/queries/dashboard.ts)

- Update `fetchDashboardMetrics` to map the new fields from the RPC response.

#### [MODIFY] [DashboardStats.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/features/dashboard/components/DashboardStats.tsx)

- Use `metrics.incomeChangePct` and `metrics.expensesChangePct` instead of hardcoded strings.
- Format the display (e.g., green for positive income change, red for negative).

## Verification Plan

1.  Run SQL migration.
2.  Add transactions for previous month (via SQL or UI if possible, but UI defaults to today).
3.  Check Dashboard to see if percentages reflect the difference.
