"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateSpaceAction } from "@/app/actions/spaces";
import { useRouter } from "next/navigation";

interface SpaceProps {
    id: string;
    name: string;
    currency_code: string;
}

export function SpaceSettingsForm({ space }: { space: SpaceProps }) {
    const [name, setName] = useState(space.name);
    const [currency, setCurrency] = useState(space.currency_code);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await UpdateSpaceAction(space.id, name);
            if (result.ok) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("Error al actualizar el espacio.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                    Actualiza el nombre y la moneda de tu espacio.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdate}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Espacio</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Finanzas Personales"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currency">Moneda (Código ISO)</Label>
                        <Input
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                            placeholder="USD, COP, EUR"
                            maxLength={3}
                            disabled
                        />
                        <p className="text-xs text-muted-foreground">
                            La moneda no se puede cambiar después de crear el espacio (por ahora).
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        ID: {space.id}
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
