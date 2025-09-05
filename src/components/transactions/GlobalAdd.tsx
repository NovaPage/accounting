// File: src/components/transactions/GlobalAdd.tsx
"use client";

import GlobalAddButton from "./GlobalAddButton";
import TransactionDrawer from "./TransactionDrawer";
import { useTransactionDrawer } from "@/hooks/useTransactionDrawer";

type Space = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

type Props = {
  space: Space | null;
};

/**
 * Client component that orchestrates the GlobalAddButton and the TransactionDrawer.
 * It receives the active space as a prop from its parent Server Component.
 */
export default function GlobalAdd({ space }: Props) {
  const { isOpen, type, close } = useTransactionDrawer();

  return (
    <>
      <GlobalAddButton />
      <TransactionDrawer
        open={isOpen}
        onOpenChange={close}
        spaceId={space?.id ?? ""} // Pass space.id or an empty string. The drawer handles the empty case.
        defaultType={type}
      />
    </>
  );
}
