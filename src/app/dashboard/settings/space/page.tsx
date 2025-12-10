import { getActiveSpace } from "@/lib/space";
import { SpaceSettingsForm } from "@/components/spaces/SpaceSettingsForm";
import { redirect } from "next/navigation";

export default async function SpaceSettingsPage() {
  const space = await getActiveSpace();

  if (!space) {
    redirect("/dashboard");
  }

  // Cast or ensuring type match
  const spaceProps = {
    id: space.id,
    name: space.name || "",
    currency_code: space.currency_code || "COP",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium">Ajustes del Espacio</h3>
        <p className="text-sm text-muted-foreground">
          Configura los detalles de tu espacio de trabajo actual.
        </p>
      </div>
      <SpaceSettingsForm space={spaceProps} />
    </div>
  );
}
