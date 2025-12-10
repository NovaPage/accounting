"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// UI Components
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreateSpaceAction } from "@/app/actions/spaces";

const CURRENCIES = ["COP", "USD", "EUR"] as const;

const Schema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    currency_code: z.enum(CURRENCIES),
});

type FormValues = z.infer<typeof Schema>;

export default function CreateSpaceDialog({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(Schema),
        defaultValues: {
            name: "",
            currency_code: "COP",
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const res = await CreateSpaceAction(values.name, values.currency_code);
            if (res.ok) {
                toast.success("Espacio creado correctamente");
                setOpen(false);
                form.reset();
                router.refresh();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo espacio</DialogTitle>
                    <DialogDescription>
                        Crea un espacio separado para organizar tus finanzas (ej. Negocio,
                        Casa, Viaje).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="name"
                            className="col-span-3"
                            {...form.register("name")}
                            placeholder="Ej. Mi Negocio"
                        />
                    </div>
                    {form.formState.errors.name && (
                        <p className="text-right text-xs text-destructive col-span-4">
                            {form.formState.errors.name.message}
                        </p>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">
                            Moneda
                        </Label>
                        <Select
                            defaultValue={form.getValues("currency_code")}
                            onValueChange={(val) =>
                                form.setValue("currency_code", val as "COP" | "USD" | "EUR")
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </form>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isPending}
                    >
                        {isPending ? "Creando..." : "Crear espacio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
