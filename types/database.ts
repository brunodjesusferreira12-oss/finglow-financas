export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "income" | "expense";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "income" | "expense";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: "income" | "expense";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          description: string;
          amount: number;
          type: "income" | "expense";
          transaction_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          description: string;
          amount: number;
          type: "income" | "expense";
          transaction_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense";
          transaction_date?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          month: number;
          year: number;
          limit_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          month: number;
          year: number;
          limit_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          month?: number;
          year?: number;
          limit_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          last_four: string | null;
          closing_day: number;
          due_day: number;
          limit_amount: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          last_four?: string | null;
          closing_day: number;
          due_day: number;
          limit_amount?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          last_four?: string | null;
          closing_day?: number;
          due_day?: number;
          limit_amount?: number;
          color?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_cards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_card_purchases: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          category_id: string;
          description: string;
          amount_total: number;
          purchase_date: string;
          installments_count: number;
          is_fixed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          category_id: string;
          description: string;
          amount_total: number;
          purchase_date: string;
          installments_count?: number;
          is_fixed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          card_id?: string;
          category_id?: string;
          description?: string;
          amount_total?: number;
          purchase_date?: string;
          installments_count?: number;
          is_fixed?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_card_purchases_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "credit_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_purchases_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_card_purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          start_date: string;
          deadline: string;
          status: "in_progress" | "completed" | "paused";
          priority: "low" | "medium" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          start_date: string;
          deadline: string;
          status?: "in_progress" | "completed" | "paused";
          priority?: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          title?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          start_date?: string;
          deadline?: string;
          status?: "in_progress" | "completed" | "paused";
          priority?: "low" | "medium" | "high";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "financial_goals_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_type: "income" | "expense";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
