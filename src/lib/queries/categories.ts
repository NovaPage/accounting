import { getServerComponentClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";

export type CategoryOption = {
    value: string;
    label: string;
};

export async function fetchCategories(spaceId: string): Promise<CategoryOption[]> {
    const supabase = await getServerComponentClient();

    try {
        const { data, error } = await supabase
            .from("categories")
            .select("id, name")
            .eq("space_id", spaceId)
            .eq("is_archived", false)
            .order("name", { ascending: true });

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((data as any[]) ?? []).map((c) => ({
            value: c.id,
            label: c.name,
        }));
    } catch (e) {
        logError("fetch_categories_failed", { feature: "categories", spaceId }, e);
        return [];
    }
}
