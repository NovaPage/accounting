import { SupabaseClient } from "@supabase/supabase-js";
import { getServerComponentClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

export abstract class BaseService {
    protected supabase: SupabaseClient<Database> | null = null;

    constructor(client?: SupabaseClient<Database>) {
        if (client) {
            this.supabase = client;
        }
    }

    protected async getClient(): Promise<SupabaseClient<Database>> {
        if (this.supabase) {
            return this.supabase;
        }
        this.supabase = await getServerComponentClient();
        return this.supabase;
    }
}
