// File: src/hooks/useTransactionDrawer.ts
"use client";

import { create } from "zustand";

/**
 * Drawer types supported by the transaction UI.
 */
export type DrawerType = "expense" | "income" | "transfer";

/**
 * UI store for the Transaction Drawer.
 * Client-only. Keeps simple, predictable API.
 */
type DrawerState = {
  isOpen: boolean;
  type: DrawerType;
  open: (type?: DrawerType) => void;
  close: () => void;
  setType: (type: DrawerType) => void;
};

export const useTransactionDrawer = create<DrawerState>((set) => ({
  isOpen: false,
  type: "expense",
  open: (type?: DrawerType) =>
    set((s) => ({ isOpen: true, type: type ?? s.type })),
  close: () => set({ isOpen: false }),
  setType: (type: DrawerType) => set({ type }),
}));
