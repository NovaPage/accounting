// File: src/components/layout/SpaceSwitcherClient.tsx
"use client";

import { useMemo, useTransition, type JSX } from "react";
import { useRouter } from "next/navigation";

// shadcn/ui primitives
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Icons
import { ChevronDown, Check, PlusCircle } from "lucide-react";

// Components
import CreateSpaceDialog from "@/components/spaces/CreateSpaceDialog";

type UISpace = {
  id: string;
  name: string | null;
  currency_code: string | null;
};

type ClientProps = {
  spaces: UISpace[];
  activeId: string | null;
  /** Server Action: receives a FormData with "space_id" and revalidates paths */
  changeSpace: (formData: FormData) => Promise<void>;
};

function spaceLabel(s: UISpace): string {
  // Prefer human name; fallback to generic Spanish label
  return s.name?.trim() || "Espacio sin nombre";
}

function ActiveBadge(): JSX.Element {
  return (
    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      Actual
    </span>
  );
}

export default function SpaceSwitcherClient({
  spaces,
  activeId,
  changeSpace,
}: ClientProps): JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Derive active space object; fallback to the first one
  const active = useMemo(() => {
    return spaces.find((s) => s.id === activeId) ?? spaces[0];
  }, [spaces, activeId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2"
          aria-label="Cambiar espacio"
          aria-expanded={false}
        >
          {spaceLabel(active)}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Selecciona un espacio
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {spaces.map((s) => {
          const isActive = s.id === active.id;

          const onSelect = () => {
            const fd = new FormData();
            fd.set("space_id", s.id);

            startTransition(async () => {
              await changeSpace(fd);
              // Client-side refresh to ensure reactive hooks/components update instantly
              router.refresh();
            });
          };

          return (
            <DropdownMenuItem
              key={s.id}
              onSelect={(e) => {
                e.preventDefault(); // keep dropdown controlled
                if (!isActive && !isPending) onSelect();
              }}
              className="flex cursor-pointer items-center justify-between gap-2"
              disabled={isActive || isPending}
              aria-current={isActive ? "true" : "false"}
            >
              <span className="truncate">
                {spaceLabel(s)}
                {isActive ? <ActiveBadge /> : null}
              </span>
              {isActive ? <Check className="h-4 w-4 opacity-80" /> : null}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <CreateSpaceDialog>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="flex cursor-pointer items-center gap-2 text-primary focus:text-primary"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Crear nuevo espacio</span>
          </DropdownMenuItem>
        </CreateSpaceDialog>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
