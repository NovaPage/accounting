import { BaseService } from "./base.service";
import { logError, logInfo } from "@/lib/logging";

export type SpaceRow = {
    id: string;
    name: string | null;
    currency_code: string | null;
    role?: "owner" | "member";
};

export type SpaceMemberRow = {
    user_id: string;
    role: "owner" | "member";
    joined_at: string;
    email?: string; // Populated if available via RPC or separate query
};

export class SpaceService extends BaseService {
    /**
     * Fetch all spaces the current user is a member of.
     */
    async getPersonalSpaces(): Promise<SpaceRow[]> {
        const supabase = await this.getClient();
        const { data: { user }, error: userErr } = await supabase.auth.getUser();

        if (userErr || !user) {
            return [];
        }

        try {
            // Use the RPC if available (recommended for RLS recursion avoidance)
            // @ts-expect-error - RPC might not be in generated types yet
            const { data, error } = await supabase.rpc("get_user_spaces", { p_user_id: user.id });

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data as any[]).map((r) => ({
                id: r.id,
                name: r.name,
                currency_code: r.currency_code,
                role: r.role // RPC should ideally return this, or we infer it
            }));

        } catch (e) {
            logError("fetch_user_spaces_failed", { feature: "spaces", userId: user.id }, e);
            return [];
        }
    }

    /**
     * Create a new space and automatically make the creator the owner.
     */
    async createSpace(name: string, currencyCode: string): Promise<string | null> {
        const supabase = await this.getClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from("spaces")
                .insert({
                    name,
                    currency_code: currencyCode,
                    owner_user_id: user.id
                })
                .select("id")
                .single();

            if (error) throw error;

            logInfo("space_created", { feature: "spaces", spaceId: data.id });
            return data.id;
        } catch (e) {
            logError("create_space_failed", { feature: "spaces" }, e);
            return null;
        }
    }

    /**
     * Fetch members of a specific space.
     */
    async getSpaceMembers(spaceId: string): Promise<SpaceMemberRow[]> {
        const supabase = await this.getClient();

        try {
            const { data, error } = await supabase
                .from("space_members")
                .select("user_id, role, joined_at")
                .eq("space_id", spaceId);

            if (error) throw error;

            // Note: To get emails, we usually need a secure RPC or a view that joins with auth.users
            // For now, returning IDs and roles.
            return data.map(m => ({
                user_id: m.user_id,
                role: m.role as "owner" | "member",
                joined_at: m.joined_at
            }));
        } catch (e) {
            logError("get_space_members_failed", { feature: "spaces", spaceId }, e);
            return [];
        }
    }

    /**
     * Update space details.
     */
    async updateSpace(spaceId: string, updates: { name?: string; currency_code?: string }): Promise<{ error: unknown }> {
        const supabase = await this.getClient();
        try {
            const { error } = await supabase
                .from("spaces")
                .update(updates)
                .eq("id", spaceId);
            return { error };
        } catch (e) {
            logError("update_space_failed", { feature: "spaces", spaceId }, e);
            return { error: e };
        }
    }

    /**
     * Remove a member from the space.
     */
    async removeMember(spaceId: string, userId: string): Promise<{ error: unknown }> {
        const supabase = await this.getClient();
        try {
            const { error } = await supabase
                .from("space_members")
                .delete()
                .eq("space_id", spaceId)
                .eq("user_id", userId);
            return { error };
        } catch (e) {
            logError("remove_member_failed", { feature: "spaces", spaceId, userId }, e);
            return { error: e };
        }
    }

    /**
     * Invite a user by email using a secure RPC.
     */
    async inviteMember(spaceId: string, email: string, role: "member" | "owner" = "member"): Promise<{ ok: boolean; message: string }> {
        const supabase = await this.getClient();

        try {
            // @ts-expect-error - RPC to be created by migration
            const { error } = await supabase.rpc("invite_user_by_email", {
                p_space_id: spaceId,
                p_email: email,
                p_role: role
            });

            if (error) throw error;

            return { ok: true, message: "Usuario invitado correctamente." };
        } catch (e) {
            logError("invite_member_failed", { feature: "spaces", spaceId }, e);
            return { ok: false, message: "No se pudo invitar al usuario. Verifica que el correo esté registrado." };
        }
    }
}
