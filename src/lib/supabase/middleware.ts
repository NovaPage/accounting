/**
 * Keeps Supabase session fresh and syncs cookies at the edge.
 * Uses CookieMethodsServer (new shape): getAll / setAll.
 * No external 'cookie' types required (we define a compatible shape).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/supabase/env";

/** Compatible with cookie.SerializeOptions */
type CookieSerializeOptionsCompat = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: true | false | "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
};

type SetAllCookie = {
  name: string;
  value: string;
  options?: Partial<CookieSerializeOptionsCompat>;
};

/** Next's response cookie options (stricter sameSite) */
type NextCookieOptions = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
};

function toNextCookieOptions(
  options?: Partial<CookieSerializeOptionsCompat>
): NextCookieOptions | undefined {
  if (!options) return undefined;

  const { sameSite, ...rest } = options;
  let normalized: NextCookieOptions["sameSite"];

  if (sameSite === true) normalized = "strict";              // true -> "strict"
  else if (sameSite === false || sameSite === undefined) normalized = undefined; // omit
  else normalized = sameSite;                                 // "lax" | "strict" | "none"

  return { ...rest, sameSite: normalized };
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookies: SetAllCookie[]): void {
          cookies.forEach(({ name, value, options }) => {
            const nextOptions = toNextCookieOptions(options);
            response.cookies.set({ name, value, ...nextOptions });
          });
        },
      },
    }
  );

  // Refresh if needed; cookie updates are applied via setAll()
  await supabase.auth.getUser();

  return response;
}
