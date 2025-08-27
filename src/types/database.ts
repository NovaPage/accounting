// src/types/database.ts

/**
 * Replace this stub with your generated types:
 * npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/database.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
