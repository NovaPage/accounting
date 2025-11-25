# Implementation Plan - Add Payee/Source Field

## Goal

Add a `payee` field to transactions to track "Who" (Payee for expenses, Payer for income).

## User Review Required

> [!IMPORTANT]
> Requires running a SQL migration to add the `payee` column to the `transactions` table.

## Proposed Changes

### Database

#### [NEW] [01_add_payee_column.sql](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/docs/db/migrations/01_add_payee_column.sql)

- `ALTER TABLE transactions ADD COLUMN payee text;`

### Code

#### [MODIFY] [database.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/types/database.ts)

- Add `payee` to `transactions` Row/Insert/Update types.

#### [MODIFY] [transactions.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/app/actions/transactions.ts)

- Update `UpsertTransactionInput` to include `payee`.
- Pass `payee` to the insert payload.

#### [MODIFY] [IncomeForm.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/forms/IncomeForm.tsx)

- Add "Origen" (Source) input field mapped to `payee`.

#### [MODIFY] [ExpenseForm.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/forms/ExpenseForm.tsx)

- Add "Beneficiario" (Payee) input field mapped to `payee`.

## Verification Plan

1.  Run SQL migration.
2.  Create Income with "Source". Verify in DB/Dashboard.
3.  Create Expense with "Payee". Verify.
