import { getServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default async function ProfileSettingsPage() {
  const supabase = await getServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "No registrado";
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Desconocido";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium">Mi Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Información general de tu cuenta de usuario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Cuenta</CardTitle>
          <CardDescription>
            Detalles asociados a tu sesión en Orbit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id">ID de Usuario</Label>
            <Input id="id" value={user.id} disabled className="bg-muted text-muted-foreground font-mono text-xs" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="created">Miembro desde</Label>
            <Input id="created" value={createdAt} disabled className="bg-muted text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
