/**
 * Keeps Supabase session fresh and syncs cookies at the edge.
 * - Uses CookieMethodsServer (new shape): getAll / setAll
 * - Normalizes sameSite from cookie package (boolean | union) to Next's union type
 * Code & comments in English. No user-facing strings here.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SerializeOptions } from "cookie";
import { publicEnv } from "@/lib/supabase/env";

/** Next's cookie options shape (stricter sameSite) */
type NextCookieOptions = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
};

/** SSR adapter expects Partial<CookieSerializeOptions> */
type SetAllCookie = {
  name: string;
  value: string;
  options?: Partial<SerializeOptions>;
};

/** Map cookie sameSite boolean to Next's union */
function toNextCookieOptions(
  options?: Partial<SerializeOptions>
): NextCookieOptions | undefined {
  if (!options) return undefined;

  const { sameSite, ...rest } = options;
  let normalized: NextCookieOptions["sameSite"];

  if (sameSite === true) normalized = "strict";       // cookie: true -> Strict
  else if (sameSite === false || sameSite === undefined) normalized = undefined; // omit
  else normalized = sameSite;                         // "lax" | "strict" | "none"

  return { ...rest, sameSite: normalized };
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Preserve incoming headers for downstream
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        // Read all request cookies (name/value only)
        getAll(): { name: string; value: string }[] {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        // Write refreshed cookies to the response
        setAll(cookies: SetAllCookie[]): void {
          cookies.forEach(({ name, value, options }) => {
            const nextOptions = toNextCookieOptions(options);
            response.cookies.set({ name, value, ...nextOptions });
          });
        },
      },
    }
  );

  // Trigger refresh if needed; cookie updates are applied via setAll above
  await supabase.auth.getUser();

  return response;
}
