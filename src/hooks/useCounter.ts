"use client";
import { create } from "zustand";

type CounterState = { value: number; inc: () => void; dec: () => void; reset: () => void };

export const useCounter = create<CounterState>((set) => ({
  value: 0,
  inc: () => set((s) => ({ value: s.value + 1 })),
  dec: () => set((s) => ({ value: s.value - 1 })),
  reset: () => set({ value: 0 }),
}));
