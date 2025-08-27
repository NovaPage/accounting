/**
 * Login page (Server Component, Next 15).
 * - Await the Promise-based `searchParams` before using it.
 * - If user is already authenticated, redirect to /dashboard (or ?next).
 * - Otherwise render the SignInCard (Google button).
 * UI strings in Spanish.
 */
import { redirect } from "next/navigation";
import SignInCard from "@/components/auth/SignInCard";
import { getServerComponentClient } from "@/lib/supabase/server";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export interface LoginPageProps {
  searchParams: PageSearchParams;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<JSX.Element> {
  // Next 15: searchParams is a Promise — you must await it
  const sp = await searchParams;

  const rawNext = sp.next;
  const nextStr = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const safeNext = typeof nextStr === "string" && nextStr.startsWith("/") ? nextStr : "/dashboard";

  const supabase = await getServerComponentClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect(safeNext);
  }

  return <SignInCard nextUrl={safeNext} />;
}
