"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

let client: QueryClient | null = null;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => client ?? new QueryClient());
  if (!client) client = queryClient;
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
