"use server";

import { SpaceService } from "@/lib/services/space.service";
import { readActiveSpaceIdCookie, selectActiveSpaceId } from "@/lib/space";
import { revalidatePath } from "next/cache";

const spaceService = new SpaceService();

export async function CreateSpaceAction(name: string, currencyCode: string) {
    try {
        const spaceId = await spaceService.createSpace(name, currencyCode);

        if (!spaceId) {
            return { ok: false, message: "Error al crear el espacio." };
        }

        // Automatically switch to the new space
        await selectActiveSpaceId(spaceId);

        revalidatePath("/");
        return { ok: true, message: "Espacio creado." };
    } catch {
        return { ok: false, message: "Error inesperado." };
    }
}

export async function InviteMemberAction(email: string, spaceIdOverride?: string) {
    try {
        let spaceId: string | null | undefined = spaceIdOverride;
        if (!spaceId) {
            spaceId = await readActiveSpaceIdCookie();
        }

        if (!spaceId) {
            return { ok: false, message: "No hay espacio activo seleccionado." };
        }

        const res = await spaceService.inviteMember(spaceId, email);

        if (res.ok) {
            revalidatePath("/dashboard/settings/space/members");
        }

        return res;
    } catch (e) {
        return { ok: false, message: "Error inesperado al invitar." };
    }
}

export async function UpdateSpaceAction(spaceId: string, name: string) {
    try {
        const { error } = await spaceService.updateSpace(spaceId, { name });
        if (error) {
            return { ok: false, message: "Error al actualizar el espacio." };
        }
        revalidatePath("/dashboard/settings/space");
        return { ok: true, message: "Espacio actualizado." };
    } catch (e) {
        return { ok: false, message: "Error inesperado." };
    }
}

export async function RemoveMemberAction(spaceId: string, userId: string) {
    try {
        const { error } = await spaceService.removeMember(spaceId, userId);
        if (error) {
            return { ok: false, message: "Error al eliminar miembro." };
        }
        revalidatePath("/dashboard/settings/space/members");
        return { ok: true, message: "Miembro eliminado." };
    } catch {
        return { ok: false, message: "Error inesperado." };
    }
}
