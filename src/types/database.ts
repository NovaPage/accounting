// src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          balance: number;
          currency_code: string;
          is_archived: boolean | null;
          order_index: number | null;
          space_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          balance?: number;
          currency_code?: string;
          is_archived?: boolean | null;
          order_index?: number | null;
          space_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          balance?: number;
          currency_code?: string;
          is_archived?: boolean | null;
          order_index?: number | null;
          space_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          space_id: string;
          is_archived: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          space_id: string;
          is_archived?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          space_id?: string;
          is_archived?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          space_id: string;
          account_id: string;
          category_id: string | null;
          amount: number;
          type: "income" | "expense" | "transfer";
          date: string;
          description: string | null;
          payee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          account_id: string;
          category_id?: string | null;
          amount?: number;
          type: "income" | "expense" | "transfer";
          date?: string;
          description?: string | null;
          payee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          account_id?: string;
          category_id?: string | null;
          amount?: number;
          type?: "income" | "expense" | "transfer";
          date?: string;
          description?: string | null;
          payee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_account_balances: {
        Row: {
          account_id: string;
          space_id: string;
          balance: number;
        };
      };
    };
    Functions: {
      get_dashboard_metrics: {
        Args: {
          p_space_id: string;
        };
        Returns: {
          totalBalance: number;
          monthlyIncome: number;
          monthlyExpenses: number;
          savingsRate: number;
          currencyCode: string;
        };
      };
      get_balances_for_accounts: {
        Args: {
          p_space_id: string;
          p_account_ids: string[];
        };
        Returns: {
          account_id: string;
          balance: number;
        }[];
      };
    };
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};
