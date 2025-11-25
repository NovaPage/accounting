# Implementation Plan - Transaction Forms

## Goal

Implement functional forms for Expense, Income, and Transfer transactions, connected to the database via Server Actions.

## User Review Required

> [!IMPORTANT]
> I will create a new server action `upsertTransactionAction` to handle transaction creation.
> I will also create a new query file `src/lib/queries/categories.ts` to fetch categories.

## Proposed Changes

### Data Layer

#### [NEW] [categories.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/lib/queries/categories.ts)

- Implement `fetchCategories(spaceId)` to return categories for the select inputs.

#### [NEW] [transactions.ts](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/app/actions/transactions.ts)

- Implement `upsertTransactionAction` to insert/update records in the `transactions` table.
- Handle validation and error mapping.

### UI Components

#### [MODIFY] [TransactionDrawer.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/TransactionDrawer.tsx)

- Fetch `accounts` and `categories` when the drawer is opened (or mount).
- Pass these lists to the form components.
- Use `fetchAccounts` (existing) and `fetchCategories` (new).
- Since it's a client component, we might need a wrapper or a `useEffect` calling a server action/server-side helper.
  - _Alternative_: Pass data from the parent. But `GlobalAdd` is likely client-side.
  - _Decision_: I'll create a `src/app/actions/data.ts` or similar to fetch "drawer data" (accounts + categories) in one go, or just call the existing server functions if they are safe for client (they are "use server" functions, so yes).

#### [MODIFY] [ExpenseForm.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/forms/ExpenseForm.tsx)

- Connect to `upsertTransactionAction`.
- Use real `accounts` and `categories` props.

#### [MODIFY] [IncomeForm.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/forms/IncomeForm.tsx)

- Implement similar to ExpenseForm but with `type="income"`.

#### [MODIFY] [TransferForm.tsx](file:///d:/PRGRAMING/PROYECTOS/Proyectos-NovaPage/accounting/src/components/transactions/forms/TransferForm.tsx)

- Implement transfer logic (Source Account -> Destination Account).
- `type="transfer"`.
- Needs two account selects (Source, Destination).

## Verification Plan

### Manual Verification

1.  **Expense**: Open drawer, select Expense. Fill form. Submit. Verify toast success and data in Dashboard (Recent Transactions).
2.  **Income**: Open drawer, select Income. Fill form. Submit. Verify.
3.  **Transfer**: Open drawer, select Transfer. Select different accounts. Submit. Verify.
4.  **Validation**: Try submitting empty forms. Verify error messages.
