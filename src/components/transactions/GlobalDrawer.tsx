// File: src/components/transactions/GlobalDrawer.tsx
"use client";

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
 * Global transaction drawer mounted at layout level.
 * Handles both desktop Dialog and mobile Sheet views cleanly.
 */
export default function GlobalDrawer({ space }: Props) {
  const { isOpen, type, close } = useTransactionDrawer();

  return (
    <TransactionDrawer
      open={isOpen}
      onOpenChange={close}
      spaceId={space?.id ?? ""}
      defaultType={type}
    />
  );
}
