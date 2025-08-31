// File: src/components/layout/SpaceSwitcher.tsx
/**
 * SpaceSwitcher (Server)
 * - Fetches user spaces (SSR) and reads active space cookie (SSR) for a flicker-free UI.
 * - Defines a Server Action to change the active space id and revalidate dashboard routes.
 * - Renders the Client component with data and the action.
 *
 * UI strings in Spanish; code and comments in English.
 */

import { revalidatePath } from "next/cache";
import {
  fetchUserSpaces,
  readActiveSpaceIdCookie,
  selectActiveSpaceId,
} from "@/lib/space";
import SpaceSwitcherClient from "./SpaceSwitcherClient";
import type { JSX } from "react";

type UISpace = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

export default async function SpaceSwitcher(): Promise<JSX.Element | null> {
  // 1) Load spaces and active space id on the server (no flicker)
  const [spaces, activeId] = await Promise.all([
    fetchUserSpaces(),
    readActiveSpaceIdCookie(),
  ]);

  if (!spaces || spaces.length === 0) return null;

  // 2) Server Action: persist selection and revalidate
  async function changeSpace(formData: FormData): Promise<void> {
    "use server";
    const nextId = String(formData.get("space_id") ?? "");
    if (!nextId) return;

    await selectActiveSpaceId(nextId);

    // Revalidate key dashboard routes (adjust as needed)
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/settings/space");
  }

  // 3) Render Client with data and server action
  const uiSpaces: UISpace[] = spaces.map((s) => ({
    id: s.id,
    name: s.name ?? null,
    currency_code: s.currency_code ?? null,
  }));

  return (
    <SpaceSwitcherClient
      spaces={uiSpaces}
      activeId={activeId}
      changeSpace={changeSpace}
    />
  );
}
