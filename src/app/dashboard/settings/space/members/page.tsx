import { getActiveSpace } from "@/lib/space";
import { MembersList } from "@/components/spaces/MembersList";
import { SpaceService } from "@/lib/services/space.service";
import { redirect } from "next/navigation";
import { getServerComponentClient } from "@/lib/supabase/server";
import { InviteMemberDialog } from "@/components/spaces/InviteMemberDialog";

export default async function MemberManagementPage() {
    const space = await getActiveSpace();
    if (!space) redirect("/dashboard");

    const service = new SpaceService();
    const members = await service.getSpaceMembers(space.id);

    const supabase = await getServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Gestión de Miembros</h3>
                    <p className="text-sm text-muted-foreground">
                        Invita a tu equipo y gestiona los roles del espacio actual.
                    </p>
                </div>
                <InviteMemberDialog spaceId={space.id} />
            </div>
            <MembersList
                spaceId={space.id}
                members={members}
                currentUserId={user.id}
            />
        </div>
    );
}
