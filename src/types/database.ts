export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          currency_code: string
          id: string
          is_archived: boolean | null
          name: string
          order_index: number | null
          space_id: string
          type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency_code?: string
          id?: string
          is_archived?: boolean | null
          name: string
          order_index?: number | null
          space_id: string
          type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency_code?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          order_index?: number | null
          space_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean | null
          name: string
          space_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name: string
          space_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          name?: string
          space_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          joined_at: string
          role: "owner" | "member"
          space_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role: "owner" | "member"
          space_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: "owner" | "member"
          space_id?: string
          user_id?: string
        }
        Relationships: []
      }
      spaces: {
        Row: {
          created_at: string
          currency_code: string | null
          id: string
          name: string | null
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          payee: string | null
          space_id: string
          type: "income" | "expense" | "transfer"
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payee?: string | null
          space_id: string
          type: "income" | "expense" | "transfer"
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payee?: string | null
          space_id?: string
          type?: "income" | "expense" | "transfer"
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
