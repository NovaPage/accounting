import { getActiveSpace } from "@/lib/space";
import { SpaceSettingsForm } from "@/components/spaces/SpaceSettingsForm";

export default async function SpaceSettingsPage() {
  const space = await getActiveSpace();

  if (!space) {
    return (
      <div className="space-y-4 max-w-2xl py-12 text-center">
        <h3 className="text-lg font-medium">No se encontró un espacio activo</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona o crea un espacio desde el menú superior para comenzar a administrarlo.
        </p>
      </div>
    );
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
